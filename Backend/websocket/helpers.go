package websocket

import (
	"database/sql"
	"fmt"
	"log"
	"social/models"
	"time"
)

// loadUserGroups loads the user's group memberships when they connect
func (h *Hub) loadUserGroups(client *Client) {
	if h.db == nil {
		return
	}

	query := `SELECT group_id FROM group_members WHERE user_id = ? AND status = 'accepted'`
	rows, err := h.db.Query(query, client.ID)
	if err != nil {
		log.Printf("Failed to load groups for user %d: %v", client.ID, err)
		return
	}
	defer rows.Close()

	client.mu.Lock()
	defer client.mu.Unlock()

	for rows.Next() {
		var groupID uint
		if err := rows.Scan(&groupID); err != nil {
			continue
		}
		client.Groups[groupID] = true
	}

	log.Printf("Loaded %d groups for user %d", len(client.Groups), client.ID)
}

// loadUserFollowing loads the user's following relationships when they connect
func (h *Hub) loadUserFollowing(client *Client) {
	if h.db == nil {
		return
	}

	query := `SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'`
	rows, err := h.db.Query(query, client.ID)
	if err != nil {
		log.Printf("Failed to load following for user %d: %v", client.ID, err)
		return
	}
	defer rows.Close()

	client.mu.Lock()
	defer client.mu.Unlock()

	for rows.Next() {
		var followingID uint
		if err := rows.Scan(&followingID); err != nil {
			continue
		}
		client.Following[followingID] = true
	}

	log.Printf("Loaded %d following relationships for user %d", len(client.Following), client.ID)
}

// sendErrorMessage sends an error message to a user
func (h *Hub) sendErrorMessage(userID uint, errorMsg string) {
	h.SendToUser(userID, Message{
		Type:      MessageTypeError,
		From:      0, // System message
		To:        userID,
		Content:   errorMsg,
		Timestamp: time.Now().Unix(),
	})
}

