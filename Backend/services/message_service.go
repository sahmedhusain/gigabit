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
		INSERT INTO messages (sender_id, receiver_id, content, image_url, message_type, is_read, created_at, updated_at)
		VALUES (?, ?, ?, ?, 'private', false, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, message.SenderID, message.ReceiverID, message.Content, 
		message.ImageURL, now, now)
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

	return nil
}

func (s *MessageService) SendGroupMessage(message *models.Message) error {
	// Check if user is a member of the group
	isMember, err := s.isUserGroupMember(*message.GroupID, message.SenderID)
	if err != nil || !isMember {
		return sql.ErrNoRows // Unauthorized
	}

	query := `
		INSERT INTO messages (sender_id, group_id, content, image_url, message_type, is_read, created_at, updated_at)
		VALUES (?, ?, ?, ?, 'group', false, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, message.SenderID, message.GroupID, message.Content,
		message.ImageURL, now, now)
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

	return nil
}

func (s *MessageService) GetPrivateMessages(userID1, userID2 uint, limit, offset int) ([]models.MessageResponse, error) {
	// Check if users can message each other
	canMessage, err := s.canUsersMessage(userID1, userID2)
	if err != nil || !canMessage {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT m.id, m.sender_id, m.receiver_id, m.content, m.image_url, 
			   m.message_type, m.is_read, m.created_at, m.updated_at,
			   u1.first_name, u1.last_name, u1.avatar, u1.nickname,
			   u2.first_name, u2.last_name, u2.avatar, u2.nickname
		FROM messages m
		JOIN users u1 ON m.sender_id = u1.id
		JOIN users u2 ON m.receiver_id = u2.id
		WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
		AND m.message_type = 'private'
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, userID1, userID2, userID2, userID1, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.MessageResponse
	for rows.Next() {
		var message models.MessageResponse
		var sender models.UserResponse
		var receiver models.UserResponse

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.ReceiverID, &message.Content, &message.ImageURL,
			&message.MessageType, &message.IsRead, &message.CreatedAt, &message.UpdatedAt,
			&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
			&receiver.FirstName, &receiver.LastName, &receiver.Avatar, &receiver.Nickname,
		)
		if err != nil {
			return nil, err
		}

		sender.ID = message.SenderID
		receiver.ID = message.ReceiverID
		message.Sender = sender
		message.Receiver = &receiver

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

	query := `
		SELECT m.id, m.sender_id, m.group_id, m.content, m.image_url,
			   m.message_type, m.is_read, m.created_at, m.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname,
			   g.title
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		JOIN groups g ON m.group_id = g.id
		WHERE m.group_id = ? AND m.message_type = 'group'
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.MessageResponse
	for rows.Next() {
		var message models.MessageResponse
		var sender models.UserResponse
		var group models.GroupMessageResponse

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.GroupID, &message.Content, &message.ImageURL,
			&message.MessageType, &message.IsRead, &message.CreatedAt, &message.UpdatedAt,
			&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
			&group.Title,
		)
		if err != nil {
			return nil, err
		}

		sender.ID = message.SenderID
		group.ID = *message.GroupID
		message.Sender = sender
		message.Group = &group

		messages = append(messages, message)
	}

	return messages, nil
}

func (s *MessageService) GetUserConversations(userID uint) ([]models.Conversation, error) {
	conversations := make([]models.Conversation, 0)

	// Get private conversations
	privateConversations, err := s.getPrivateConversations(userID)
	if err != nil {
		return nil, err
	}
	conversations = append(conversations, privateConversations...)

	// Get group conversations
	groupConversations, err := s.getGroupConversations(userID)
	if err != nil {
		return nil, err
	}
	conversations = append(conversations, groupConversations...)

	return conversations, nil
}

func (s *MessageService) getPrivateConversations(userID uint) ([]models.Conversation, error) {
	query := `
		SELECT DISTINCT 
			CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as participant_id,
			u.first_name, u.last_name, u.avatar, u.nickname
		FROM messages m
		JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
		WHERE (m.sender_id = ? OR m.receiver_id = ?) AND m.message_type = 'private'
	`

	rows, err := s.db.Query(query, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var participantID uint
		var participant models.UserResponse

		err := rows.Scan(&participantID, &participant.FirstName, &participant.LastName, 
			&participant.Avatar, &participant.Nickname)
		if err != nil {
			return nil, err
		}

		participant.ID = participantID

		// Get last message
		lastMessage, err := s.getLastPrivateMessage(userID, participantID)
		if err != nil {
			continue
		}

		// Get unread count
		unreadCount, err := s.getUnreadPrivateMessageCount(participantID, userID)
		if err != nil {
			unreadCount = 0
		}

		conversation := models.Conversation{
			ID:            fmt.Sprintf("private_%d", participantID),
			Type:          "private",
			ParticipantID: participantID,
			LastMessage:   *lastMessage,
			UnreadCount:   unreadCount,
			UpdatedAt:     lastMessage.CreatedAt,
			Participant:   &participant,
		}

		conversations = append(conversations, conversation)
	}

	return conversations, nil
}

