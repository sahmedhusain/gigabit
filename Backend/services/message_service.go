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

func (s *MessageService) GetDB() *sql.DB {
	return s.db
}

func (s *MessageService) SendPrivateMessage(message *models.Message) error {
	// Check if users are following each other or one has public profile
	canMessage, err := s.canUsersMessage(message.SenderID, message.ReceiverID)
	if err != nil || !canMessage {
		return sql.ErrNoRows // Unauthorized to message
	}

	query := `
INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
VALUES (?, ?, ?, false, ?)
`

	now := time.Now()
	result, err := s.db.Exec(query, message.SenderID, message.ReceiverID, message.Content, now)
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
	err = s.createOrUpdatePrivateConversation(message.SenderID, message.ReceiverID, uint(id))
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
INSERT INTO messages (sender_id, group_id, content, is_read, created_at)
VALUES (?, ?, ?, false, ?)
`

	now := time.Now()
	result, err := s.db.Exec(query, message.SenderID, message.GroupID, message.Content, now)
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
	err = s.createOrUpdateGroupConversation(*message.GroupID, uint(id))
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

	query := `
SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
   u1.first_name, u1.last_name, u1.avatar, u1.nickname,
   u2.first_name, u2.last_name, u2.avatar, u2.nickname
FROM messages m
JOIN users u1 ON m.sender_id = u1.id
JOIN users u2 ON m.receiver_id = u2.id
WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
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
			&message.ID, &message.SenderID, &message.ReceiverID, &message.Content, &message.IsRead, &message.CreatedAt,
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
		message.MessageType = "private"
		message.UpdatedAt = message.CreatedAt // Use created_at as fallback

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
SELECT m.id, m.sender_id, m.group_id, m.content, m.is_read, m.created_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   g.name
FROM messages m
JOIN users u ON m.sender_id = u.id
JOIN groups g ON m.group_id = g.id
WHERE m.group_id = ?
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
			&message.ID, &message.SenderID, &message.GroupID, &message.Content, &message.IsRead, &message.CreatedAt,
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
		message.MessageType = "group"
		message.UpdatedAt = message.CreatedAt // Use created_at as fallback

		messages = append(messages, message)
	}

	return messages, nil
}

func (s *MessageService) createOrUpdatePrivateConversation(userID1, userID2, messageID uint) error {
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
			INSERT INTO private_conversations (participant1_id, participant2_id, last_message_id, unread_count1, unread_count2, created_at, updated_at)
			VALUES (?, ?, ?, 0, 0, ?, ?)
		`
		now := time.Now()
		_, err = s.db.Exec(insertQuery, participant1ID, participant2ID, messageID, now, now)
		return err
	} else if err != nil {
		return err
	} else {
		// Update existing conversation
		updateQuery := `
			UPDATE private_conversations
			SET last_message_id = ?, updated_at = ?
			WHERE id = ?
		`
		now := time.Now()
		_, err = s.db.Exec(updateQuery, messageID, now, existingID)
		return err
	}
}

func (s *MessageService) createOrUpdateGroupConversation(groupID, messageID uint) error {
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
			INSERT INTO group_conversations (group_id, last_message_id, created_at, updated_at)
			VALUES (?, ?, ?, ?)
		`
		now := time.Now()
		_, err = s.db.Exec(insertQuery, groupID, messageID, now, now)
		return err
	} else if err != nil {
		return err
	} else {
		// Update existing conversation
		updateQuery := `
			UPDATE group_conversations
			SET last_message_id = ?, updated_at = ?
			WHERE id = ?
		`
		now := time.Now()
		_, err = s.db.Exec(updateQuery, messageID, now, existingID)
		return err
	}
}

func (s *MessageService) GetUserConversations(userID uint) ([]models.Conversation, error) {
	conversations := make([]models.Conversation, 0)

	// Get private conversations
	privateConversations, err := s.getPrivateConversations(userID)
	if err != nil {
		// Log the error but don't fail completely
		fmt.Printf("Failed to get private conversations: %v\n", err)
	}
	conversations = append(conversations, privateConversations...)

	// Get group conversations
	groupConversations, err := s.getGroupConversations(userID)
	if err != nil {
		// Log the error but don't fail completely
		fmt.Printf("Failed to get group conversations: %v\n", err)
	}
	conversations = append(conversations, groupConversations...)

	return conversations, nil
}

