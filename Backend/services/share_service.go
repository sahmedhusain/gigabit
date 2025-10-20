package services

import (
	"database/sql"
	"fmt"
	"log"
	"social/models"
	"social/websocket"
	"time"
)

type ShareService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewShareService(db *sql.DB, hub *websocket.Hub) *ShareService {
	return &ShareService{
		db:  db,
		hub: hub,
	}
}

func (s *ShareService) SharePost(userID uint, req *models.ShareRequest) error {
	// Validate max 5 each
	if len(req.ConversationIDs) > 5 || len(req.GroupIDs) > 5 || len(req.UserIDs) > 5 {
		return sql.ErrNoRows // Use as invalid input error
	}

	// Get post to share
	post, err := s.getPostByID(req.PostID)
	if err != nil {
		return err
	}

	// Share to conversations
	for _, convID := range req.ConversationIDs {
		if err := s.shareToConversation(userID, req.PostID, convID, post); err != nil {
			log.Printf("Failed to share post %d to conversation %d: %v", req.PostID, convID, err)
			continue
		}
	}

	// Share to groups
	for _, groupID := range req.GroupIDs {
		if err := s.shareToGroup(userID, req.PostID, groupID, post); err != nil {
			log.Printf("Failed to share post %d to group %d: %v", req.PostID, groupID, err)
			continue
		}
	}

	// Share to users (following users without existing conversations)
	for _, targetUserID := range req.UserIDs {
		if err := s.shareToUser(userID, req.PostID, targetUserID, post); err != nil {
			log.Printf("Failed to share post %d to user %d: %v", req.PostID, targetUserID, err)
			continue
		}
	}

	// Update share count
	totalShares := len(req.ConversationIDs) + len(req.GroupIDs) + len(req.UserIDs)
	if totalShares > 0 {
		if err := s.incrementShareCount(req.PostID, totalShares); err != nil {
			log.Printf("Failed to increment share count for post %d: %v", req.PostID, err)
		}
	}

	return nil
}

