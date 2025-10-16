package websocket

import (
	"fmt"
	"log"
	"time"
)

// handlePrivateMessage sends a message to a specific user (real-time only, no DB save)
func (h *Hub) handlePrivateMessage(message Message) {

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
			h.mu.Unlock()
			h.safeCloseClient(targetClient)
		}
	} else {
		log.Printf("⚠️  User %d is offline, message not delivered in real-time", message.To)
	}
}

// handleGroupMessage broadcasts a message to all group members (real-time only, no DB save)
func (h *Hub) handleGroupMessage(message Message) {
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
						h.mu.Unlock()
						h.safeCloseClient(c)
					}(client)
				}
			}
		}
	}

	log.Printf("📊 Group message to Group %d | Delivered: %d | Failed: %d",
		message.GroupID, deliveredCount, failedCount)
}

// handleGroupTyping broadcasts typing indicators to all group members INCLUDING the sender
func (h *Hub) handleGroupTyping(message Message) {
	log.Printf("👥 Group typing from User %d to Group %d | Action: %s",
		message.From, message.GroupID, message.Data.(map[string]interface{})["action"])

	// Log the full message being sent
	log.Printf("👥 Group typing message details: %+v", message)

	h.mu.RLock()
	defer h.mu.RUnlock()

	deliveredCount := 0
	failedCount := 0

	for userID, client := range h.clients {
		// For typing indicators, send to ALL group members including the sender
		client.mu.RLock()
		isMember := client.Groups[message.GroupID]
		client.mu.RUnlock()

		if isMember {
			log.Printf("👥 Sending group typing to User %d (is sender: %v)", userID, userID == message.From)
			select {
			case client.Send <- message:
				deliveredCount++
			default:
				// Client's send channel is full, close it
				failedCount++
				log.Printf("❌ Failed to deliver group typing to User %d (channel full)", userID)
				go func(c *Client) {
					h.mu.Lock()
					delete(h.clients, c.ID)
					h.mu.Unlock()
					h.safeCloseClient(c)
				}(client)
			}
		} else {
			log.Printf("👥 User %d is not a member of group %d, skipping", userID, message.GroupID)
		}
	}

	log.Printf("📊 Group typing to Group %d | Delivered: %d | Failed: %d",
		message.GroupID, deliveredCount, failedCount)
}

// handleNotification sends a notification to a specific user
func (h *Hub) handleNotification(message Message) {
	h.handlePrivateMessage(message) // Same logic as private message
}

