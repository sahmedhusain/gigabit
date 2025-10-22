package services

import (
	"database/sql"
	"errors"
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
	canMessage, err := s.canUsersMessage(message.SenderID, message.ReceiverID)
	if err != nil || !canMessage {
		return sql.ErrNoRows
	}

	query := `
	INSERT INTO private_messages (conversation_id, sender_id, content, is_read, created_at)
	VALUES (?, ?, ?, false, ?)
	`

	now := time.Now()

	conversationID, err := s.getOrCreatePrivateConversation(message.SenderID, message.ReceiverID)
	if err != nil {
		return err
	}

	restoreQuery := `
		UPDATE private_conversations
		SET participant1_deleted = CASE WHEN participant1_id = ? THEN FALSE ELSE participant1_deleted END,
			participant2_deleted = CASE WHEN participant2_id = ? THEN FALSE ELSE participant2_deleted END
		WHERE id = ?
	`
	_, err = s.db.Exec(restoreQuery, message.SenderID, message.SenderID, conversationID)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(restoreQuery, message.ReceiverID, message.ReceiverID, conversationID)
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

	err = s.updatePrivateConversationLastMessage(conversationID, uint(id))
	if err != nil {
	}

	err = s.incrementPrivateUnreadCount(conversationID, message.ReceiverID)
	if err != nil {
	}

	s.createMessageNotification(message.SenderID, message.ReceiverID, message.ID)

	return nil
}

func (s *MessageService) SendGroupMessage(message *models.Message) error {
	isMember, err := s.isUserGroupMember(*message.GroupID, message.SenderID)
	if err != nil || !isMember {
		return sql.ErrNoRows
	}

	role, err := s.getUserRoleInGroup(*message.GroupID, message.SenderID)
	if err != nil {
		return errors.New("user is not a member of this group")
	}

	canSendMessages, err := s.canUserSendMessages(*message.GroupID, role)
	if err != nil {
		return err
	}
	if !canSendMessages {
		return errors.New("you don't have permission to send messages in this group")
	}

	query := `
	INSERT INTO group_messages (conversation_id, sender_id, content, is_read, created_at)
	VALUES (?, ?, ?, false, ?)
	`

	now := time.Now()

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

	err = s.updateGroupConversationLastMessage(conversationID, uint(id))
	if err != nil {
	}

	return nil
}

