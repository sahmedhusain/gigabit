package websocket

import (
	"fmt"
	"log"
	"time"
)

// handlePrivateMessage sends a message to a specific user (real-time only, no DB save)
func (h *Hub) handlePrivateMessage(message Message) {
	// WebSocket is for real-time delivery only
	// Message persistence is handled by the HTTP API endpoint

	log.Printf("💬 Private message from User %d to User %d | Content: %s",
		message.From, message.To, message.Content)

	h.mu.RLock()
	targetClient, exists := h.clients[message.To]
	h.mu.RUnlock()

	if exists {
		select {
		case targetClient.Send <- message:
			log.Printf("✅ Private message delivered to User %d", message.To)
		default:
			// Client's send channel is full, close it
			log.Printf("❌ Failed to deliver private message to User %d (channel full)", message.To)
			h.mu.Lock()
			delete(h.clients, targetClient.ID)
			close(targetClient.Send)
			h.mu.Unlock()
		}
	} else {
		log.Printf("⚠️  User %d is offline, message not delivered in real-time", message.To)
	}
}

// handleGroupMessage broadcasts a message to all group members (real-time only, no DB save)
func (h *Hub) handleGroupMessage(message Message) {
	// WebSocket is for real-time delivery only
	// Message persistence is handled by the HTTP API endpoint

	log.Printf("👥 Group message from User %d to Group %d | Content: %s",
		message.From, message.GroupID, message.Content)

	h.mu.RLock()
	defer h.mu.RUnlock()

	deliveredCount := 0
	failedCount := 0

	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			client.mu.RLock()
			isMember := client.Groups[message.GroupID]
			client.mu.RUnlock()

			if isMember {
				select {
				case client.Send <- message:
					deliveredCount++
				default:
					// Client's send channel is full, close it
					failedCount++
					log.Printf("❌ Failed to deliver group message to User %d (channel full)", userID)
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

	log.Printf("📊 Group message to Group %d | Delivered: %d | Failed: %d",
		message.GroupID, deliveredCount, failedCount)
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

// handleUserStatus handles user status related messages
func (h *Hub) handleUserStatus(message Message) {
	if message.Data == nil {
		return
	}

	data, ok := message.Data.(map[string]interface{})
	if !ok {
		return
	}

	action, ok := data["action"].(string)
	if !ok {
		return
	}

	switch action {
	case "get_online_users":
		h.handleGetOnlineUsers(message.From)
	case "status_change":
		h.handleStatusChange(message)
	default:
		log.Printf("Unknown user status action: %s", action)
	}
}

// handleGetOnlineUsers sends the list of online users to the requesting client
func (h *Hub) handleGetOnlineUsers(userID uint) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	onlineUsers := make([]map[string]interface{}, 0, len(h.clients))
	for id := range h.clients {
		// Get user info from database if available
		var username string
		if h.db != nil {
			var firstName, lastName string
			err := h.db.QueryRow("SELECT first_name, last_name FROM users WHERE id = ?", id).Scan(&firstName, &lastName)
			if err == nil {
				username = firstName + " " + lastName
			}
		}

		if username == "" {
			username = fmt.Sprintf("User %d", id)
		}

		onlineUsers = append(onlineUsers, map[string]interface{}{
			"user_id":   id,
			"username":  username,
			"is_online": true,
		})
	}

	responseMessage := Message{
		Type: MessageTypeUserStatus,
		From: 0, // System message
		To:   userID,
		Data: map[string]interface{}{
			"online_users": onlineUsers,
		},
		Timestamp: time.Now().Unix(),
	}

	h.SendToUser(userID, responseMessage)
}

// handleStatusChange handles user status change requests
func (h *Hub) handleStatusChange(message Message) {
	// For now, we only handle online/offline status automatically
	// Custom status changes can be implemented later
	log.Printf("Status change request from user %d", message.From)
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

