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

	// Sort all chats by last message time
	sort.Slice(allChats, func(i, j int) bool {
		return allChats[i].LastMessageTime.After(allChats[j].LastMessageTime)
	})

	return allChats, nil
}

func (s *ChatService) getPrivateChats(userID uint) ([]models.UnifiedChatItem, error) {
	query := `
		SELECT c.id, c.participant1_id, c.participant2_id, c.last_message_id, c.updated_at,
			   u1.id, u1.first_name, u1.last_name, u1.avatar, u1.nickname,
			   u2.id, u2.first_name, u2.last_name, u2.avatar, u2.nickname,
			   m.id, m.content, m.created_at
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

		err := rows.Scan(
			&convID, &participant1ID, &participant2ID, &lastMessageID, &updatedAt,
			&p1.ID, &p1.FirstName, &p1.LastName, &p1.Avatar, &p1.Nickname,
			&p2.ID, &p2.FirstName, &p2.LastName, &p2.Avatar, &p2.Nickname,
			&msgID, &msgContent, &msgCreatedAt,
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
			lastMessage = &msgContent.String
		}

		lastMessageTime := updatedAt
		if msgCreatedAt.Valid {
			lastMessageTime = msgCreatedAt.Time
		}

		chat := models.UnifiedChatItem{
			ID:              fmt.Sprintf("private_%d", participant.ID),
			Type:            "private",
			Name:            fmt.Sprintf("%s %s", participant.FirstName, participant.LastName),
			Avatar:          participant.Avatar,
			LastMessage:     lastMessage,
			LastMessageTime: lastMessageTime,
			HasUnread:       false, // TODO: Implement unread count
			UnreadCount:     0,     // TODO: Implement unread count
		}
		chats = append(chats, chat)
	}

	return chats, nil
}

func (s *ChatService) getGroupChats(userID uint) ([]models.UnifiedChatItem, error) {
	query := `
        SELECT g.id, g.name, g.created_at,
               m.content, m.created_at as last_message_time
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN group_conversations gc ON g.id = gc.group_id
        LEFT JOIN messages m ON gc.last_message_id = m.id
        WHERE gm.user_id = ? AND gm.status = 'accepted'
        ORDER BY COALESCE(m.created_at, g.created_at) DESC
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
		var groupCreatedAt time.Time
		var lastMessage sql.NullString
		var lastMessageTime sql.NullTime

		err := rows.Scan(&groupID, &groupName, &groupCreatedAt, &lastMessage, &lastMessageTime)
		if err != nil {
			return nil, err
		}

		var lastMsg *string
		if lastMessage.Valid {
			lastMsg = &lastMessage.String
		}

		timestamp := groupCreatedAt
		if lastMessageTime.Valid {
			timestamp = lastMessageTime.Time
		}

		chat := models.UnifiedChatItem{
			ID:              fmt.Sprintf("group_%d", groupID),
			Type:            "group",
			Name:            groupName,
			LastMessage:     lastMsg,
			LastMessageTime: timestamp,
			HasUnread:       false, // TODO: Implement unread count
			UnreadCount:     0,     // TODO: Implement unread count
		}
		chats = append(chats, chat)
	}

	return chats, nil
}