func (s *ShareService) shareToConversation(userID, postID, conversationID uint, post *models.PostResponse) error {
	// Create message content
	content := "Shared a post: " + post.Content
	if len(content) > 100 {
		content = content[:97] + "..."
	}

	// Get the other participant
	var otherUserID uint
	err := s.db.QueryRow("SELECT participant1_id, participant2_id FROM private_conversations WHERE id = ?", conversationID).Scan(&otherUserID, &otherUserID)
	if err != nil {
		return err
	}
	if otherUserID == userID {
		// Get the other one
		err = s.db.QueryRow("SELECT CASE WHEN participant1_id = ? THEN participant2_id ELSE participant1_id END FROM private_conversations WHERE id = ?", userID, conversationID).Scan(&otherUserID)
		if err != nil {
			return err
		}
	}

	// Insert message into private_messages table
	result, err := s.db.Exec(`
		INSERT INTO private_messages (conversation_id, sender_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`, conversationID, userID, content, time.Now())
	if err != nil {
		return err
	}

	messageID, err := result.LastInsertId()
	if err != nil {
		return err
	}

	// Record the share
	_, err = s.db.Exec(`
		INSERT INTO shares (post_id, user_id, conversation_id, message_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, postID, userID, conversationID, uint(messageID), time.Now())
	if err != nil {
		return err
	}

	// Update conversation last message
	_, err = s.db.Exec(`
		UPDATE private_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?
	`, messageID, time.Now(), conversationID)

	// Increment unread count for the receiver
	updateQuery := `
		UPDATE private_conversations
		SET unread_count1 = CASE WHEN participant1_id = ? THEN unread_count1 + 1 ELSE unread_count1 END,
		    unread_count2 = CASE WHEN participant2_id = ? THEN unread_count2 + 1 ELSE unread_count2 END,
		    updated_at = ?
		WHERE id = ?
	`
	_, updateErr := s.db.Exec(updateQuery, otherUserID, otherUserID, time.Now(), conversationID)
	if updateErr != nil {
		log.Printf("Failed to increment unread count: %v", updateErr)
	}

	return err
}

func (s *ShareService) shareToGroup(userID, postID, groupID uint, post *models.PostResponse) error {
	// Create message content
	content := "Shared a post: " + post.Content
	if len(content) > 100 {
		content = content[:97] + "..."
	}

	// Get or create conversation
	var conversationID uint
	checkQuery := `SELECT id FROM group_conversations WHERE group_id = ?`
	err := s.db.QueryRow(checkQuery, groupID).Scan(&conversationID)
	if err == sql.ErrNoRows {
		// Create new conversation
		insertQuery := `INSERT INTO group_conversations (group_id, created_at, updated_at) VALUES (?, ?, ?)`
		now := time.Now()
		result, err := s.db.Exec(insertQuery, groupID, now, now)
		if err != nil {
			return err
		}
		convID, err := result.LastInsertId()
		if err != nil {
			return err
		}
		conversationID = uint(convID)
	} else if err != nil {
		return err
	}

	// Insert message into group_messages table
	result, err := s.db.Exec(`
		INSERT INTO group_messages (conversation_id, sender_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`, conversationID, userID, content, time.Now())
	if err != nil {
		return err
	}

	messageID, err := result.LastInsertId()
	if err != nil {
		return err
	}

	// Record the share
	_, err = s.db.Exec(`
		INSERT INTO shares (post_id, user_id, group_id, message_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, postID, userID, groupID, uint(messageID), time.Now())
	if err != nil {
		return err
	}

	// Update conversation last message
	_, err = s.db.Exec(`
		UPDATE group_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?
	`, messageID, time.Now(), conversationID)

	return err
}

func (s *ShareService) shareToUser(userID, postID, targetUserID uint, post *models.PostResponse) error {
	// Create message content
	content := "Shared a post: " + post.Content
	if len(content) > 100 {
		content = content[:97] + "..."
	}

	// Check if conversation already exists
	var conversationID uint
	checkQuery := `
		SELECT id FROM private_conversations
		WHERE (participant1_id = ? AND participant2_id = ?)
		   OR (participant1_id = ? AND participant2_id = ?)
	`
	err := s.db.QueryRow(checkQuery, userID, targetUserID, targetUserID, userID).Scan(&conversationID)

	if err == sql.ErrNoRows {
		// Create new conversation
		insertQuery := `
			INSERT INTO private_conversations (participant1_id, participant2_id, created_at, updated_at)
			VALUES (?, ?, ?, ?)
		`
		now := time.Now()
		result, err := s.db.Exec(insertQuery, userID, targetUserID, now, now)
		if err != nil {
			return err
		}
		convID, err := result.LastInsertId()
		if err != nil {
			return err
		}
		conversationID = uint(convID)
	} else if err != nil {
		return err
	}

	// Insert message into private_messages table
	result, err := s.db.Exec(`
		INSERT INTO private_messages (conversation_id, sender_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`, conversationID, userID, content, time.Now())
	if err != nil {
		return err
	}

	messageID, err := result.LastInsertId()
	if err != nil {
		return err
	}

	// Record the share
	_, err = s.db.Exec(`
		INSERT INTO shares (post_id, user_id, conversation_id, message_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, postID, userID, conversationID, uint(messageID), time.Now())
	if err != nil {
		return err
	}

	// Update conversation last message
	_, err = s.db.Exec(`
		UPDATE private_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?
	`, messageID, time.Now(), conversationID)

	// Increment unread count for the receiver
	updateQuery := `
		UPDATE private_conversations
		SET unread_count1 = CASE WHEN participant1_id = ? THEN unread_count1 + 1 ELSE unread_count1 END,
		    unread_count2 = CASE WHEN participant2_id = ? THEN unread_count2 + 1 ELSE unread_count2 END,
		    updated_at = ?
		WHERE id = ?
	`
	_, updateErr := s.db.Exec(updateQuery, targetUserID, targetUserID, time.Now(), conversationID)
	if updateErr != nil {
		log.Printf("Failed to increment unread count: %v", updateErr)
	}

	return err
}

func (s *ShareService) getPostByID(postID uint) (*models.PostResponse, error) {
	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.created_at, p.updated_at,
		       u.first_name, u.last_name, u.avatar, u.nickname
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = ?
	`

	var post models.PostResponse
	var user models.UserResponse

	err := s.db.QueryRow(query, postID).Scan(
		&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
		&post.CreatedAt, &post.UpdatedAt,
		&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
	)
	if err != nil {
		return nil, err
	}

	user.ID = post.UserID
	post.User = user

	return &post, nil
}

func (s *ShareService) incrementShareCount(postID uint, count int) error {
	_, err := s.db.Exec(`
		UPDATE posts SET share_count = share_count + ? WHERE id = ?
	`, count, postID)
	return err
}

func (s *ShareService) GetRecentChatsAndGroups(userID uint) ([]models.UnifiedChatItem, error) {
	// Get recent private conversations
	privateQuery := `
		SELECT pc.id, 'private' as type, u.first_name || ' ' || u.last_name as name, u.avatar,
		       pm.content as last_message, pm.created_at as last_message_time,
		       CASE WHEN pc.unread_count1 > 0 OR pc.unread_count2 > 0 THEN 1 ELSE 0 END as has_unread,
		       CASE WHEN pc.unread_count1 > 0 THEN pc.unread_count1 ELSE pc.unread_count2 END as unread_count,
		       CASE WHEN u.id != ? THEN 1 ELSE 0 END as is_online,
		       pc.id as conversation_id,
		       u.id as participant_id
		FROM private_conversations pc
		JOIN users u ON (u.id = pc.participant1_id OR u.id = pc.participant2_id) AND u.id != ?
		LEFT JOIN private_messages pm ON pc.last_message_id = pm.id
		WHERE ((pc.participant1_id = ? AND pc.participant1_deleted = FALSE) OR (pc.participant2_id = ? AND pc.participant2_deleted = FALSE))
		ORDER BY COALESCE(pm.created_at, pc.updated_at) DESC LIMIT 5
	`

	// Get recent group conversations
	groupQuery := `
		SELECT gc.id, 'group' as type, g.name as name, g.avatar,
		       gm.content as last_message, gm.created_at as last_message_time,
		       0 as has_unread, 0 as unread_count, 0 as is_online, NULL as typing_users,
		       gc.id as conversation_id, NULL as participant_id, g.id as group_id
		FROM group_conversations gc
		JOIN groups g ON gc.group_id = g.id
		JOIN group_members gmbr ON g.id = gmbr.group_id AND gmbr.user_id = ? AND gmbr.status = 'member'
		LEFT JOIN group_messages gm ON gc.last_message_id = gm.id
		ORDER BY COALESCE(gm.created_at, gc.updated_at) DESC LIMIT 5
	`

	var items []models.UnifiedChatItem

	// Private chats
	rows, err := s.db.Query(privateQuery, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item models.UnifiedChatItem
		var conversationID uint
		var participantID uint
		var unreadCount int
		var convIDStr string
		var lastMessageTime sql.NullTime
		err := rows.Scan(
			&convIDStr, &item.Type, &item.Name, &item.Avatar,
			&item.LastMessage, &lastMessageTime,
			&item.HasUnread, &unreadCount, &item.IsOnline,
			&conversationID, &participantID,
		)
		if err != nil {
			continue
		}
		if lastMessageTime.Valid {
			item.LastMessageTime = &lastMessageTime.Time
		}
		item.UnreadCount = unreadCount
		item.Unread = unreadCount
		item.ConversationID = conversationID
		item.ParticipantID = &participantID
		// For frontend compatibility, set ID as number for private chats
		item.ID = fmt.Sprintf("%d", conversationID)
		items = append(items, item)
	}

	// Group chats
	rows2, err := s.db.Query(groupQuery, userID)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var item models.UnifiedChatItem
		var groupID uint
		var conversationID uint
		var unreadCount int
		var typingUsers sql.NullString
		var gcIDStr string
		var lastMessageTime sql.NullTime
		var participantID sql.NullInt64
		err := rows2.Scan(
			&gcIDStr, &item.Type, &item.Name, &item.Avatar,
			&item.LastMessage, &lastMessageTime,
			&item.HasUnread, &unreadCount, &item.IsOnline,
			&typingUsers, &conversationID, &participantID, &groupID,
		)
		if err != nil {
			continue
		}
		if lastMessageTime.Valid {
			item.LastMessageTime = &lastMessageTime.Time
		}
		if participantID.Valid {
			pid := uint(participantID.Int64)
			item.ParticipantID = &pid
		}
		item.UnreadCount = unreadCount
		item.Unread = unreadCount
		item.ConversationID = conversationID
		// Create group response
		group := &models.GroupResponse{
			ID:     groupID,
			Title:  item.Name,
			Avatar: item.Avatar,
		}
		item.Group = group
		item.GroupID = &groupID
		// For frontend compatibility, set ID as number for groups
		item.ID = fmt.Sprintf("%d", groupID)
		items = append(items, item)
	}

	return items, nil
}

func (s *ShareService) SearchShareableEntities(userID uint, query string) ([]models.UnifiedChatItem, error) {
	if len(query) < 2 {
		return []models.UnifiedChatItem{}, nil
	}

	var items []models.UnifiedChatItem

	// Search for private conversations (existing chats)
	privateQuery := `
		SELECT pc.id, 'private' as type, u.first_name || ' ' || u.last_name as name, u.avatar,
		       pm.content as last_message, pm.created_at as last_message_time,
		       CASE WHEN pc.unread_count1 > 0 OR pc.unread_count2 > 0 THEN 1 ELSE 0 END as has_unread,
		       CASE WHEN pc.participant1_id = ? THEN pc.unread_count1 ELSE pc.unread_count2 END as unread_count,
		       1 as is_online,
		       pc.id as conversation_id,
		       u.id as participant_id
		FROM private_conversations pc
		JOIN users u ON (u.id = pc.participant1_id OR u.id = pc.participant2_id) AND u.id != ?
		LEFT JOIN private_messages pm ON pc.last_message_id = pm.id
		WHERE (pc.participant1_id = ? OR pc.participant2_id = ?)
		AND (u.first_name LIKE ? OR u.last_name LIKE ? OR (u.first_name || ' ' || u.last_name) LIKE ?)
		ORDER BY COALESCE(pm.created_at, pc.updated_at) DESC
	`

	// Search for groups the user is member of
	groupQuery := `
		SELECT g.id, 'group' as type, g.name as name, g.avatar,
		       NULL as last_message, NULL as last_message_time,
		       0 as has_unread, 0 as unread_count, 0 as is_online,
		       0 as conversation_id, NULL as participant_id, g.id as group_id
		FROM groups g
		JOIN group_members gmbr ON g.id = gmbr.group_id AND gmbr.user_id = ? AND gmbr.status = 'member'
		WHERE g.name LIKE ?
		ORDER BY gmbr.created_at DESC
	`

	// Search for users the current user follows (but no existing conversation)
	followingQuery := `
		SELECT DISTINCT u.id, 'following' as type, u.first_name || ' ' || u.last_name as name, u.avatar,
		       NULL as last_message, NULL as last_message_time,
		       0 as has_unread, 0 as unread_count, 1 as is_online, NULL as typing_users,
		       0 as conversation_id,
		       u.id as participant_id, NULL as group_id
		FROM users u
		JOIN follows f ON f.following_id = u.id AND f.follower_id = ? AND f.status = 'accepted'
		WHERE (u.first_name || ' ' || u.last_name LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)
		AND NOT EXISTS (
			SELECT 1 FROM private_conversations pc
			WHERE (pc.participant1_id = ? AND pc.participant2_id = u.id)
			   OR (pc.participant1_id = u.id AND pc.participant2_id = ?)
		)
		ORDER BY u.first_name, u.last_name
	`

	searchPattern := "%" + query + "%"

	// Private chats
	rows, err := s.db.Query(privateQuery, userID, userID, userID, userID, searchPattern, searchPattern, searchPattern)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item models.UnifiedChatItem
		var conversationID uint
		var participantID uint
		var unreadCount int
		var lastMessageTime sql.NullTime
		var idStr string
		var itemType string
		var name string
		var avatar sql.NullString
		var lastMessage sql.NullString
		err := rows.Scan(
			&idStr, &itemType, &name, &avatar,
			&lastMessage, &lastMessageTime,
			&item.HasUnread, &unreadCount, &item.IsOnline,
			&conversationID, &participantID,
		)
		if err != nil {
			continue
		}
		item.ID = idStr
		item.Type = itemType
		item.Name = name
		if avatar.Valid {
			item.Avatar = &avatar.String
		}
		if lastMessage.Valid {
			item.LastMessage = &lastMessage.String
		}
		if lastMessageTime.Valid {
			item.LastMessageTime = &lastMessageTime.Time
		}
		item.UnreadCount = unreadCount
		item.Unread = unreadCount
		item.ConversationID = conversationID
		item.ParticipantID = &participantID
		items = append(items, item)
	}

	// Groups
	rows2, err := s.db.Query(groupQuery, userID, searchPattern)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var item models.UnifiedChatItem
		var groupID uint
		var conversationID uint
		var unreadCount int
		var lastMessageTime sql.NullTime
		var participantID sql.NullInt64
		var idStr string
		var itemType string
		var name string
		var avatar sql.NullString
		var lastMessage sql.NullString
		err := rows2.Scan(
			&idStr, &itemType, &name, &avatar,
			&lastMessage, &lastMessageTime,
			&item.HasUnread, &unreadCount, &item.IsOnline,
			&conversationID, &participantID, &groupID,
		)
		if err != nil {
			continue
		}
		item.ID = idStr
		item.Type = itemType
		item.Name = name
		if avatar.Valid {
			item.Avatar = &avatar.String
		}
		if lastMessage.Valid {
			item.LastMessage = &lastMessage.String
		}
		if lastMessageTime.Valid {
			item.LastMessageTime = &lastMessageTime.Time
		}
		item.UnreadCount = unreadCount
		item.Unread = unreadCount
		item.ConversationID = conversationID
		item.GroupID = &groupID
		// Create group response
		group := &models.GroupResponse{
			ID:     groupID,
			Title:  item.Name,
			Avatar: item.Avatar,
		}
		item.Group = group
		items = append(items, item)
	}

	// Following users (no existing conversation)
	rows3, err := s.db.Query(followingQuery, userID, searchPattern, searchPattern, searchPattern, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows3.Close()

	for rows3.Next() {
		var item models.UnifiedChatItem
		var participantID uint
		var unreadCount int
		var typingUsers sql.NullString
		var uIDStr string
		var lastMessageTime sql.NullTime
		var conversationID uint
		var groupID sql.NullInt64
		err := rows3.Scan(
			&uIDStr, &item.Type, &item.Name, &item.Avatar,
			&item.LastMessage, &lastMessageTime,
			&item.HasUnread, &unreadCount, &item.IsOnline,
			&typingUsers, &conversationID, &participantID, &groupID,
		)
		if err != nil {
			continue
		}
		if lastMessageTime.Valid {
			item.LastMessageTime = &lastMessageTime.Time
		}
		item.UnreadCount = unreadCount
		item.Unread = unreadCount
		item.ConversationID = conversationID
		item.ParticipantID = &participantID
		// For following users, set ID as user ID for creating new conversation
		item.ID = uIDStr
		items = append(items, item)
	}

	return items, nil
}
