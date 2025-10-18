package websocket

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// readPump handles reading messages from the websocket connection
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler for connection health
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var message Message
		err := c.Conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Websocket error: %v", err)
			}
			break
		}

		// Set the sender ID
		message.From = c.ID
		message.Timestamp = time.Now().Unix()

		// Log incoming message from user
		log.Printf("📨 Received message from User %d | Type: %s | To: %d | GroupID: %d | Content: %s",
			message.From, message.Type, message.To, message.GroupID, message.Content)

		// Broadcast the message
		c.Hub.BroadcastMessage(message)
	}
}

// writePump handles writing messages to the websocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}

			// Log outgoing message being sent to client
			log.Printf("📤 Sent message to User %d | Type: %s | From: %d | Content: %s",
				c.ID, message.Type, message.From, message.Content)

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWS handles websocket requests from clients
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID uint) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Websocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:        userID,
		Hub:       h,
		Conn:      conn,
		Send:      make(chan Message, 256),
		Groups:    make(map[uint]bool),
		Following: make(map[uint]bool),
		LastPing:  time.Now(),
		Closed:    false,
	}

	// Load user's group memberships
	if h.db != nil {
		h.loadUserGroups(client)
		h.loadUserFollowing(client)
	}

	client.Hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// AddUserToGroup adds a user to a group for message broadcasting
func (h *Hub) AddUserToGroup(userID, groupID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		if client.Groups == nil {
			client.Groups = make(map[uint]bool)
		}
		client.Groups[groupID] = true
		client.mu.Unlock()
	}
}

// RemoveUserFromGroup removes a user from a group
func (h *Hub) RemoveUserFromGroup(userID, groupID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		delete(client.Groups, groupID)
		client.mu.Unlock()
	}
}

// AddUserToFollowing adds a user to the following list for real-time updates
func (h *Hub) AddUserToFollowing(userID, followingUserID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		if client.Following == nil {
			client.Following = make(map[uint]bool)
		}
		client.Following[followingUserID] = true
		client.mu.Unlock()
	}
}

// RemoveUserFromFollowing removes a user from the following list
func (h *Hub) RemoveUserFromFollowing(userID, followingUserID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		delete(client.Following, followingUserID)
		client.mu.Unlock()
	}
}

// IsUserOnline checks if a user is currently connected
func (h *Hub) IsUserOnline(userID uint) bool {
	h.mu.RLock()
	_, exists := h.clients[userID]
	h.mu.RUnlock()
	return exists
}

// GetOnlineUsers returns a list of currently online user IDs
func (h *Hub) GetOnlineUsers() []uint {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]uint, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// CleanupStaleConnections removes connections that haven't responded to ping in a while
func (h *Hub) CleanupStaleConnections() {
	h.mu.RLock()
	staleClients := make([]*Client, 0)
	now := time.Now()

	for _, client := range h.clients {
		client.mu.RLock()
		if now.Sub(client.LastPing) > 2*time.Minute {
			staleClients = append(staleClients, client)
		}
		client.mu.RUnlock()
	}
	h.mu.RUnlock()

	// Close stale connections
	for _, client := range staleClients {
		client.Conn.Close()
	}
}