func (s *MessageService) getPrivateConversations(userID uint) ([]models.Conversation, error) {
	query := `
SELECT c.id, c.participant1_id, c.participant2_id, c.last_message_id, c.unread_count1, c.unread_count2, c.updated_at,
   u1.first_name, u1.last_name, u1.avatar, u1.nickname,
   u2.first_name, u2.last_name, u2.avatar, u2.nickname,
   m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at
FROM private_conversations c
JOIN users u1 ON c.participant1_id = u1.id
JOIN users u2 ON c.participant2_id = u2.id
LEFT JOIN messages m ON c.last_message_id = m.id
WHERE (c.participant1_id = ? OR c.participant2_id = ?)
ORDER BY c.updated_at DESC
`

	rows, err := s.db.Query(query, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var convID uint
		var participant1ID, participant2ID uint
		var lastMessageID *uint
		var unreadCount1, unreadCount2 int
		var updatedAt time.Time
		var participant1, participant2 models.UserResponse
		var message models.MessageResponse
		var sender models.UserResponse

		var msgID sql.NullInt64
		var msgSenderID sql.NullInt64
		var msgReceiverID sql.NullInt64
		var msgContent sql.NullString
		var msgIsRead sql.NullBool
		var msgCreatedAt sql.NullTime

		err := rows.Scan(
			&convID, &participant1ID, &participant2ID, &lastMessageID, &unreadCount1, &unreadCount2, &updatedAt,
			&participant1.FirstName, &participant1.LastName, &participant1.Avatar, &participant1.Nickname,
			&participant2.FirstName, &participant2.LastName, &participant2.Avatar, &participant2.Nickname,
			&msgID, &msgSenderID, &msgReceiverID, &msgContent, &msgIsRead, &msgCreatedAt,
		)
		if err != nil {
			return nil, err
		}

		participant1.ID = participant1ID
		participant2.ID = participant2ID

		// Build message if present
		if msgID.Valid {
			message.ID = uint(msgID.Int64)
			if msgSenderID.Valid {
				message.SenderID = uint(msgSenderID.Int64)
				sender.ID = message.SenderID
				message.Sender = sender
			}
			if msgReceiverID.Valid {
				receiverID := uint(msgReceiverID.Int64)
				message.ReceiverID = receiverID
			}
			if msgContent.Valid {
				message.Content = msgContent.String
			}
			message.MessageType = "private" // Set default message type
			if msgIsRead.Valid {
				message.IsRead = msgIsRead.Bool
			}
			if msgCreatedAt.Valid {
				message.CreatedAt = msgCreatedAt.Time
				message.UpdatedAt = msgCreatedAt.Time // Use created_at as updated_at fallback
			}
		}

		// Determine which participant is the other user
		var participant *models.UserResponse
		var unreadCount int
		if participant1ID == userID {
			participant = &participant2
			unreadCount = unreadCount2
		} else {
			participant = &participant1
			unreadCount = unreadCount1
		}

		conversation := models.Conversation{
			ID:            fmt.Sprintf("private_%d", convID),
			ParticipantID: participant.ID,
			LastMessage:   message,
			UnreadCount:   unreadCount,
			UpdatedAt:     updatedAt,
			Participant:   participant,
		}

		conversations = append(conversations, conversation)
	}

	return conversations, nil
}