func (s *MessageService) getGroupConversations(userID uint) ([]models.Conversation, error) {
	query := `
		SELECT g.id, g.title
		FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = ? AND gm.status = 'member'
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var groupID uint
		var group models.GroupMessageResponse

		err := rows.Scan(&groupID, &group.Title)
		if err != nil {
			return nil, err
		}

		group.ID = groupID

		// Get last message
		lastMessage, err := s.getLastGroupMessage(groupID)
		if err != nil {
			continue
		}

		// Get unread count (for group messages, we'll count all unread messages)
		unreadCount, err := s.getUnreadGroupMessageCount(groupID, userID)
		if err != nil {
			unreadCount = 0
		}

		conversation := models.Conversation{
			ID:          fmt.Sprintf("group_%d", groupID),
			Type:        "group",
			GroupID:     groupID,
			LastMessage: *lastMessage,
			UnreadCount: unreadCount,
			UpdatedAt:   lastMessage.CreatedAt,
			Group:       &group,
		}

		conversations = append(conversations, conversation)
	}

	return conversations, nil
}

func (s *MessageService) getLastPrivateMessage(userID1, userID2 uint) (*models.MessageResponse, error) {
	query := `
		SELECT m.id, m.sender_id, m.receiver_id, m.content, m.image_url,
			   m.message_type, m.is_read, m.created_at, m.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
		AND m.message_type = 'private'
		ORDER BY m.created_at DESC
		LIMIT 1
	`

	var message models.MessageResponse
	var sender models.UserResponse

	err := s.db.QueryRow(query, userID1, userID2, userID2, userID1).Scan(
		&message.ID, &message.SenderID, &message.ReceiverID, &message.Content, &message.ImageURL,
		&message.MessageType, &message.IsRead, &message.CreatedAt, &message.UpdatedAt,
		&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
	)
	if err != nil {
		return nil, err
	}

	sender.ID = message.SenderID
	message.Sender = sender

	return &message, nil
}

func (s *MessageService) getLastGroupMessage(groupID uint) (*models.MessageResponse, error) {
	query := `
		SELECT m.id, m.sender_id, m.group_id, m.content, m.image_url,
			   m.message_type, m.is_read, m.created_at, m.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.group_id = ? AND m.message_type = 'group'
		ORDER BY m.created_at DESC
		LIMIT 1
	`

	var message models.MessageResponse
	var sender models.UserResponse

	err := s.db.QueryRow(query, groupID).Scan(
		&message.ID, &message.SenderID, &message.GroupID, &message.Content, &message.ImageURL,
		&message.MessageType, &message.IsRead, &message.CreatedAt, &message.UpdatedAt,
		&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
	)
	if err != nil {
		return nil, err
	}

	sender.ID = message.SenderID
	message.Sender = sender

	return &message, nil
}

func (s *MessageService) getUnreadPrivateMessageCount(senderID, receiverID uint) (int, error) {
	query := `
		SELECT COUNT(*) FROM messages 
		WHERE sender_id = ? AND receiver_id = ? AND message_type = 'private' AND is_read = false
	`

	var count int
	err := s.db.QueryRow(query, senderID, receiverID).Scan(&count)
	return count, err
}

func (s *MessageService) getUnreadGroupMessageCount(groupID, userID uint) (int, error) {
	// For group messages, we count messages sent after user's last read timestamp
	// For simplicity, we'll return 0 for now
	return 0, nil
}

func (s *MessageService) MarkMessagesAsRead(messageIDs []uint, userID uint) error {
	if len(messageIDs) == 0 {
		return nil
	}

	// Create placeholders for IN clause
	placeholders := make([]string, len(messageIDs))
	args := make([]interface{}, 0, len(messageIDs)+1)
	
	for i, id := range messageIDs {
		placeholders[i] = "?"
		args = append(args, id)
	}
	args = append(args, userID)

	query := fmt.Sprintf(`
		UPDATE messages SET is_read = true, updated_at = ?
		WHERE id IN (%s) AND receiver_id = ? AND is_read = false
	`, strings.Join(placeholders, ","))
	
	args = append([]interface{}{time.Now()}, args...)

	_, err := s.db.Exec(query, args...)
	return err
}

// Helper functions

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