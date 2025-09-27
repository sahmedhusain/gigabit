package services

import (
	"database/sql"
	"fmt"
	"social/models"
	"sort"
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

	// Sort all chats: first by those with messages (by last message time), then groups without messages (by joining date)
	sort.Slice(allChats, func(i, j int) bool {
		// If both have messages, sort by last message time (newest first)
		if allChats[i].LastMessage != nil && allChats[j].LastMessage != nil {
			return allChats[i].LastMessageTime.After(allChats[j].LastMessageTime)
		}
		// If only i has message, i comes first
		if allChats[i].LastMessage != nil && allChats[j].LastMessage == nil {
			return true
		}
		// If only j has message, j comes first
		if allChats[i].LastMessage == nil && allChats[j].LastMessage != nil {
			return false
		}
		// Both don't have messages (should only be groups), sort by joining date (newest first)
		return allChats[i].LastMessageTime.After(allChats[j].LastMessageTime)
	})

	return allChats, nil
}

func (s *ChatService) getPrivateChats(userID uint) ([]models.UnifiedChatItem, error) {
	query := `
		SELECT c.id, c.participant1_id, c.participant2_id, c.last_message_id, c.updated_at,
			   u1.id, u1.first_name, u1.last_name, u1.avatar, u1.nickname,
			   u2.id, u2.first_name, u2.last_name, u2.avatar, u2.nickname,
			   m.id, m.content, m.created_at, m.sender_id,
			   CASE WHEN c.participant1_id = ? THEN c.unread_count1 ELSE c.unread_count2 END as unread_count
		FROM private_conversations c
		JOIN users u1 ON c.participant1_id = u1.id
		JOIN users u2 ON c.participant2_id = u2.id
		LEFT JOIN private_messages m ON c.last_message_id = m.id
		WHERE (c.participant1_id = ? OR c.participant2_id = ?)
		ORDER BY c.updated_at DESC
	`

	rows, err := s.db.Query(query, userID, userID, userID)
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
			&p1.ID, &p1.FirstName, &p1.LastName, &p1.Avatar, &p1.Nickname,
			&p2.ID, &p2.FirstName, &p2.LastName, &p2.Avatar, &p2.Nickname,
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
		if msgContent.Valid {
			// Format message based on sender
			content := msgContent.String
			if msgSenderID.Valid && uint(msgSenderID.Int64) == userID {
				formatted := "You: " + content
				lastMessage = &formatted
			} else {
				lastMessage = &content
			}
		}

		lastMessageTime := updatedAt
		if msgCreatedAt.Valid {
			lastMessageTime = msgCreatedAt.Time
		}

		chat := models.UnifiedChatItem{
			ID:              fmt.Sprintf("private_%d", convID),
			Type:            "private",
			Name:            fmt.Sprintf("%s %s", participant.FirstName, participant.LastName),
			Avatar:          participant.Avatar,
			LastMessage:     lastMessage,
			LastMessageTime: lastMessageTime,
			HasUnread:       unreadCount > 0,
			UnreadCount:     unreadCount,
			Participant:     &participant,
			ConversationID:  convID,
			ParticipantID:   &participant.ID,
		}
		chats = append(chats, chat)
	}

	return chats, nil
}

func (s *ChatService) getGroupChats(userID uint) ([]models.UnifiedChatItem, error) {
	query := `
        SELECT g.id, g.name, gm.created_at, gc.id as conv_id,
               m.content, m.created_at as last_message_time, m.sender_id,
               u.first_name
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN group_conversations gc ON g.id = gc.group_id
        LEFT JOIN group_messages m ON gc.last_message_id = m.id
        LEFT JOIN users u ON m.sender_id = u.id
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
		var createdAt time.Time
		var convID sql.NullInt64
		var lastMessage sql.NullString
		var lastMessageTime sql.NullTime
		var msgSenderID sql.NullInt64
		var senderFirstName sql.NullString

		err := rows.Scan(&groupID, &groupName, &createdAt, &convID, &lastMessage, &lastMessageTime, &msgSenderID, &senderFirstName)
		if err != nil {
			return nil, err
		}

		var lastMsg *string
		if lastMessage.Valid {
			content := lastMessage.String
			if msgSenderID.Valid && uint(msgSenderID.Int64) == userID {
				formatted := "You: " + content
				lastMsg = &formatted
			} else if senderFirstName.Valid {
				formatted := senderFirstName.String + ": " + content
				lastMsg = &formatted
			} else {
				lastMsg = &content
			}
		}

		timestamp := createdAt
		if lastMessageTime.Valid {
			timestamp = lastMessageTime.Time
		}

		convIDValue := uint(convID.Int64)
		if !convID.Valid {
			// If no conversation yet, use group id as fallback
			convIDValue = groupID
		}

		chat := models.UnifiedChatItem{
			ID:              fmt.Sprintf("group_%d", convIDValue),
			Type:            "group",
			Name:            groupName,
			LastMessage:     lastMsg,
			LastMessageTime: timestamp,
			HasUnread:       false, // Group unread counts not implemented yet
			UnreadCount:     0,     // Group unread counts not implemented yet
			Group: &models.GroupResponse{
				ID:    groupID,
				Title: groupName,
			},
			ConversationID: convIDValue,
		}
		chats = append(chats, chat)
	}

	return chats, nil
}