func (s *MessageService) getGroupConversations(userID uint) ([]models.Conversation, error) {
	query := `
SELECT g.id as group_id, g.name as group_name,
   c.id as conv_id, c.last_message_id, COALESCE(c.updated_at, g.created_at) as updated_at,
   m.id as msg_id, m.sender_id as msg_sender_id, m.group_id as msg_group_id, m.content as msg_content, m.is_read as msg_is_read, m.created_at as msg_created_at,
   u.first_name as sender_first_name, u.last_name as sender_last_name, u.avatar as sender_avatar, u.nickname as sender_nickname
FROM groups g
JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'accepted'
LEFT JOIN group_conversations c ON c.group_id = g.id
LEFT JOIN messages m ON c.last_message_id = m.id
LEFT JOIN users u ON m.sender_id = u.id
WHERE gm.user_id = ?
ORDER BY updated_at DESC
`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var groupID uint
		var groupName string
		var convID sql.NullInt64
		var lastMessageID sql.NullInt64
		var updatedAt time.Time

		var msgID sql.NullInt64
		var msgSenderID sql.NullInt64
		var msgGroupID sql.NullInt64
		var msgContent sql.NullString
		var msgIsRead sql.NullBool
		var msgCreatedAt sql.NullTime

		var senderFirstName sql.NullString
		var senderLastName sql.NullString
		var senderAvatar sql.NullString
		var senderNickname sql.NullString

		err := rows.Scan(
			&groupID, &groupName,
			&convID, &lastMessageID, &updatedAt,
			&msgID, &msgSenderID, &msgGroupID, &msgContent, &msgIsRead, &msgCreatedAt,
			&senderFirstName, &senderLastName, &senderAvatar, &senderNickname,
		)
		if err != nil {
			return nil, err
		}

		// Build group info
		group := models.GroupMessageResponse{
			ID:    groupID,
			Title: groupName,
		}

		// Build last message if present
		var message models.MessageResponse
		if msgID.Valid {
			message.ID = uint(msgID.Int64)
			if msgSenderID.Valid {
				message.SenderID = uint(msgSenderID.Int64)
				var avatarPtr *string
				if senderAvatar.Valid {
					avatar := senderAvatar.String
					avatarPtr = &avatar
				}
				var nicknamePtr *string
				if senderNickname.Valid {
					nickname := senderNickname.String
					nicknamePtr = &nickname
				}
				sender := models.UserResponse{
					ID:        message.SenderID,
					FirstName: senderFirstName.String,
					LastName:  senderLastName.String,
					Avatar:    avatarPtr,
					Nickname:  nicknamePtr,
				}
				message.Sender = sender
			}
			if msgGroupID.Valid {
				gid := uint(msgGroupID.Int64)
				message.GroupID = &gid
			}
			if msgContent.Valid {
				message.Content = msgContent.String
			}
			message.MessageType = "group" // Set default message type
			if msgIsRead.Valid {
				message.IsRead = msgIsRead.Bool
			}
			if msgCreatedAt.Valid {
				message.CreatedAt = msgCreatedAt.Time
				message.UpdatedAt = msgCreatedAt.Time // Use created_at as updated_at fallback
			}
		}

		// Determine conversation id string (use group id when conversation record missing)
		convIdentifier := uint(groupID)
		if convID.Valid {
			convIdentifier = uint(convID.Int64)
		}

		conversation := models.Conversation{
			ID:          fmt.Sprintf("group_%d", convIdentifier),
			GroupID:     groupID,
			LastMessage: message,
			UnreadCount: 0, // Group unread logic can be added later
			UpdatedAt:   updatedAt,
			Group:       &group,
		}

		conversations = append(conversations, conversation)
	}

	return conversations, nil
}

func (s *MessageService) getLastPrivateMessage(userID1, userID2 uint) (*models.MessageResponse, error) {
	query := `
SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
   u.first_name, u.last_name, u.avatar, u.nickname
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
ORDER BY m.created_at DESC
LIMIT 1
`

	var message models.MessageResponse
	var sender models.UserResponse

	err := s.db.QueryRow(query, userID1, userID2, userID2, userID1).Scan(
		&message.ID, &message.SenderID, &message.ReceiverID, &message.Content, &message.IsRead, &message.CreatedAt,
		&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
	)
	if err != nil {
		return nil, err
	}

	sender.ID = message.SenderID
	message.Sender = sender
	message.MessageType = "private"
	message.UpdatedAt = message.CreatedAt

	return &message, nil
}

func (s *MessageService) getLastGroupMessage(groupID uint) (*models.MessageResponse, error) {
	query := `
SELECT m.id, m.sender_id, m.group_id, m.content, m.is_read, m.created_at,
   u.first_name, u.last_name, u.avatar, u.nickname
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.group_id = ?
ORDER BY m.created_at DESC
LIMIT 1
`

	var message models.MessageResponse
	var sender models.UserResponse

	err := s.db.QueryRow(query, groupID).Scan(
		&message.ID, &message.SenderID, &message.GroupID, &message.Content, &message.IsRead, &message.CreatedAt,
		&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
	)
	if err != nil {
		return nil, err
	}

	sender.ID = message.SenderID
	message.Sender = sender
	message.MessageType = "group"
	message.UpdatedAt = message.CreatedAt

	return &message, nil
}

func (s *MessageService) getUnreadPrivateMessageCount(senderID, receiverID uint) (int, error) {
	query := `
SELECT COUNT(*) FROM messages 
WHERE sender_id = ? AND receiver_id = ? AND is_read = false
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
UPDATE messages SET is_read = true
WHERE id IN (%s) AND receiver_id = ? AND is_read = false
`, strings.Join(placeholders, ","))

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
		WHERE group_id = ? AND user_id = ? AND status = 'accepted'
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
