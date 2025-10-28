package services

import (
	"database/sql"
	"fmt"
	"social/models"
	"social/websocket"
	"time"
)

type ShareService struct {
	db                  *sql.DB
	hub                 *websocket.Hub
	notificationService *NotificationService
}

func NewShareService(db *sql.DB, hub *websocket.Hub) *ShareService {
	return &ShareService{
		db:                  db,
		hub:                 hub,
		notificationService: NewNotificationService(db, hub),
	}
}

func (s *ShareService) SharePost(userID uint, req *models.ShareRequest) error {
	if len(req.ConversationIDs) > 5 || len(req.GroupIDs) > 5 || len(req.UserIDs) > 5 {
		return sql.ErrNoRows
	}

	post, err := s.getPostByID(req.PostID)
	if err != nil {
		return err
	}

	for _, convID := range req.ConversationIDs {
		messageID, err := s.shareToConversation(userID, req.PostID, convID, post)
		if err == nil && messageID > 0 {
			s.broadcastSharedPost(userID, messageID, convID, 0, post)
			// Create notification for the other participant
			var otherUserID uint
			err := s.db.QueryRow("SELECT participant1_id, participant2_id FROM private_conversations WHERE id = ?", convID).Scan(&otherUserID, &otherUserID)
			if err == nil {
				if otherUserID == userID {
					err = s.db.QueryRow("SELECT CASE WHEN participant1_id = ? THEN participant2_id ELSE participant1_id END FROM private_conversations WHERE id = ?", userID, convID).Scan(&otherUserID)
				}
				if err == nil {
					if notifyErr := s.notificationService.NotifyPostShared(userID, req.PostID, false, 0, otherUserID); notifyErr != nil {
						fmt.Printf("Failed to send post shared notification to user %d: %v\n", otherUserID, notifyErr)
					}
				}
			}
		}
	}

	for _, groupID := range req.GroupIDs {
		messageID, err := s.shareToGroup(userID, req.PostID, groupID, post)
		if err == nil && messageID > 0 {
			s.broadcastSharedPost(userID, messageID, 0, groupID, post)
			// Create notifications for all group members except sender
			memberIDs, err := s.notificationService.GetGroupMemberIDs(groupID, userID)
			if err == nil {
				for _, memberID := range memberIDs {
					if notifyErr := s.notificationService.NotifyPostShared(userID, req.PostID, true, groupID, memberID); notifyErr != nil {
						fmt.Printf("Failed to send post shared notification to group member %d: %v\n", memberID, notifyErr)
					}
				}
			} else {
				fmt.Printf("Failed to get group member IDs for group %d: %v\n", groupID, err)
			}
		}
	}

	for _, targetUserID := range req.UserIDs {
		messageID, err := s.shareToUser(userID, req.PostID, targetUserID, post)
		if err == nil && messageID > 0 {
			// For user shares, we need to get the conversation ID
			var conversationID uint
			checkQuery := `
				SELECT id FROM private_conversations
				WHERE (participant1_id = ? AND participant2_id = ?)
				   OR (participant1_id = ? AND participant2_id = ?)
			`
			err := s.db.QueryRow(checkQuery, userID, targetUserID, targetUserID, userID).Scan(&conversationID)
			if err == nil {
				s.broadcastSharedPost(userID, messageID, conversationID, 0, post)
				// Create notification for the target user
				if notifyErr := s.notificationService.NotifyPostShared(userID, req.PostID, false, 0, targetUserID); notifyErr != nil {
					fmt.Printf("Failed to send post shared notification to user %d: %v\n", targetUserID, notifyErr)
				}
			}
		}
	}

	totalShares := len(req.ConversationIDs) + len(req.GroupIDs) + len(req.UserIDs)
	if totalShares > 0 {
		_ = s.incrementShareCount(req.PostID, totalShares)
	}

	return nil
}