// savePrivateMessageToDB saves a private message to the database
func (h *Hub) savePrivateMessageToDB(message *models.Message) error {
	// Check if users can message each other
	canMessage, err := h.canUsersMessage(message.SenderID, message.ReceiverID)
	if err != nil || !canMessage {
		return fmt.Errorf("users cannot message each other")
	}

	query := `
		INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`

	now := time.Now()
	result, err := h.db.Exec(query, message.SenderID, message.ReceiverID, message.Content, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	message.ID = uint(id)
	message.MessageType = "private"
	message.IsRead = false
	message.CreatedAt = now
	message.UpdatedAt = now

	// Create or update conversation
	err = h.createOrUpdatePrivateConversation(message.SenderID, message.ReceiverID, uint(id))
	if err != nil {
		log.Printf("Failed to update conversation: %v", err)
	}

	// Create notification for the receiver
	h.createMessageNotification(message.SenderID, message.ReceiverID, message.ID)

	return nil
}

// saveGroupMessageToDB saves a group message to the database
func (h *Hub) saveGroupMessageToDB(message *models.Message) error {
	// Check if user is a member of the group
	isMember, err := h.isUserGroupMember(*message.GroupID, message.SenderID)
	if err != nil || !isMember {
		return fmt.Errorf("user is not a group member")
	}

	query := `
		INSERT INTO messages (sender_id, group_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`

	now := time.Now()
	result, err := h.db.Exec(query, message.SenderID, message.GroupID, message.Content, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	message.ID = uint(id)
	message.MessageType = "group"
	message.IsRead = false
	message.CreatedAt = now
	message.UpdatedAt = now

	// Create or update group conversation
	err = h.createOrUpdateGroupConversation(*message.GroupID, uint(id))
	if err != nil {
		log.Printf("Failed to update group conversation: %v", err)
	}

	return nil
}

// canUsersMessage checks if two users can message each other
func (h *Hub) canUsersMessage(senderID, receiverID uint) (bool, error) {
	// Check if they follow each other or if receiver has public profile
	query := `
		SELECT 1 FROM follows 
		WHERE (follower_id = ? AND following_id = ? AND status = 'accepted')
		   OR (follower_id = ? AND following_id = ? AND status = 'accepted')
		LIMIT 1
	`

	var exists int
	err := h.db.QueryRow(query, senderID, receiverID, receiverID, senderID).Scan(&exists)
	if err == nil {
		return true, nil // They follow each other
	}

	// Check if receiver has public profile
	var isPrivate bool
	err = h.db.QueryRow("SELECT is_private FROM users WHERE id = ?", receiverID).Scan(&isPrivate)
	if err != nil {
		return false, err
	}

	return !isPrivate, nil // Can message if receiver is not private
}

// isUserGroupMember checks if a user is a member of a group
func (h *Hub) isUserGroupMember(groupID, userID uint) (bool, error) {
	query := `SELECT COUNT(*) FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'accepted'`
	var count int
	err := h.db.QueryRow(query, groupID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// createOrUpdatePrivateConversation creates or updates a private conversation
func (h *Hub) createOrUpdatePrivateConversation(user1ID, user2ID, messageID uint) error {
	// Check if conversation exists
	var conversationID uint
	query := `
		SELECT id FROM conversations 
		WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
	`

	err := h.db.QueryRow(query, user1ID, user2ID, user2ID, user1ID).Scan(&conversationID)
	if err == sql.ErrNoRows {
		// Create new conversation
		insertQuery := `
			INSERT INTO conversations (user1_id, user2_id, last_message_id, updated_at) 
			VALUES (?, ?, ?, ?)
		`
		_, err = h.db.Exec(insertQuery, user1ID, user2ID, messageID, time.Now())
	} else if err == nil {
		// Update existing conversation
		updateQuery := `UPDATE conversations SET last_message_id = ?, updated_at = ? WHERE id = ?`
		_, err = h.db.Exec(updateQuery, messageID, time.Now(), conversationID)
	}

	return err
}

// createOrUpdateGroupConversation creates or updates a group conversation
func (h *Hub) createOrUpdateGroupConversation(groupID, messageID uint) error {
	// Check if group conversation exists
	var conversationID uint
	query := `SELECT id FROM group_conversations WHERE group_id = ?`

	err := h.db.QueryRow(query, groupID).Scan(&conversationID)
	if err == sql.ErrNoRows {
		// Create new group conversation
		insertQuery := `
			INSERT INTO group_conversations (group_id, last_message_id, created_at, updated_at) 
			VALUES (?, ?, ?, ?)
		`
		now := time.Now()
		_, err = h.db.Exec(insertQuery, groupID, messageID, now, now)
	} else if err == nil {
		// Update existing conversation
		updateQuery := `UPDATE group_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?`
		_, err = h.db.Exec(updateQuery, messageID, time.Now(), conversationID)
	}

	return err
}

// createMessageNotification creates a notification for a new message
func (h *Hub) createMessageNotification(senderID, receiverID, messageID uint) {
	// Get sender info
	senderQuery := `SELECT first_name, last_name FROM users WHERE id = ?`
	var firstName, lastName string
	err := h.db.QueryRow(senderQuery, senderID).Scan(&firstName, &lastName)
	if err != nil {
		log.Printf("Failed to get sender info for notification: %v", err)
		return
	}

	// Create notification
	notificationQuery := `
		INSERT INTO notifications (user_id, type, message, reference_id, is_read, created_at, updated_at)
		VALUES (?, 'message', ?, ?, false, ?, ?)
	`

	message := fmt.Sprintf("%s %s sent you a message", firstName, lastName)
	now := time.Now()

	_, err = h.db.Exec(notificationQuery, receiverID, message, messageID, now, now)
	if err != nil {
		log.Printf("Failed to create message notification: %v", err)
	}
}

