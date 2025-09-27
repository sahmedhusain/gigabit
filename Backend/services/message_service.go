package services

import (
	"database/sql"
	"fmt"
	"social/models"
	"strings"
	"time"
)

type MessageService struct {
	db *sql.DB
}

func NewMessageService(db *sql.DB) *MessageService {
	return &MessageService{db: db}
}

func (s *MessageService) SendPrivateMessage(message *models.Message) error {
	// Check if users are following each other or one has public profile
	canMessage, err := s.canUsersMessage(message.SenderID, message.ReceiverID)
	if err != nil || !canMessage {
		return sql.ErrNoRows // Unauthorized to message
	}

	query := `
	INSERT INTO private_messages (conversation_id, sender_id, content, is_read, created_at)
	VALUES (?, ?, ?, false, ?)
	`

	now := time.Now()

	// Get or create conversation first
	conversationID, err := s.getOrCreatePrivateConversation(message.SenderID, message.ReceiverID)
	if err != nil {
		return err
	}

	result, err := s.db.Exec(query, conversationID, message.SenderID, message.Content, now)
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

	// Update conversation with last message
	err = s.updatePrivateConversationLastMessage(conversationID, uint(id))
	if err != nil {
		// Log error but don't fail the message send
		fmt.Printf("Failed to update conversation: %v\n", err)
	}

	// Create notification for the receiver
	s.createMessageNotification(message.SenderID, message.ReceiverID, message.ID)

	return nil
}

func (s *MessageService) SendGroupMessage(message *models.Message) error {
	// Check if user is a member of the group
	isMember, err := s.isUserGroupMember(*message.GroupID, message.SenderID)
	if err != nil || !isMember {
		return sql.ErrNoRows // Unauthorized
	}

	query := `
	INSERT INTO group_messages (conversation_id, sender_id, content, is_read, created_at)
	VALUES (?, ?, ?, false, ?)
	`

	now := time.Now()

	// Get or create conversation first
	conversationID, err := s.getOrCreateGroupConversation(*message.GroupID)
	if err != nil {
		return err
	}

	result, err := s.db.Exec(query, conversationID, message.SenderID, message.Content, now)
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

	// Update conversation with last message
	err = s.updateGroupConversationLastMessage(conversationID, uint(id))
	if err != nil {
		// Log error but don't fail the message send
		fmt.Printf("Failed to update group conversation: %v\n", err)
	}

	return nil
}

func (s *MessageService) GetPrivateMessages(userID1, userID2 uint, limit, offset int) ([]models.MessageResponse, error) {
	// Check if users can message each other
	canMessage, err := s.canUsersMessage(userID1, userID2)
	if err != nil || !canMessage {
		return nil, sql.ErrNoRows
	}

	// Get conversation ID first
	conversationID, err := s.GetPrivateConversationID(userID1, userID2)
	if err != nil {
		return nil, err
	}

	query := `
	SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
	   u.first_name, u.last_name, u.avatar, u.nickname
	FROM private_messages m
	JOIN users u ON m.sender_id = u.id
	WHERE m.conversation_id = ?
	ORDER BY m.created_at DESC
	LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, conversationID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.MessageResponse
	for rows.Next() {
		var message models.MessageResponse
		var sender models.UserResponse

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.Content, &message.IsRead, &message.CreatedAt,
			&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
		)
		if err != nil {
			return nil, err
		}

		sender.ID = message.SenderID
		message.Sender = sender
		message.MessageType = "private"
		message.UpdatedAt = message.CreatedAt // Use created_at as fallback

		// Set receiver ID based on who is not the sender
		if message.SenderID == userID1 {
			message.ReceiverID = userID2
		} else {
			message.ReceiverID = userID1
		}

		messages = append(messages, message)
	}

	return messages, nil
}

func (s *MessageService) GetGroupMessages(groupID, userID uint, limit, offset int) ([]models.MessageResponse, error) {
	// Check if user is a member of the group
	isMember, err := s.isUserGroupMember(groupID, userID)
	if err != nil || !isMember {
		return nil, sql.ErrNoRows
	}

	// Get conversation ID first
	conversationID, err := s.GetGroupConversationID(groupID)
	if err != nil {
		return nil, err
	}

	query := `
	SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
	   u.first_name, u.last_name, u.avatar, u.nickname,
	   g.name
	FROM group_messages m
	JOIN users u ON m.sender_id = u.id
	JOIN groups g ON g.id = ?
	WHERE m.conversation_id = ?
	ORDER BY m.created_at DESC
	LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, groupID, conversationID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.MessageResponse
	for rows.Next() {
		var message models.MessageResponse
		var sender models.UserResponse
		var groupName string

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.Content, &message.IsRead, &message.CreatedAt,
			&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
			&groupName,
		)
		if err != nil {
			return nil, err
		}

		sender.ID = message.SenderID
		message.Sender = sender
		message.MessageType = "group"
		message.GroupID = &groupID
		message.UpdatedAt = message.CreatedAt // Use created_at as fallback

		group := models.GroupMessageResponse{
			ID:    groupID,
			Title: groupName,
		}
		message.Group = &group

		messages = append(messages, message)
	}

	return messages, nil
}