func (s *ShareService) shareToConversation(userID, postID, conversationID uint, post *models.PostResponse) (uint, error) {
	content := "Shared a post: " + post.Content
	if len(content) > 100 {
		content = content[:97] + "..."
	}

	var otherUserID uint
	err := s.db.QueryRow("SELECT participant1_id, participant2_id FROM private_conversations WHERE id = ?", conversationID).Scan(&otherUserID, &otherUserID)
	if err != nil {
		return 0, err
	}
	if otherUserID == userID {
		err = s.db.QueryRow("SELECT CASE WHEN participant1_id = ? THEN participant2_id ELSE participant1_id END FROM private_conversations WHERE id = ?", userID, conversationID).Scan(&otherUserID)
		if err != nil {
			return 0, err
		}
	}

	result, err := s.db.Exec(`
		INSERT INTO private_messages (conversation_id, sender_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`, conversationID, userID, content, time.Now())
	if err != nil {
		return 0, err
	}

	messageID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	_, err = s.db.Exec(`
		INSERT INTO shares (post_id, user_id, conversation_id, message_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, postID, userID, conversationID, uint(messageID), time.Now())
	if err != nil {
		return 0, err
	}

	_, err = s.db.Exec(`
		UPDATE private_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?
	`, messageID, time.Now(), conversationID)

	updateQuery := `
		UPDATE private_conversations
		SET unread_count1 = CASE WHEN participant1_id = ? THEN unread_count1 + 1 ELSE unread_count1 END,
		    unread_count2 = CASE WHEN participant2_id = ? THEN unread_count2 + 1 ELSE unread_count2 END,
		    updated_at = ?
		WHERE id = ?
	`
	_, _ = s.db.Exec(updateQuery, otherUserID, otherUserID, time.Now(), conversationID)

	return uint(messageID), err
}

func (s *ShareService) shareToGroup(userID, postID, groupID uint, post *models.PostResponse) (uint, error) {
	content := "Shared a post: " + post.Content
	if len(content) > 100 {
		content = content[:97] + "..."
	}

	var conversationID uint
	checkQuery := `SELECT id FROM group_conversations WHERE group_id = ?`
	err := s.db.QueryRow(checkQuery, groupID).Scan(&conversationID)
	if err == sql.ErrNoRows {
		insertQuery := `INSERT INTO group_conversations (group_id, created_at, updated_at) VALUES (?, ?, ?)`
		now := time.Now()
		result, err := s.db.Exec(insertQuery, groupID, now, now)
		if err != nil {
			return 0, err
		}
		convID, err := result.LastInsertId()
		if err != nil {
			return 0, err
		}
		conversationID = uint(convID)
	} else if err != nil {
		return 0, err
	}

	result, err := s.db.Exec(`
		INSERT INTO group_messages (conversation_id, sender_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`, conversationID, userID, content, time.Now())
	if err != nil {
		return 0, err
	}

	messageID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	_, err = s.db.Exec(`
		INSERT INTO shares (post_id, user_id, group_id, message_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, postID, userID, groupID, uint(messageID), time.Now())
	if err != nil {
		return 0, err
	}

	_, err = s.db.Exec(`
		UPDATE group_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?
	`, messageID, time.Now(), conversationID)

	return uint(messageID), err
}

func (s *ShareService) shareToUser(userID, postID, targetUserID uint, post *models.PostResponse) (uint, error) {
	content := "Shared a post: " + post.Content
	if len(content) > 100 {
		content = content[:97] + "..."
	}

	var conversationID uint
	checkQuery := `
		SELECT id FROM private_conversations
		WHERE (participant1_id = ? AND participant2_id = ?)
		   OR (participant1_id = ? AND participant2_id = ?)
	`
	err := s.db.QueryRow(checkQuery, userID, targetUserID, targetUserID, userID).Scan(&conversationID)

	if err == sql.ErrNoRows {
		insertQuery := `
			INSERT INTO private_conversations (participant1_id, participant2_id, created_at, updated_at)
			VALUES (?, ?, ?, ?)
		`
		now := time.Now()
		result, err := s.db.Exec(insertQuery, userID, targetUserID, now, now)
		if err != nil {
			return 0, err
		}
		convID, err := result.LastInsertId()
		if err != nil {
			return 0, err
		}
		conversationID = uint(convID)
	} else if err != nil {
		return 0, err
	}

	result, err := s.db.Exec(`
		INSERT INTO private_messages (conversation_id, sender_id, content, is_read, created_at)
		VALUES (?, ?, ?, false, ?)
	`, conversationID, userID, content, time.Now())
	if err != nil {
		return 0, err
	}

	messageID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	_, err = s.db.Exec(`
		INSERT INTO shares (post_id, user_id, conversation_id, message_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, postID, userID, conversationID, uint(messageID), time.Now())
	if err != nil {
		return 0, err
	}

	_, err = s.db.Exec(`
		UPDATE private_conversations SET last_message_id = ?, updated_at = ? WHERE id = ?
	`, messageID, time.Now(), conversationID)

	updateQuery := `
		UPDATE private_conversations
		SET unread_count1 = CASE WHEN participant1_id = ? THEN unread_count1 + 1 ELSE unread_count1 END,
		    unread_count2 = CASE WHEN participant2_id = ? THEN unread_count2 + 1 ELSE unread_count2 END,
		    updated_at = ?
		WHERE id = ?
	`
	_, _ = s.db.Exec(updateQuery, targetUserID, targetUserID, time.Now(), conversationID)

	return uint(messageID), err
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

func (s *ShareService) broadcastSharedPost(userID, messageID, conversationID, groupID uint, post *models.PostResponse) {
	// Get sender information
	var senderFirstName, senderLastName, senderAvatar string
	senderQuery := `SELECT first_name, last_name, avatar FROM users WHERE id = ?`
	err := s.db.QueryRow(senderQuery, userID).Scan(&senderFirstName, &senderLastName, &senderAvatar)
	if err != nil {
		senderFirstName = "Unknown"
		senderLastName = "User"
	}

	// Get like, comment, and share counts
	var likeCount, commentCount, shareCount int64
	statsQuery := `
		SELECT 
			COALESCE(like_stats.like_count, 0) as like_count,
			COALESCE(comment_stats.comment_count, 0) as comment_count,
			COALESCE(share_stats.share_count, 0) as share_count
		FROM posts p
		LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) like_stats ON p.id = like_stats.post_id
		LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) comment_stats ON p.id = comment_stats.post_id
		LEFT JOIN (SELECT post_id, COUNT(*) as share_count FROM shares WHERE message_id IS NOT NULL GROUP BY post_id) share_stats ON p.id = share_stats.post_id
		WHERE p.id = ?
	`
	err = s.db.QueryRow(statsQuery, post.ID).Scan(&likeCount, &commentCount, &shareCount)
	if err != nil {
		likeCount = 0
		commentCount = 0
		shareCount = 0
	}

	// Create WebSocket message
	wsMessage := websocket.Message{
		Type:      websocket.MessageTypeSharedPost,
		From:      userID,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"id":              messageID,
			"conversation_id": conversationID,
			"group_id":        groupID,
			"sender": map[string]interface{}{
				"id":         userID,
				"first_name": senderFirstName,
				"last_name":  senderLastName,
				"avatar":     senderAvatar,
			},
			"shared_post": map[string]interface{}{
				"id":         post.ID,
				"user_id":    post.UserID,
				"content":    post.Content,
				"image_url":  post.ImageURL,
				"privacy":    post.Privacy,
				"created_at": post.CreatedAt.Format(time.RFC3339),
				"user": map[string]interface{}{
					"id":         post.User.ID,
					"first_name": post.User.FirstName,
					"last_name":  post.User.LastName,
					"avatar":     post.User.Avatar,
					"nickname":   post.User.Nickname,
				},
				"like_count":    likeCount,
				"comment_count": commentCount,
				"share_count":   shareCount,
			},
			"created_at": time.Now().Format(time.RFC3339),
		},
	}

	if groupID > 0 {
		wsMessage.GroupID = groupID
	} else {
		// For private messages, we need to determine the recipient
		var recipientID uint
		if conversationID > 0 {
			// Get the other participant in the conversation
			var p1ID, p2ID uint
			err := s.db.QueryRow("SELECT participant1_id, participant2_id FROM private_conversations WHERE id = ?", conversationID).Scan(&p1ID, &p2ID)
			if err == nil {
				if p1ID == userID {
					recipientID = p2ID
				} else {
					recipientID = p1ID
				}
				wsMessage.To = recipientID
			}
		}
	}

	s.hub.BroadcastMessage(wsMessage)
}
