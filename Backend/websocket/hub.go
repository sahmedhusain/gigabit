package websocket

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin in development
		// In production, implement proper origin checking
		return true
	},
}

// Message types
const (
	MessageTypePrivateMessage = "private_message"
	MessageTypeGroupMessage   = "group_message"
	MessageTypeNotification   = "notification"
	MessageTypeUserStatus     = "user_status"
	MessageTypeTyping         = "typing"
	MessageTypePostUpdate     = "post_update"
	MessageTypeCommentUpdate  = "comment_update"
	MessageTypeLikeUpdate     = "like_update"
	MessageTypeFollowUpdate   = "follow_update"
	MessageTypeGroupUpdate    = "group_update"
	MessageTypeEventUpdate    = "event_update"
	MessageTypeCategoryUpdate = "category_update"
	MessageTypeError          = "error"
	MessageTypePing           = "ping"
	MessageTypePong           = "pong"
)

// Message represents a websocket message
type Message struct {
	Type      string      `json:"type"`
	From      uint        `json:"from"`
	To        uint        `json:"to,omitempty"`        // For private messages
	GroupID   uint        `json:"group_id,omitempty"`  // For group messages
	PostID    uint        `json:"post_id,omitempty"`   // For post updates
	EventID   uint        `json:"event_id,omitempty"`  // For event updates
	Content   string      `json:"content"`
	Action    string      `json:"action,omitempty"`    // create, update, delete, like, unlike
	Data      interface{} `json:"data,omitempty"`
	MessageID string      `json:"message_id,omitempty"` // For message deduplication
	Timestamp int64       `json:"timestamp"`
}

// Client represents a websocket client
type Client struct {
	ID        uint
	Hub       *Hub
	Conn      *websocket.Conn
	Send      chan Message
	Groups    map[uint]bool // Groups the user is member of
	Following map[uint]bool // Users this client is following (for feed updates)
	LastPing  time.Time     // Last ping time for connection health
	mu        sync.RWMutex
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients mapped by user ID
	clients map[uint]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Inbound messages from clients
	broadcast chan Message

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

// NewHub creates a new websocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

// Run starts the hub and handles client registration, unregistration, and message broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("Client %d connected", client.ID)

			// Send user status update to other clients
			h.broadcastUserStatus(client.ID, "online")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
				h.mu.Unlock()
				log.Printf("Client %d disconnected", client.ID)

				// Send user status update to other clients
				h.broadcastUserStatus(client.ID, "offline")
			} else {
				h.mu.Unlock()
			}

		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}

// handleMessage processes different types of messages
func (h *Hub) handleMessage(message Message) {
	switch message.Type {
	case MessageTypePrivateMessage:
		h.handlePrivateMessage(message)
	case MessageTypeGroupMessage:
		h.handleGroupMessage(message)
	case MessageTypeNotification:
		h.handleNotification(message)
	case MessageTypeTyping:
		h.handleTypingIndicator(message)
	case MessageTypePostUpdate:
		h.handlePostUpdate(message)
	case MessageTypeCommentUpdate:
		h.handleCommentUpdate(message)
	case MessageTypeLikeUpdate:
		h.handleLikeUpdate(message)
	case MessageTypeFollowUpdate:
		h.handleFollowUpdate(message)
	case MessageTypeGroupUpdate:
		h.handleGroupUpdate(message)
	case MessageTypeEventUpdate:
		h.handleEventUpdate(message)
	case MessageTypePing:
		h.handlePing(message)
	case MessageTypePong:
		h.handlePong(message)
	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

// handlePrivateMessage sends a message to a specific user
func (h *Hub) handlePrivateMessage(message Message) {
	h.mu.RLock()
	targetClient, exists := h.clients[message.To]
	h.mu.RUnlock()

	if exists {
		select {
		case targetClient.Send <- message:
		default:
			// Client's send channel is full, close it
			h.mu.Lock()
			delete(h.clients, targetClient.ID)
			close(targetClient.Send)
			h.mu.Unlock()
		}
	}
}

// handleGroupMessage broadcasts a message to all group members
func (h *Hub) handleGroupMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			client.mu.RLock()
			isMember := client.Groups[message.GroupID]
			client.mu.RUnlock()

			if isMember {
				select {
				case client.Send <- message:
				default:
					// Client's send channel is full, close it
					go func(c *Client) {
						h.mu.Lock()
						delete(h.clients, c.ID)
						close(c.Send)
						h.mu.Unlock()
					}(client)
				}
			}
		}
	}
}

// handleNotification sends a notification to a specific user
func (h *Hub) handleNotification(message Message) {
	h.handlePrivateMessage(message) // Same logic as private message
}

// handleTypingIndicator handles typing indicators for private and group chats
func (h *Hub) handleTypingIndicator(message Message) {
	if message.GroupID > 0 {
		// Group typing indicator
		h.handleGroupMessage(message)
	} else {
		// Private typing indicator
		h.handlePrivateMessage(message)
	}
}

