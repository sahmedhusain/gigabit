package websocket

import (
	"time"
)

// handlePrivateMessage sends a message to both sender and receiver (for real-time updates)
func (h *Hub) handlePrivateMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if targetClient, exists := h.clients[message.To]; exists {
		select {
		case targetClient.Send <- message:
		default:
			go func(c *Client) {
				h.mu.Lock()
				delete(h.clients, c.ID)
				h.mu.Unlock()
				h.safeCloseClient(c)
			}(targetClient)
		}
	}
	if senderClient, exists := h.clients[message.From]; exists {
		select {
		case senderClient.Send <- message:
		default:
			go func(c *Client) {
				h.mu.Lock()
				delete(h.clients, c.ID)
				h.mu.Unlock()
				h.safeCloseClient(c)
			}(senderClient)
		}
	}
}

// handleGroupMessage broadcasts a message to all group members INCLUDING the sender (for real-time updates)
func (h *Hub) handleGroupMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, client := range h.clients {
		client.mu.RLock()
		isMember := client.Groups[message.GroupID]
		client.mu.RUnlock()
		if isMember {
			select {
			case client.Send <- message:
			default:
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

// handleGroupTyping broadcasts typing indicators to all group members INCLUDING the sender
func (h *Hub) handleGroupTyping(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, client := range h.clients {
		client.mu.RLock()
		isMember := client.Groups[message.GroupID]
		client.mu.RUnlock()
		if isMember {
			select {
			case client.Send <- message:
			default:
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

// handleNotification sends a notification to a specific user
func (h *Hub) handleNotification(message Message) {
	h.handlePrivateMessage(message)
}

// handleTypingIndicator handles typing indicators for private and group chats
func (h *Hub) handleTypingIndicator(message Message) {
	if message.GroupID > 0 {
		h.handleGroupTyping(message)
	} else {
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
	}
}

// handleGetOnlineUsers sends the list of online users to the requesting client
func (h *Hub) handleGetOnlineUsers(userID uint) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	onlineUsers := make([]map[string]interface{}, 0, len(h.clients))
	for id := range h.clients {
		var firstName, lastName string
		var status string
		var lastStatusChange *time.Time
		if h.db != nil {
			err := h.db.QueryRow("SELECT first_name, last_name, status, last_status_change FROM users WHERE id = ?", id).
				Scan(&firstName, &lastName, &status, &lastStatusChange)
			if err != nil {
				firstName = ""
				lastName = ""
				status = "online"
			}
		} else {
			firstName = ""
			lastName = ""
			status = "online"
		}
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
		From: 0,
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
	if message.Data == nil {
		h.sendStatusChangeResponse(message.From, "error", "No status data provided")
		return
	}
	data, ok := message.Data.(map[string]interface{})
	if !ok {
		h.sendStatusChangeResponse(message.From, "error", "Invalid data format")
		return
	}
	userID := message.From
	newStatus, ok := data["status"].(string)
	if !ok {
		h.sendStatusChangeResponse(userID, "error", "Invalid status format")
		return
	}
	validStatuses := map[string]bool{
		"online":    true,
		"away":      true,
		"busy":      true,
		"invisible": true,
		"offline":   true,
	}
	if !validStatuses[newStatus] {
		h.sendStatusChangeResponse(userID, "error", "Invalid status")
		return
	}
	if h.db != nil {
		_, err := h.db.Exec("UPDATE users SET status = ?, last_status_change = CURRENT_TIMESTAMP WHERE id = ?", newStatus, userID)
		if err != nil {
			h.sendStatusChangeResponse(userID, "error", "Failed to update status")
			return
		}
	}
	h.sendStatusChangeResponse(userID, "success", "Status updated")
	broadcastStatus := newStatus
	if newStatus == "invisible" {
		broadcastStatus = "offline"
	}
	h.BroadcastUserStatus(userID, broadcastStatus)
}

// sendStatusChangeResponse sends a response back to the user who requested status change
func (h *Hub) sendStatusChangeResponse(userID uint, status, message string) {
	responseMessage := Message{
		Type: MessageTypeUserStatus,
		From: 0,
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
			From:      0,
			To:        message.From,
			Timestamp: time.Now().Unix(),
		}
		select {
		case client.Send <- pongMessage:
		default:
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

// handleMessageDeleted sends message deletion notifications to the appropriate recipients
func (h *Hub) handleMessageDeleted(message Message) {
	if message.GroupID > 0 {
		// Group message deletion - send to all group members
		h.mu.RLock()
		defer h.mu.RUnlock()
		for _, client := range h.clients {
			client.mu.RLock()
			isMember := client.Groups[message.GroupID]
			client.mu.RUnlock()
			if isMember {
				select {
				case client.Send <- message:
				default:
					go func(c *Client) {
						h.mu.Lock()
						delete(h.clients, c.ID)
						h.mu.Unlock()
						h.safeCloseClient(c)
					}(client)
				}
			}
		}
	} else if message.To > 0 {
		h.mu.RLock()
		defer h.mu.RUnlock()

		if targetClient, exists := h.clients[message.To]; exists {
			select {
			case targetClient.Send <- message:
			default:
				go func(c *Client) {
					h.mu.Lock()
					delete(h.clients, c.ID)
					h.mu.Unlock()
					h.safeCloseClient(c)
				}(targetClient)
			}
		}

		// Send to sender (to update their view as well)
		if senderClient, exists := h.clients[message.From]; exists {
			select {
			case senderClient.Send <- message:
			default:
				go func(c *Client) {
					h.mu.Lock()
					delete(h.clients, c.ID)
					h.mu.Unlock()
					h.safeCloseClient(c)
				}(senderClient)
			}
		}
	}
}