func (s *MessageService) GetPrivateMessages(userID1, userID2 uint, limit, offset int) ([]models.MessageResponse, error) {
	canMessage, err := s.canUsersMessage(userID1, userID2)
	if err != nil || !canMessage {
		return nil, sql.ErrNoRows
	}

	conversationID, err := s.GetPrivateConversationID(userID1, userID2)
	if err != nil {
		return nil, err
	}

	var p1ID, p2ID uint
	var delAt sql.NullString
	var isDeleted bool
	delQuery := `
		SELECT participant1_id, participant2_id,
			   CASE WHEN participant1_id = ? THEN participant1_deleted_at ELSE participant2_deleted_at END as deleted_at,
			   CASE WHEN participant1_id = ? THEN participant1_deleted ELSE participant2_deleted END as is_deleted
		FROM private_conversations WHERE id = ?
	`
	if err := s.db.QueryRow(delQuery, userID1, userID1, conversationID).Scan(&p1ID, &p2ID, &delAt, &isDeleted); err != nil {
		return nil, err
	}

	query := `
	SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
	   u.first_name, u.last_name, u.avatar, u.nickname,
	   COALESCE(s.id, 0) as share_id,
	   COALESCE(p.id, 0) as post_id,
	   COALESCE(p.user_id, 0) as post_user_id,
	   COALESCE(p.content, '') as post_content,
	   COALESCE(p.image_url, '') as post_image_url,
	   COALESCE(p.privacy, '') as post_privacy,
	   COALESCE(p.created_at, '') as post_created_at,
	   COALESCE(pu.first_name, '') as post_user_first_name,
	   COALESCE(pu.last_name, '') as post_user_last_name,
	   COALESCE(pu.avatar, '') as post_user_avatar,
	   COALESCE(pu.nickname, '') as post_user_nickname,
	   COALESCE(like_stats.like_count, 0) as like_count,
	   COALESCE(comment_stats.comment_count, 0) as comment_count,
	   COALESCE(share_stats.share_count, 0) as share_count
	FROM private_messages m
	JOIN users u ON m.sender_id = u.id
	LEFT JOIN shares s ON m.id = s.message_id
	LEFT JOIN posts p ON s.post_id = p.id
	LEFT JOIN users pu ON p.user_id = pu.id
	LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) like_stats ON p.id = like_stats.post_id
	LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) comment_stats ON p.id = comment_stats.post_id
	LEFT JOIN (SELECT post_id, COUNT(*) as share_count FROM shares WHERE message_id IS NOT NULL GROUP BY post_id) share_stats ON p.id = share_stats.post_id
	WHERE m.conversation_id = ?
	  AND (? IS NULL OR m.created_at > ?)
	ORDER BY m.created_at DESC
	LIMIT ? OFFSET ?
	`

	var delAtVal interface{}
	if delAt.Valid && delAt.String != "" {
		delAtVal = delAt.String
	} else {
		delAtVal = nil
	}

	rows, err := s.db.Query(query, conversationID, delAtVal, delAtVal, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.MessageResponse
	for rows.Next() {
		var message models.MessageResponse
		var sender models.UserResponse
		var isReadInDB bool
		var shareID, postID, postUserID uint
		var postContent, postImageURL, postPrivacy, postCreatedAt string
		var postUserFirstName, postUserLastName, postUserAvatar, postUserNickname string
		var likeCount, commentCount, shareCount int64

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.Content, &isReadInDB, &message.CreatedAt,
			&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
			&shareID, &postID, &postUserID, &postContent, &postImageURL, &postPrivacy, &postCreatedAt,
			&postUserFirstName, &postUserLastName, &postUserAvatar, &postUserNickname,
			&likeCount, &commentCount, &shareCount,
		)
		if err != nil {
			return nil, err
		}

		sender.ID = message.SenderID
		message.Sender = sender
		message.MessageType = "private"
		message.UpdatedAt = message.CreatedAt

		if message.SenderID == userID1 {
			message.ReceiverID = userID2
			message.IsRead = true
		} else {
			message.ReceiverID = userID1
			message.IsRead = isReadInDB
		}

		if shareID > 0 && postID > 0 {
			var postImageURLPtr *string
			if postImageURL != "" {
				postImageURLPtr = &postImageURL
			}

			var postUserAvatarPtr, postUserNicknamePtr *string
			if postUserAvatar != "" {
				postUserAvatarPtr = &postUserAvatar
			}
			if postUserNickname != "" {
				postUserNicknamePtr = &postUserNickname
			}

			postUser := models.UserResponse{
				ID:        postUserID,
				FirstName: postUserFirstName,
				LastName:  postUserLastName,
				Avatar:    postUserAvatarPtr,
				Nickname:  postUserNicknamePtr,
			}

			sharedPost := models.SharedPostResponse{
				ID:           postID,
				UserID:       postUserID,
				Content:      postContent,
				ImageURL:     postImageURLPtr,
				Privacy:      postPrivacy,
				User:         postUser,
				LikeCount:    likeCount,
				CommentCount: commentCount,
				ShareCount:   shareCount,
			}

			if postCreatedAt != "" {
				if parsedTime, err := time.Parse(time.RFC3339, postCreatedAt); err == nil {
					sharedPost.CreatedAt = parsedTime
				}
			}

			message.SharedPost = &sharedPost
		}

		messages = append(messages, message)
	}

	return messages, nil
}