// broadcastUserStatus sends user status updates to all connected clients
func (h *Hub) broadcastUserStatus(userID uint, status string) {
	message := Message{
		Type: MessageTypeUserStatus,
		From: userID,
		Data: map[string]interface{}{
			"user_id": userID,
			"status":  status,
		},
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		if client.ID != userID { // Don't send to the user themselves
			select {
			case client.Send <- message:
			default:
				// Client's send channel is full, close it
				go func(c *Client) {
					h.mu.Lock()
					delete(h.clients, c.ID)
					close(c.Send)
					h.mu.Unlock()
				}(client)
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID uint, message Message) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		select {
		case client.Send <- message:
		default:
			// Client's send channel is full
			log.Printf("Failed to send message to user %d: send channel full", userID)
		}
	}
}

// SendToGroup sends a message to all members of a group
func (h *Hub) SendToGroup(groupID uint, message Message, excludeUserID uint) {
	message.GroupID = groupID
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != excludeUserID {
			client.mu.RLock()
			isMember := client.Groups[groupID]
			client.mu.RUnlock()

			if isMember {
				select {
				case client.Send <- message:
				default:
					log.Printf("Failed to send message to user %d in group %d", userID, groupID)
				}
			}
		}
	}
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

// BroadcastMessage adds a message to the broadcast channel
func (h *Hub) BroadcastMessage(message Message) {
	select {
	case h.broadcast <- message:
	default:
		log.Printf("Broadcast channel full, dropping message")
	}
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
	}

	client.Hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// handlePostUpdate broadcasts post updates to followers
func (h *Hub) handlePostUpdate(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			client.mu.RLock()
			isFollowing := client.Following[message.From]
			client.mu.RUnlock()

			// Send to followers or if it's a public post update
			if isFollowing || message.Action == "create" {
				select {
				case client.Send <- message:
				default:
					log.Printf("Failed to send post update to user %d", userID)
				}
			}
		}
	}
}

// handleCommentUpdate broadcasts comment updates to post author and commenters
func (h *Hub) handleCommentUpdate(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// For now, broadcast to all connected clients
	// In a real implementation, you'd track who should receive comment updates
	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			select {
			case client.Send <- message:
			default:
				log.Printf("Failed to send comment update to user %d", userID)
			}
		}
	}
}

// handleLikeUpdate broadcasts like updates to post author
func (h *Hub) handleLikeUpdate(message Message) {
	if message.To > 0 { // If we know who to send to
		h.handlePrivateMessage(message)
	} else {
		// Broadcast to interested parties
		h.mu.RLock()
		defer h.mu.RUnlock()

		for userID, client := range h.clients {
			if userID != message.From { // Don't send back to sender
				select {
				case client.Send <- message:
				default:
					log.Printf("Failed to send like update to user %d", userID)
				}
			}
		}
	}
}

// handleFollowUpdate broadcasts follow updates
func (h *Hub) handleFollowUpdate(message Message) {
	// Send to the user being followed
	if message.To > 0 {
		h.handlePrivateMessage(message)
	}
}

// handleGroupUpdate broadcasts group updates to group members
func (h *Hub) handleGroupUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

// handleEventUpdate broadcasts event updates to group members
func (h *Hub) handleEventUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

// handlePing responds to ping messages with pong
func (h *Hub) handlePing(message Message) {
	h.mu.RLock()
	client, exists := h.clients[message.From]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		client.LastPing = time.Now()
		client.mu.Unlock()

		pongMessage := Message{
			Type:      MessageTypePong,
			From:      0, // Server response
			To:        message.From,
			Timestamp: time.Now().Unix(),
		}

		select {
		case client.Send <- pongMessage:
		default:
			log.Printf("Failed to send pong to user %d", message.From)
		}
	}
}

// handlePong handles pong responses from clients
func (h *Hub) handlePong(message Message) {
	h.mu.RLock()
	client, exists := h.clients[message.From]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		client.LastPing = time.Now()
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

// BroadcastPostUpdate broadcasts a post update to relevant users
func (h *Hub) BroadcastPostUpdate(postID, authorID uint, action string, postData interface{}) {
	message := Message{
		Type:      MessageTypePostUpdate,
		From:      authorID,
		PostID:    postID,
		Action:    action,
		Data:      postData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastCommentUpdate broadcasts a comment update
func (h *Hub) BroadcastCommentUpdate(postID uint, commentID, authorID uint, action string, commentData interface{}) {
	message := Message{
		Type:      MessageTypeCommentUpdate,
		From:      authorID,
		PostID:    postID,
		Action:    action,
		Data:      commentData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastLikeUpdate broadcasts a like update
func (h *Hub) BroadcastLikeUpdate(postID, userID uint, action string, likeData interface{}) {
	message := Message{
		Type:      MessageTypeLikeUpdate,
		From:      userID,
		PostID:    postID,
		Action:    action,
		Data:      likeData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastFollowUpdate broadcasts a follow update
func (h *Hub) BroadcastFollowUpdate(fromUserID, toUserID uint, action string, followData interface{}) {
	message := Message{
		Type:      MessageTypeFollowUpdate,
		From:      fromUserID,
		To:        toUserID,
		Action:    action,
		Data:      followData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastToAll broadcasts a message to all connected users
func (h *Hub) BroadcastToAll(messageType, action string, data interface{}) {
	message := Message{
		Type:      messageType,
		From:      0, // System message
		Action:    action,
		Data:      data,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
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