// handleTypingIndicator handles typing indicators for private and group chats
func (h *Hub) handleTypingIndicator(message Message) {
	log.Printf("🔤 TYPING: From User %d, GroupID: %d, To: %d, Action: %s",
		message.From, message.GroupID, message.To, message.Data.(map[string]interface{})["action"])

	// Log the full message details
	log.Printf("🔤 TYPING message details: %+v", message)

	if message.GroupID > 0 {
		// Group typing indicator - send to ALL members including sender
		log.Printf("👥 Group typing indicator for Group %d", message.GroupID)
		h.handleGroupTyping(message)
	} else {
		// Private typing indicator
		log.Printf("👤 Private typing indicator from %d to %d", message.From, message.To)
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
		// Get user info and current status from database
		var firstName, lastName string
		var status string
		var lastStatusChange *time.Time

		if h.db != nil {
			err := h.db.QueryRow("SELECT first_name, last_name, status, last_status_change FROM users WHERE id = ?", id).
				Scan(&firstName, &lastName, &status, &lastStatusChange)

			if err != nil {
				log.Printf("Failed to get user info for %d: %v", id, err)
				// Fallback to basic info
				firstName = fmt.Sprintf("User %d", id)
				lastName = ""
				status = "online"
			}
		} else {
			firstName = fmt.Sprintf("User %d", id)
			lastName = ""
			status = "online"
		}

		// For invisible users, show them their real status but show as offline to others
		displayStatus := status
		if status == "invisible" && id != userID {
			displayStatus = "offline"
		}

		username := firstName
		if lastName != "" {
			username = firstName + " " + lastName
		}

		userInfo := map[string]interface{}{
			"user_id":   id,
			"username":  username,
			"status":    displayStatus,
			"is_online": status != "offline",
		}

		if lastStatusChange != nil {
			userInfo["last_status_change"] = lastStatusChange.Format(time.RFC3339)
		}

		onlineUsers = append(onlineUsers, userInfo)
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
	log.Printf("Status change request from user %d", message.From)

	if message.Data == nil {
		log.Printf("No data provided for status change from user %d", message.From)
		h.sendStatusChangeResponse(message.From, "error", "No status data provided")
		return
	}

	data, ok := message.Data.(map[string]interface{})
	if !ok {
		log.Printf("Invalid data format for status change from user %d", message.From)
		h.sendStatusChangeResponse(message.From, "error", "Invalid data format")
		return
	}

	userID := message.From
	newStatus, ok := data["status"].(string)
	if !ok {
		log.Printf("Invalid status in status change request from user %d", userID)
		h.sendStatusChangeResponse(userID, "error", "Invalid status format")
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"online":    true,
		"away":      true,
		"busy":      true,
		"invisible": true,
		"offline":   true,
	}

	if !validStatuses[newStatus] {
		log.Printf("Invalid status '%s' from user %d", newStatus, userID)
		h.sendStatusChangeResponse(userID, "error", fmt.Sprintf("Invalid status: %s", newStatus))
		return
	}

	// Update status in database with timestamp
	if h.db != nil {
		_, err := h.db.Exec("UPDATE users SET status = ?, last_status_change = CURRENT_TIMESTAMP WHERE id = ?", newStatus, userID)
		if err != nil {
			log.Printf("Failed to update status for user %d: %v", userID, err)
			h.sendStatusChangeResponse(userID, "error", "Failed to update status")
			return
		}
		log.Printf("Successfully updated user %d status from database to: %s", userID, newStatus)
	}

	// Send success response to the user
	h.sendStatusChangeResponse(userID, "success", fmt.Sprintf("Status updated to %s", newStatus))

	// Determine what status to broadcast to other users
	broadcastStatus := newStatus
	if newStatus == "invisible" {
		// If user is going invisible, broadcast offline status instead
		broadcastStatus = "offline"
		log.Printf("User %d set status to invisible, broadcasting as offline", userID)
	}

	// Broadcast the status change to all other clients
	h.BroadcastUserStatus(userID, broadcastStatus)
}

// sendStatusChangeResponse sends a response back to the user who requested status change
func (h *Hub) sendStatusChangeResponse(userID uint, status, message string) {
	responseMessage := Message{
		Type: MessageTypeUserStatus,
		From: 0, // System message
		To:   userID,
		Data: map[string]interface{}{
			"action":  "status_change_response",
			"status":  status,
			"message": message,
		},
		Timestamp: time.Now().Unix(),
	}

	h.SendToUser(userID, responseMessage)
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

// handleLayoutSync synchronizes layout changes across all user's active sessions
func (h *Hub) handleLayoutSync(message Message) {
	log.Printf("Layout sync from user %d", message.From)

	if message.Data == nil {
		return
	}

	// Send layout sync to all sessions of the same user
	h.mu.RLock()
	defer h.mu.RUnlock()

	userID := message.From
	deliveredCount := 0

	for clientID, client := range h.clients {
		// Send to all sessions of the same user (multi-tab sync)
		if client.ID == userID {
			select {
			case client.Send <- message:
				deliveredCount++
				log.Printf("Layout sync delivered to client %d (user %d)", clientID, userID)
			default:
				log.Printf("Failed to deliver layout sync to client %d (user %d): channel full", clientID, userID)
			}
		}
	}

	log.Printf("Layout sync for user %d delivered to %d sessions", userID, deliveredCount)
}