func (s *MessageService) GetGroupMessages(groupID, userID uint, limit, offset int) ([]models.MessageResponse, error) {
	isMember, err := s.isUserGroupMember(groupID, userID)
	if err != nil || !isMember {
		return nil, sql.ErrNoRows
	}

	conversationID, err := s.GetGroupConversationID(groupID)
	if err != nil {
		return nil, err
	}

	query := `
	SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
	   u.first_name, u.last_name, u.avatar, u.nickname,
	   g.name,
	   COALESCE(s.id, 0) as share_id,
	   COALESCE(p.id, 0) as post_id,
	   COALESCE(p.user_id, 0) as post_user_id,
	   COALESCE(p.content, '') as post_content,
	   COALESCE(p.image_url, '') as post_image_url,
	   COALESCE(p.privacy, '') as post_privacy,
	   COALESCE(p.created_at, '') as post_created_at,
	   COALESCE(pu.first_name, '') as post_user_first_name,
	   COALESCE(pu.last_name, '') as post_user_last_name,
	   COALESCE(pu.avatar, '') as post_user_avatar,
	   COALESCE(pu.nickname, '') as post_user_nickname,
	   COALESCE(like_stats.like_count, 0) as like_count,
	   COALESCE(comment_stats.comment_count, 0) as comment_count,
	   COALESCE(share_stats.share_count, 0) as share_count
	FROM group_messages m
	JOIN users u ON m.sender_id = u.id
	JOIN groups g ON g.id = ?
	LEFT JOIN shares s ON m.id = s.message_id
	LEFT JOIN posts p ON s.post_id = p.id
	LEFT JOIN users pu ON p.user_id = pu.id
	LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) like_stats ON p.id = like_stats.post_id
	LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) comment_stats ON p.id = comment_stats.post_id
	LEFT JOIN (SELECT post_id, COUNT(*) as share_count FROM shares WHERE message_id IS NOT NULL GROUP BY post_id) share_stats ON p.id = share_stats.post_id
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
		var shareID, postID, postUserID uint
		var postContent, postImageURL, postPrivacy, postCreatedAt string
		var postUserFirstName, postUserLastName, postUserAvatar, postUserNickname string
		var likeCount, commentCount, shareCount int64

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.Content, &message.IsRead, &message.CreatedAt,
			&sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
			&groupName,
			&shareID, &postID, &postUserID, &postContent, &postImageURL, &postPrivacy, &postCreatedAt,
			&postUserFirstName, &postUserLastName, &postUserAvatar, &postUserNickname,
			&likeCount, &commentCount, &shareCount,
		)
		if err != nil {
			return nil, err
		}

		sender.ID = message.SenderID
		message.Sender = sender
		message.MessageType = "group"
		message.GroupID = &groupID
		message.UpdatedAt = message.CreatedAt

		group := models.GroupMessageResponse{
			ID:    groupID,
			Title: groupName,
		}
		message.Group = &group

		if shareID > 0 && postID > 0 {
			var postImageURLPtr *string
			if postImageURL != "" {
				postImageURLPtr = &postImageURL
			}

			var postUserAvatarPtr, postUserNicknamePtr *string
			if postUserAvatar != "" {
				postUserAvatarPtr = &postUserAvatar
			}
			if postUserNickname != "" {
				postUserNicknamePtr = &postUserNickname
			}

			postUser := models.UserResponse{
				ID:        postUserID,
				FirstName: postUserFirstName,
				LastName:  postUserLastName,
				Avatar:    postUserAvatarPtr,
				Nickname:  postUserNicknamePtr,
			}

			sharedPost := models.SharedPostResponse{
				ID:           postID,
				UserID:       postUserID,
				Content:      postContent,
				ImageURL:     postImageURLPtr,
				Privacy:      postPrivacy,
				User:         postUser,
				LikeCount:    likeCount,
				CommentCount: commentCount,
				ShareCount:   shareCount,
			}

			if postCreatedAt != "" {
				if parsedTime, err := time.Parse(time.RFC3339, postCreatedAt); err == nil {
					sharedPost.CreatedAt = parsedTime
				}
			}

			message.SharedPost = &sharedPost
		}

		messages = append(messages, message)
	}

	return messages, nil
}

func (s *MessageService) canUsersMessage(userID1, userID2 uint) (bool, error) {
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
		WHERE group_id = ? AND user_id = ? AND (status = 'member' OR status = 'accepted')
	`

	var count int
	err := s.db.QueryRow(query, groupID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *MessageService) getUserRoleInGroup(groupID, userID uint) (string, error) {
	query := `
		SELECT role FROM group_members 
		WHERE group_id = ? AND user_id = ? AND status = 'member'
	`

	var role string
	err := s.db.QueryRow(query, groupID, userID).Scan(&role)
	if err == sql.ErrNoRows {
		return "", sql.ErrNoRows
	}
	if err != nil {
		return "", err
	}

	return role, nil
}

func (s *MessageService) canUserSendMessages(groupID uint, userRole string) (bool, error) {
	var sendMessages string
	err := s.db.QueryRow("SELECT send_messages FROM groups WHERE id = ?", groupID).Scan(&sendMessages)
	if err != nil {
		return false, err
	}

	return sendMessages == "all_members" || userRole == "admin" || userRole == "creator", nil
}

func (s *MessageService) createMessageNotification(senderID, receiverID, messageID uint) error {
	senderQuery := `SELECT first_name, last_name FROM users WHERE id = ?`
	var firstName, lastName string
	err := s.db.QueryRow(senderQuery, senderID).Scan(&firstName, &lastName)
	if err != nil {
		return err
	}

	notificationQuery := `
		INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, title, message, is_read, created_at, updated_at)
		VALUES (?, ?, 'new_message', 'message', ?, 'New Message', ?, false, ?, ?)
	`

	now := time.Now()
	message := fmt.Sprintf("New message from %s %s", firstName, lastName)

	_, err = s.db.Exec(notificationQuery, receiverID, senderID, messageID, message, now, now)
	return err
}

func (s *MessageService) getOrCreatePrivateConversation(userID1, userID2 uint) (uint, error) {
	var participant1ID, participant2ID uint
	if userID1 < userID2 {
		participant1ID = userID1
		participant2ID = userID2
	} else {
		participant1ID = userID2
		participant2ID = userID1
	}

	var existingID uint
	checkQuery := `
		SELECT id FROM private_conversations
		WHERE participant1_id = ? AND participant2_id = ?
	`
	err := s.db.QueryRow(checkQuery, participant1ID, participant2ID).Scan(&existingID)

	if err == sql.ErrNoRows {
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
	var existingID uint
	checkQuery := `
		SELECT id FROM group_conversations
		WHERE group_id = ?
	`
	err := s.db.QueryRow(checkQuery, groupID).Scan(&existingID)

	if err == sql.ErrNoRows {
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
	var participant1ID, participant2ID uint
	privateQuery := `
		SELECT participant1_id, participant2_id FROM private_conversations
		WHERE id = ?
	`
	err := s.db.QueryRow(privateQuery, conversationID).Scan(&participant1ID, &participant2ID)
	if err == nil {
		var otherUserID uint
		if participant1ID == userID {
			otherUserID = participant2ID
		} else if participant2ID == userID {
			otherUserID = participant1ID
		} else {
			return nil, sql.ErrNoRows
		}

		return s.GetPrivateMessages(userID, otherUserID, limit, offset)
	}

	var groupID uint
	groupQuery := `
		SELECT group_id FROM group_conversations
		WHERE id = ?
	`
	err = s.db.QueryRow(groupQuery, conversationID).Scan(&groupID)
	if err == nil {
		return s.GetGroupMessages(groupID, userID, limit, offset)
	}

	return nil, sql.ErrNoRows
}

func (s *MessageService) MarkMessagesAsRead(messageIDs []uint, userID uint) error {
	if len(messageIDs) == 0 {
		return nil
	}

	query := `
		UPDATE private_messages 
		SET is_read = TRUE 
		WHERE id IN (?) 
		AND sender_id != ?
		AND conversation_id IN (
			SELECT id FROM private_conversations 
			WHERE participant1_id = ? OR participant2_id = ?
		)
	`

	ids := make([]interface{}, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = id
	}

	inClause := strings.Repeat("?,", len(messageIDs))
	inClause = inClause[:len(inClause)-1]

	fullQuery := strings.Replace(query, "?", inClause, 1)

	args := append(ids, userID, userID, userID)

	result, err := s.db.Exec(fullQuery, args...)
	if err != nil {
		return fmt.Errorf("failed to mark private messages as read: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		s.decrementPrivateUnreadCountByMessages(messageIDs, userID)
	}

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

func (s *MessageService) MarkMessagesAsUnread(messageIDs []uint, userID uint) error {
	if len(messageIDs) == 0 {
		return nil
	}

	query := `
		UPDATE private_messages 
		SET is_read = FALSE 
		WHERE id IN (?) 
		AND sender_id != ?
		AND conversation_id IN (
			SELECT id FROM private_conversations 
			WHERE participant1_id = ? OR participant2_id = ?
		)
	`

	ids := make([]interface{}, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = id
	}

	inClause := strings.Repeat("?,", len(messageIDs))
	inClause = inClause[:len(inClause)-1]

	fullQuery := strings.Replace(query, "?", inClause, 1)

	args := append(ids, userID, userID, userID)

	result, err := s.db.Exec(fullQuery, args...)
	if err != nil {
		return fmt.Errorf("failed to mark private messages as unread: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		s.incrementPrivateUnreadCountByMessages(messageIDs, userID)
	}

	groupQuery := `
		UPDATE group_messages 
		SET is_read = FALSE 
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
		return fmt.Errorf("failed to mark group messages as unread: %w", err)
	}

	return nil
}

func (s *MessageService) incrementPrivateUnreadCountByMessages(messageIDs []uint, userID uint) error {
	if len(messageIDs) == 0 {
		return nil
	}

	query := `
		SELECT DISTINCT conversation_id 
		FROM private_messages 
		WHERE id IN (?) 
		AND sender_id != ?
		AND conversation_id IN (
			SELECT id FROM private_conversations 
			WHERE participant1_id = ? OR participant2_id = ?
		)
	`

	inClause := strings.Repeat("?,", len(messageIDs))
	inClause = inClause[:len(inClause)-1]

	fullQuery := strings.Replace(query, "?", inClause, 1)

	ids := make([]interface{}, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = id
	}

	args := append(ids, userID, userID, userID)

	rows, err := s.db.Query(fullQuery, args...)
	if err != nil {
		return fmt.Errorf("failed to get conversation IDs for unread increment: %w", err)
	}
	defer rows.Close()

	var conversationIDs []uint
	for rows.Next() {
		var convID uint
		if err := rows.Scan(&convID); err != nil {
			continue
		}
		conversationIDs = append(conversationIDs, convID)
	}

	for _, convID := range conversationIDs {
		err = s.incrementPrivateUnreadCount(convID, userID)
		if err != nil {
			return fmt.Errorf("failed to increment unread count for conversation %d: %w", convID, err)
		}
	}

	return nil
}

func (s *MessageService) incrementPrivateUnreadCount(conversationID, userID uint) error {
	updateQuery := `
		UPDATE private_conversations
		SET unread_count1 = CASE WHEN participant1_id = ? THEN unread_count1 + 1 ELSE unread_count1 END,
		    unread_count2 = CASE WHEN participant2_id = ? THEN unread_count2 + 1 ELSE unread_count2 END,
		    updated_at = ?
		WHERE id = ?
	`
	now := time.Now()
	_, err := s.db.Exec(updateQuery, userID, userID, now, conversationID)
	return err
}

func (s *MessageService) decrementPrivateUnreadCountByMessages(messageIDs []uint, userID uint) error {
	if len(messageIDs) == 0 {
		return nil
	}

	countQuery := `
		SELECT COUNT(*) FROM private_messages 
		WHERE id IN (?) 
		AND sender_id != ?
		AND conversation_id IN (
			SELECT id FROM private_conversations 
			WHERE participant1_id = ? OR participant2_id = ?
		)
	`

	ids := make([]interface{}, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = id
	}

	inClause := strings.Repeat("?,", len(messageIDs))
	inClause = inClause[:len(inClause)-1]

	fullCountQuery := strings.Replace(countQuery, "?", inClause, 1)
	countArgs := append(ids, userID, userID, userID)

	var count int
	err := s.db.QueryRow(fullCountQuery, countArgs...).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		return nil
	}

	updateQuery := `
		UPDATE private_conversations
		SET unread_count1 = CASE WHEN participant1_id = ? THEN GREATEST(unread_count1 - ?, 0) ELSE unread_count1 END,
		    unread_count2 = CASE WHEN participant2_id = ? THEN GREATEST(unread_count2 - ?, 0) ELSE unread_count2 END,
		    updated_at = ?
		WHERE participant1_id = ? OR participant2_id = ?
	`
	now := time.Now()
	_, err = s.db.Exec(updateQuery, userID, count, userID, count, now, userID, userID)
	return err
}

func (s *MessageService) MarkConversationAsRead(conversationID uint, userID uint, conversationType string) error {
	if conversationType == "group" {
		query := `
			UPDATE group_messages 
			SET is_read = TRUE 
			WHERE conversation_id = ? 
			AND sender_id != ?
			AND is_read = FALSE
		`
		_, err := s.db.Exec(query, conversationID, userID)
		return err
	} else {
		query := `
			UPDATE private_messages 
			SET is_read = TRUE 
			WHERE conversation_id = ? 
			AND sender_id != ?
			AND is_read = FALSE
		`
		_, err := s.db.Exec(query, conversationID, userID)
		return err
	}
}

func (s *MessageService) MarkConversationAsUnread(conversationID uint, userID uint, conversationType string) error {
	if conversationType == "group" {
		query := `
			UPDATE group_messages 
			SET is_read = FALSE 
			WHERE conversation_id = ? 
			AND sender_id != ?
			AND id = (
				SELECT id FROM group_messages 
				WHERE conversation_id = ? AND sender_id != ?
				ORDER BY created_at DESC 
				LIMIT 1
			)
		`
		_, err := s.db.Exec(query, conversationID, userID, conversationID, userID)
		return err
	} else {
		query := `
			UPDATE private_messages 
			SET is_read = FALSE 
			WHERE conversation_id = ? 
			AND sender_id != ?
			AND id = (
				SELECT id FROM private_messages 
				WHERE conversation_id = ? AND sender_id != ?
				ORDER BY created_at DESC 
				LIMIT 1
			)
		`
		_, err := s.db.Exec(query, conversationID, userID, conversationID, userID)
		return err
	}
}

func (s *MessageService) SearchMessages(userID uint, query string, limit, offset int) ([]models.ConversationSearchResult, error) {
	if strings.TrimSpace(query) == "" {
		return []models.ConversationSearchResult{}, nil
	}

	searchPattern := "%" + strings.ToLower(query) + "%"

	// Search in private messages - simplified query
	privateQuery := `
		SELECT DISTINCT
			'private' as type,
			pc.id as conversation_id,
			CASE WHEN pc.participant1_id = ? THEN pc.participant2_id ELSE pc.participant1_id END as participant_id,
			pm.id as matching_message_id,
			pm.content as matching_message,
			pm.created_at as message_time,
			u.first_name,
			u.last_name,
			u.avatar
		FROM private_messages pm
		JOIN private_conversations pc ON pm.conversation_id = pc.id
		JOIN users u ON u.id = CASE WHEN pc.participant1_id = ? THEN pc.participant2_id ELSE pc.participant1_id END
		WHERE (pc.participant1_id = ? OR pc.participant2_id = ?)
		AND LOWER(pm.content) LIKE ?
		ORDER BY pm.created_at DESC
		LIMIT ? OFFSET ?
	`

	// Search in group messages - simplified query
	groupQuery := `
		SELECT DISTINCT
			'group' as type,
			gc.id as conversation_id,
			g.id as group_id,
			g.name as group_name,
			g.avatar as group_avatar,
			gm.id as matching_message_id,
			gm.content as matching_message,
			gm.created_at as message_time,
			u.first_name,
			u.last_name,
			u.avatar
		FROM group_messages gm
		JOIN group_conversations gc ON gm.conversation_id = gc.id
		JOIN groups g ON gc.group_id = g.id
		JOIN group_members gmbr ON g.id = gmbr.group_id AND gmbr.user_id = ?
		JOIN users u ON gm.sender_id = u.id
		WHERE LOWER(gm.content) LIKE ?
		ORDER BY gm.created_at DESC
		LIMIT ? OFFSET ?
	`

	var results []models.ConversationSearchResult

	// Flexible timestamp parser to handle various SQLite datetime formats
	parseTS := func(s string) time.Time {
		layouts := []string{
			time.RFC3339,
			"2006-01-02 15:04:05Z07:00",
			"2006-01-02 15:04:05",
		}
		for _, l := range layouts {
			if t, err := time.Parse(l, s); err == nil {
				return t
			}
		}
		// Fallback to now to avoid failing the whole search on parse issues
		return time.Now()
	}

	// Search private messages
	privateRows, err := s.db.Query(privateQuery,
		userID, userID, userID, userID, searchPattern, limit, offset)
	if err != nil {
		// Non-fatal: continue with group messages
	} else {
		defer privateRows.Close()

		for privateRows.Next() {
			var result models.ConversationSearchResult
			var participantID uint
			var firstName, lastName sql.NullString
			var avatar sql.NullString
			var messageTimeStr string

			err := privateRows.Scan(
				&result.Type,
				&result.ConversationID,
				&participantID,
				&result.MatchingMessageID,
				&result.MatchingMessage,
				&messageTimeStr,
				&firstName,
				&lastName,
				&avatar,
			)
			if err != nil {
				// Non-fatal scan issue: skip this row and continue
				continue
			}

			// Parse timestamp
			result.MessageTime = parseTS(messageTimeStr)

			// Set participant info
			result.ParticipantID = participantID
			if firstName.Valid && lastName.Valid {
				result.ParticipantName = firstName.String + " " + lastName.String
			}
			if avatar.Valid {
				result.ParticipantAvatar = &avatar.String
			}

			results = append(results, result)
		}
	}

	// Search group messages
	groupRows, err := s.db.Query(groupQuery, userID, searchPattern, limit, offset)
	if err != nil {
		// Non-fatal: return whatever private results we have
	} else {
		defer groupRows.Close()

		for groupRows.Next() {
			var result models.ConversationSearchResult
			var groupID uint
			var groupName, groupAvatar sql.NullString
			var senderFirstName, senderLastName, senderAvatar sql.NullString
			var messageTimeStr string

			err := groupRows.Scan(
				&result.Type,
				&result.ConversationID,
				&groupID,
				&groupName,
				&groupAvatar,
				&result.MatchingMessageID,
				&result.MatchingMessage,
				&messageTimeStr,
				&senderFirstName,
				&senderLastName,
				&senderAvatar,
			)
			if err != nil {
				// Non-fatal scan issue: skip this row and continue
				continue
			}

			// Parse timestamp
			result.MessageTime = parseTS(messageTimeStr)

			// Set group info
			result.GroupID = &groupID
			if groupName.Valid {
				result.GroupName = &groupName.String
			}
			if groupAvatar.Valid {
				result.GroupAvatar = &groupAvatar.String
			}

			// Set sender info
			if senderFirstName.Valid && senderLastName.Valid {
				result.SenderName = senderFirstName.String + " " + senderLastName.String
			}
			if senderAvatar.Valid {
				result.SenderAvatar = &senderAvatar.String
			}

			results = append(results, result)
		}
	}

	return results, nil
}
