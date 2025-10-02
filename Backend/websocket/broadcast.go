package websocket

import (
	"log"
	"time"
)

// BroadcastMessage adds a message to the broadcast channel
func (h *Hub) BroadcastMessage(message Message) {
	select {
	case h.broadcast <- message:
	default:
		log.Printf("Broadcast channel full, dropping message")
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

// broadcastFollowerCountUpdate broadcasts updated follower counts to a user's profile viewers
func (h *Hub) broadcastFollowerCountUpdate(userID uint) {
	if h.db == nil {
		return
	}

	// Get updated follower counts from database
	followersQuery := `SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'`
	followingQuery := `SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'`

	var followersCount, followingCount int

	err := h.db.QueryRow(followersQuery, userID).Scan(&followersCount)
	if err != nil {
		log.Printf("Failed to get followers count for user %d: %v", userID, err)
		return
	}

	err = h.db.QueryRow(followingQuery, userID).Scan(&followingCount)
	if err != nil {
		log.Printf("Failed to get following count for user %d: %v", userID, err)
		return
	}

	// Broadcast the count update to all connected clients
	countUpdateMessage := Message{
		Type:   MessageTypeFollowerCountUpdate,
		From:   0, // System message
		Action: "count_update",
		Data: map[string]interface{}{
			"user_id":         userID,
			"followers_count": followersCount,
			"following_count": followingCount,
		},
		Timestamp: time.Now().Unix(),
	}

	h.BroadcastMessage(countUpdateMessage)
}
