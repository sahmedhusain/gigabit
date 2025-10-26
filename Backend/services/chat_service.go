package services

import (
	"database/sql"
	"fmt"
	"social/models"
	"sort"
	"strings"
	"time"
)

type ChatService struct {
	db *sql.DB
}

func NewChatService(db *sql.DB) *ChatService {
	return &ChatService{db: db}
}

func (s *ChatService) GetUnifiedChats(userID uint) ([]models.UnifiedChatItem, error) {
	privateChats, err := s.getPrivateChats(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get private chats: %w", err)
	}

	groupChats, err := s.getGroupChats(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get group chats: %w", err)
	}

	allChats := append(privateChats, groupChats...)

	sort.Slice(allChats, func(i, j int) bool {
		if allChats[i].LastMessage != nil && allChats[j].LastMessage != nil {
			if allChats[i].LastMessageTime != nil && allChats[j].LastMessageTime != nil {
				return allChats[i].LastMessageTime.After(*allChats[j].LastMessageTime)
			}
			return allChats[i].LastMessageTime != nil
		}
		if allChats[i].LastMessage != nil && allChats[j].LastMessage == nil {
			return true
		}
		if allChats[i].LastMessage == nil && allChats[j].LastMessage != nil {
			return false
		}
		if allChats[i].LastMessageTime != nil && allChats[j].LastMessageTime != nil {
			return allChats[i].LastMessageTime.After(*allChats[j].LastMessageTime)
		}
		return allChats[i].LastMessageTime != nil
	})

	return allChats, nil
}

