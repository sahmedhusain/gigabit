package websocket

import (
	"fmt"
	"time"
)

// BroadcastMessage adds a message to the broadcast channel
func (h *Hub) BroadcastMessage(message Message) {
	select {
	case h.broadcast <- message:
	default:
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
				}
			}
		}
	}
}

// BroadcastUserStatus sends user status updates to all connected clients
func (h *Hub) BroadcastUserStatus(userID uint, status string) {
	var username string
	var lastStatusChange *time.Time
	if h.db != nil {
		var firstName, lastName string
		err := h.db.QueryRow("SELECT first_name, last_name, last_status_change FROM users WHERE id = ?", userID).
			Scan(&firstName, &lastName, &lastStatusChange)
		if err == nil {
			username = firstName + " " + lastName
		}
	}
	if username == "" {
		username = fmt.Sprintf("User %d", userID)
	}
	messageData := map[string]interface{}{
		"user_id":  userID,
		"username": username,
		"status":   status,
	}
	if lastStatusChange != nil {
		messageData["last_status_change"] = lastStatusChange.Format(time.RFC3339)
	}
	message := Message{
		Type: MessageTypeUserStatus,
		From: userID,
		Data: messageData,
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, client := range h.clients {
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
		From:      0,
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
	followersQuery := `SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'`
	followingQuery := `SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'`
	var followersCount, followingCount int
	err := h.db.QueryRow(followersQuery, userID).Scan(&followersCount)
	if err != nil {
		return
	}
	err = h.db.QueryRow(followingQuery, userID).Scan(&followingCount)
	if err != nil {
		return
	}
	countUpdateMessage := Message{
		Type:   MessageTypeFollowerCountUpdate,
		From:   0,
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

// BroadcastEventUpdate broadcasts an event update to group members
func (h *Hub) BroadcastEventUpdate(eventID, groupID, userID uint, action string, eventData interface{}) {
	message := Message{
		Type:      MessageTypeEventUpdate,
		From:      userID,
		GroupID:   groupID,
		EventID:   eventID,
		Action:    action,
		Data:      eventData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastPollUpdate broadcasts a poll update to group members
func (h *Hub) BroadcastPollUpdate(pollID, groupID, userID uint, action string, pollData interface{}) {
	message := Message{
		Type:      MessageTypePollUpdate,
		From:      userID,
		GroupID:   groupID,
		Action:    action,
		Data:      pollData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastPollVoteUpdate broadcasts a poll vote update to group members
func (h *Hub) BroadcastPollVoteUpdate(pollID, groupID, userID uint, action string, voteData interface{}) {
	message := Message{
		Type:      MessageTypePollVoteUpdate,
		From:      userID,
		GroupID:   groupID,
		Action:    action,
		Data:      voteData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}