func (s *MessageService) canUsersMessage(userID1, userID2 uint) (bool, error) {
	// Check if users are following each other or one has public profile
	query := `
		SELECT 
			(SELECT COUNT(*) FROM follows 
			 WHERE (follower_id = ? AND following_id = ? AND status = 'accepted')
			 OR (follower_id = ? AND following_id = ? AND status = 'accepted')) as following_count,
			(SELECT COUNT(*) FROM users 
			 WHERE (id = ? OR id = ?) AND is_private = false) as public_count
	`

	var followingCount, publicCount int
	err := s.db.QueryRow(query, userID1, userID2, userID2, userID1, userID1, userID2).Scan(
		&followingCount, &publicCount)
	if err != nil {
		return false, err
	}

	return followingCount > 0 || publicCount > 0, nil
}

func (s *MessageService) isUserGroupMember(groupID, userID uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM group_members 
		WHERE group_id = ? AND user_id = ? AND status = 'member'
	`

	var count int
	err := s.db.QueryRow(query, groupID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *MessageService) createMessageNotification(senderID, receiverID, messageID uint) error {
	// Get sender info
	senderQuery := `SELECT first_name, last_name FROM users WHERE id = ?`
	var firstName, lastName string
	err := s.db.QueryRow(senderQuery, senderID).Scan(&firstName, &lastName)
	if err != nil {
		return err
	}

	// Create notification
	notificationQuery := `
		INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, title, message, is_read, created_at, updated_at)
		VALUES (?, ?, 'new_message', 'message', ?, 'New Message', ?, false, ?, ?)
	`

	now := time.Now()
	message := fmt.Sprintf("New message from %s %s", firstName, lastName)

	_, err = s.db.Exec(notificationQuery, receiverID, senderID, messageID, message, now, now)
	return err
}

// Helper methods for conversation management

func (s *MessageService) getOrCreatePrivateConversation(userID1, userID2 uint) (uint, error) {
	// Ensure consistent ordering of participant IDs
	var participant1ID, participant2ID uint
	if userID1 < userID2 {
		participant1ID = userID1
		participant2ID = userID2
	} else {
		participant1ID = userID2
		participant2ID = userID1
	}

	// Check if conversation already exists
	var existingID uint
	checkQuery := `
		SELECT id FROM private_conversations
		WHERE participant1_id = ? AND participant2_id = ?
	`
	err := s.db.QueryRow(checkQuery, participant1ID, participant2ID).Scan(&existingID)

	if err == sql.ErrNoRows {
		// Create new conversation
		insertQuery := `
			INSERT INTO private_conversations (participant1_id, participant2_id, created_at, updated_at)
			VALUES (?, ?, ?, ?)
		`
		now := time.Now()
		result, err := s.db.Exec(insertQuery, participant1ID, participant2ID, now, now)
		if err != nil {
			return 0, err
		}
		id, err := result.LastInsertId()
		return uint(id), err
	} else if err != nil {
		return 0, err
	} else {
		// Return existing conversation ID
		return existingID, nil
	}
}

func (s *MessageService) updatePrivateConversationLastMessage(conversationID, messageID uint) error {
	updateQuery := `
		UPDATE private_conversations
		SET last_message_id = ?, updated_at = ?
		WHERE id = ?
	`
	now := time.Now()
	_, err := s.db.Exec(updateQuery, messageID, now, conversationID)
	return err
}

func (s *MessageService) getOrCreateGroupConversation(groupID uint) (uint, error) {
	// Check if conversation already exists
	var existingID uint
	checkQuery := `
		SELECT id FROM group_conversations
		WHERE group_id = ?
	`
	err := s.db.QueryRow(checkQuery, groupID).Scan(&existingID)

	if err == sql.ErrNoRows {
		// Create new conversation
		insertQuery := `
			INSERT INTO group_conversations (group_id, created_at, updated_at)
			VALUES (?, ?, ?)
		`
		now := time.Now()
		result, err := s.db.Exec(insertQuery, groupID, now, now)
		if err != nil {
			return 0, err
		}
		id, err := result.LastInsertId()
		return uint(id), err
	} else if err != nil {
		return 0, err
	} else {
		// Return existing conversation ID
		return existingID, nil
	}
}

func (s *MessageService) updateGroupConversationLastMessage(conversationID, messageID uint) error {
	updateQuery := `
		UPDATE group_conversations
		SET last_message_id = ?, updated_at = ?
		WHERE id = ?
	`
	now := time.Now()
	_, err := s.db.Exec(updateQuery, messageID, now, conversationID)
	return err
}

func (s *MessageService) GetPrivateConversationID(userID1, userID2 uint) (uint, error) {
	// Ensure consistent ordering of participant IDs
	var participant1ID, participant2ID uint
	if userID1 < userID2 {
		participant1ID = userID1
		participant2ID = userID2
	} else {
		participant1ID = userID2
		participant2ID = userID1
	}

	var conversationID uint
	query := `
		SELECT id FROM private_conversations
		WHERE participant1_id = ? AND participant2_id = ?
	`
	err := s.db.QueryRow(query, participant1ID, participant2ID).Scan(&conversationID)
	return conversationID, err
}

func (s *MessageService) GetGroupConversationID(groupID uint) (uint, error) {
	var conversationID uint
	query := `
		SELECT id FROM group_conversations
		WHERE group_id = ?
	`
	err := s.db.QueryRow(query, groupID).Scan(&conversationID)
	return conversationID, err
}

func (s *MessageService) GetConversationMessages(conversationID, userID uint, limit, offset int) ([]models.MessageResponse, error) {
	// Check if it's a private conversation
	var participant1ID, participant2ID uint
	privateQuery := `
		SELECT participant1_id, participant2_id FROM private_conversations
		WHERE id = ?
	`
	err := s.db.QueryRow(privateQuery, conversationID).Scan(&participant1ID, &participant2ID)
	if err == nil {
		// It's a private conversation
		var otherUserID uint
		if participant1ID == userID {
			otherUserID = participant2ID
		} else if participant2ID == userID {
			otherUserID = participant1ID
		} else {
			return nil, sql.ErrNoRows // Not a participant
		}

		return s.GetPrivateMessages(userID, otherUserID, limit, offset)
	}

	// Check if it's a group conversation
	var groupID uint
	groupQuery := `
		SELECT group_id FROM group_conversations
		WHERE id = ?
	`
	err = s.db.QueryRow(groupQuery, conversationID).Scan(&groupID)
	if err == nil {
		// It's a group conversation
		return s.GetGroupMessages(groupID, userID, limit, offset)
	}

	// Conversation not found
	return nil, sql.ErrNoRows
}

func (s *MessageService) MarkMessagesAsRead(messageIDs []uint, userID uint) error {
	query := `
		UPDATE private_messages 
		SET is_read = TRUE 
		WHERE id IN (?) AND conversation_id IN (
			SELECT id FROM private_conversations 
			WHERE participant1_id = ? OR participant2_id = ?
		)
	`

	// Convert uint slice to interface slice for the query
	ids := make([]interface{}, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = id
	}

	// Build the IN clause
	inClause := strings.Repeat("?,", len(messageIDs))
	inClause = inClause[:len(inClause)-1] // Remove trailing comma

	fullQuery := strings.Replace(query, "?", inClause, 1)

	args := append(ids, userID, userID)

	_, err := s.db.Exec(fullQuery, args...)
	if err != nil {
		return fmt.Errorf("failed to mark private messages as read: %w", err)
	}

	// Also mark group messages as read
	groupQuery := `
		UPDATE group_messages 
		SET is_read = TRUE 
		WHERE id IN (?) AND conversation_id IN (
			SELECT gc.id FROM group_conversations gc
			JOIN group_members gm ON gc.group_id = gm.group_id
			WHERE gm.user_id = ?
		)
	`

	fullGroupQuery := strings.Replace(groupQuery, "?", inClause, 1)
	groupArgs := append(ids, userID)

	_, err = s.db.Exec(fullGroupQuery, groupArgs...)
	if err != nil {
		return fmt.Errorf("failed to mark group messages as read: %w", err)
	}

	return nil
}