func (s *ChatService) getPrivateChats(userID uint) ([]models.UnifiedChatItem, error) {
	query := `
		SELECT c.id, c.participant1_id, c.participant2_id, c.last_message_id, c.updated_at,
			   u1.id, u1.first_name, u1.last_name, u1.avatar, u1.nickname, u1.is_deleted,
			   u2.id, u2.first_name, u2.last_name, u2.avatar, u2.nickname, u2.is_deleted,
			   m.id, m.content, m.created_at, m.sender_id,
			   (
				   SELECT COUNT(*) FROM private_messages pm 
				   WHERE pm.conversation_id = c.id 
					 AND pm.sender_id != ? 
					 AND pm.is_read = 0
					 AND (
						 CASE 
							 WHEN c.participant1_id = ? AND c.participant1_deleted_at IS NOT NULL THEN pm.created_at > c.participant1_deleted_at
							 WHEN c.participant2_id = ? AND c.participant2_deleted_at IS NOT NULL THEN pm.created_at > c.participant2_deleted_at
							 ELSE 1
						 END
					 )
			   ) as unread_count
		FROM private_conversations c
		JOIN users u1 ON c.participant1_id = u1.id
		JOIN users u2 ON c.participant2_id = u2.id
		LEFT JOIN private_messages m ON m.id = (
			SELECT pm.id FROM private_messages pm
			WHERE pm.conversation_id = c.id
			  AND (
				  CASE 
					  WHEN c.participant1_id = ? AND c.participant1_deleted_at IS NOT NULL THEN pm.created_at > c.participant1_deleted_at
					  WHEN c.participant2_id = ? AND c.participant2_deleted_at IS NOT NULL THEN pm.created_at > c.participant2_deleted_at
					  ELSE 1
				  END
			  )
			ORDER BY pm.created_at DESC
			LIMIT 1
		)
		WHERE ((c.participant1_id = ? AND c.participant1_deleted = FALSE AND u2.is_deleted = FALSE) OR (c.participant2_id = ? AND c.participant2_deleted = FALSE AND u1.is_deleted = FALSE))
		ORDER BY c.updated_at DESC
	`

	rows, err := s.db.Query(query, userID, userID, userID, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []models.UnifiedChatItem
	for rows.Next() {
		var convID uint
		var participant1ID, participant2ID uint
		var lastMessageID sql.NullInt64
		var updatedAt time.Time
		var p1, p2 models.UserResponse
		var msgID sql.NullInt64
		var msgContent sql.NullString
		var msgCreatedAt sql.NullTime
		var msgSenderID sql.NullInt64
		var unreadCount int

		err := rows.Scan(
			&convID, &participant1ID, &participant2ID, &lastMessageID, &updatedAt,
			&p1.ID, &p1.FirstName, &p1.LastName, &p1.Avatar, &p1.Nickname, &p1.IsDeleted,
			&p2.ID, &p2.FirstName, &p2.LastName, &p2.Avatar, &p2.Nickname, &p2.IsDeleted,
			&msgID, &msgContent, &msgCreatedAt, &msgSenderID, &unreadCount,
		)
		if err != nil {
			return nil, err
		}

		var participant models.UserResponse
		if participant1ID == userID {
			participant = p2
		} else {
			participant = p1
		}

		var lastMessage *string
		var lastMessageSender *models.UserResponse
		if msgContent.Valid {
			content := msgContent.String
			isImage := strings.HasPrefix(content, "http")
			displayContent := content
			if isImage {
				displayContent = "📷 Photo"
			}

			// Check for deleted message marker
			if content == "XdeletedbyuserX" || content == "This message was deleted" {
				displayContent = "🗑️ Message has been deleted"
			}

			if msgSenderID.Valid && uint(msgSenderID.Int64) == userID {
				formatted := "You: " + displayContent
				lastMessage = &formatted
			} else {
				lastMessage = &displayContent
				lastMessageSender = &participant
			}
		}

		// Determine message type for chat list preview
		var lastMessageType *string
		if msgContent.Valid {
			if strings.HasPrefix(msgContent.String, "http") {
				messageType := "image"
				lastMessageType = &messageType
			} else {
				messageType := "text"
				lastMessageType = &messageType
			}
		}

		lastMessageTime := updatedAt
		if msgCreatedAt.Valid {
			lastMessageTime = msgCreatedAt.Time
		}

		chat := models.UnifiedChatItem{
			ID:                fmt.Sprintf("private_%d", convID),
			Type:              "private",
			Name:              fmt.Sprintf("%s %s", participant.FirstName, participant.LastName),
			Avatar:            participant.Avatar,
			LastMessage:       lastMessage,
			LastMessageType:   lastMessageType,
			LastMessageTime:   &lastMessageTime,
			LastMessageSender: lastMessageSender,
			HasUnread:         unreadCount > 0,
			UnreadCount:       unreadCount,
			Participant:       &participant,
			ConversationID:    convID,
			ParticipantID:     &participant.ID,
		}
		chats = append(chats, chat)
	}

	return chats, nil
}

func (s *ChatService) getGroupChats(userID uint) ([]models.UnifiedChatItem, error) {
	query := `
	        SELECT g.id, g.name, g.privacy, g.avatar, gm.created_at, gm.role, gc.id as conv_id,
	               m.content, m.created_at as last_message_time, m.sender_id,
	               u.id, u.first_name, u.last_name, u.avatar, u.nickname, u.is_deleted
	        FROM groups g
	        JOIN group_members gm ON g.id = gm.group_id
	        LEFT JOIN group_conversations gc ON g.id = gc.group_id
	        LEFT JOIN group_messages m ON gc.last_message_id = m.id
	        LEFT JOIN users u ON m.sender_id = u.id AND u.is_deleted = FALSE
	        WHERE gm.user_id = ? AND gm.status = 'member'
	        ORDER BY COALESCE(m.created_at, gm.created_at) DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []models.UnifiedChatItem
	for rows.Next() {
		var groupID uint
		var groupName string
		var privacy string
		var groupAvatar sql.NullString
		var createdAt time.Time
		var memberRole sql.NullString
		var convID sql.NullInt64
		var lastMessage sql.NullString
		var lastMessageTime sql.NullTime
		var msgSenderID sql.NullInt64
		var senderID sql.NullInt64
		var senderFirstName sql.NullString
		var senderLastName sql.NullString
		var senderAvatar sql.NullString
		var senderNickname sql.NullString
		var senderDeleted sql.NullBool

		err := rows.Scan(&groupID, &groupName, &privacy, &groupAvatar, &createdAt, &memberRole, &convID, &lastMessage, &lastMessageTime, &msgSenderID,
			&senderID, &senderFirstName, &senderLastName, &senderAvatar, &senderNickname, &senderDeleted)
		if err != nil {
			return nil, err
		}

		var sender *models.UserResponse
		if senderID.Valid {
			var avatar *string
			if senderAvatar.Valid {
				avatar = &senderAvatar.String
			}
			var nickname *string
			if senderNickname.Valid {
				nickname = &senderNickname.String
			}
			sender = &models.UserResponse{
				ID:        uint(senderID.Int64),
				FirstName: senderFirstName.String,
				LastName:  senderLastName.String,
				Avatar:    avatar,
				Nickname:  nickname,
				IsDeleted: senderDeleted.Valid && senderDeleted.Bool,
			}
		}

		var lastMsg *string
		var lastMessageSender *models.UserResponse
		if lastMessage.Valid {
			content := lastMessage.String
			isImage := strings.HasPrefix(content, "http")
			displayContent := content
			if isImage {
				displayContent = "📷 Photo"
			}

			// Check for deleted message marker
			if content == "XdeletedbyuserX" || content == "This message was deleted" {
				displayContent = "🗑️ Message has been deleted"
			}

			if msgSenderID.Valid && uint(msgSenderID.Int64) == userID {
				formatted := "You: " + displayContent
				lastMsg = &formatted
			} else if sender != nil {
				formatted := sender.FirstName + ": " + displayContent
				lastMsg = &formatted
				lastMessageSender = sender
			} else {
				lastMsg = &displayContent
			}
		}

		// Determine message type for chat list preview
		var lastMessageType *string
		if lastMessage.Valid {
			if strings.HasPrefix(lastMessage.String, "http") {
				messageType := "image"
				lastMessageType = &messageType
			} else {
				messageType := "text"
				lastMessageType = &messageType
			}
		}

		timestamp := createdAt
		if lastMessageTime.Valid {
			timestamp = lastMessageTime.Time
		}

		convIDValue := uint(convID.Int64)
		if !convID.Valid {
			convIDValue = groupID
		}

		unreadCount := 0
		if convID.Valid {
			unreadQuery := `SELECT COUNT(*) FROM group_messages m
				JOIN group_members gm ON gm.group_id = ? AND gm.user_id = ? AND gm.status = 'member'
				WHERE m.conversation_id = ? AND m.sender_id != ? AND m.is_read = 0 AND m.created_at >= gm.created_at`
			s.db.QueryRow(unreadQuery, groupID, userID, convIDValue, userID).Scan(&unreadCount)
		}

		role := ""
		if memberRole.Valid {
			role = memberRole.String
		}

		var groupAvatarPtr *string
		if groupAvatar.Valid {
			groupAvatarPtr = &groupAvatar.String
		}

		chat := models.UnifiedChatItem{
			ID:                fmt.Sprintf("group_%d", convIDValue),
			Type:              "group",
			Name:              groupName,
			LastMessage:       lastMsg,
			LastMessageType:   lastMessageType,
			LastMessageTime:   &timestamp,
			LastMessageSender: lastMessageSender,
			HasUnread:         unreadCount > 0,
			UnreadCount:       unreadCount,
			Group: &models.GroupResponse{
				ID:           groupID,
				Title:        groupName,
				Privacy:      privacy,
				Avatar:       groupAvatarPtr,
				IsMember:     true,
				MemberStatus: "member",
				Role:         role,
			},
			ConversationID: convIDValue,
		}
		chats = append(chats, chat)
	}

	return chats, nil
}

func (s *ChatService) DeleteConversation(conversationID, userID uint) error {
	query := `
		UPDATE private_conversations
		SET participant1_deleted = CASE WHEN participant1_id = ? THEN TRUE ELSE participant1_deleted END,
			participant2_deleted = CASE WHEN participant2_id = ? THEN TRUE ELSE participant2_deleted END,
			participant1_deleted_at = CASE WHEN participant1_id = ? THEN CURRENT_TIMESTAMP ELSE participant1_deleted_at END,
			participant2_deleted_at = CASE WHEN participant2_id = ? THEN CURRENT_TIMESTAMP ELSE participant2_deleted_at END,
			unread_count1 = CASE WHEN participant1_id = ? THEN 0 ELSE unread_count1 END,
			unread_count2 = CASE WHEN participant2_id = ? THEN 0 ELSE unread_count2 END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err := s.db.Exec(query, userID, userID, userID, userID, userID, userID, conversationID)
	return err
}
