package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"social/models"
	"social/websocket"
	"strings"
	"time"
)

type NotificationService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewNotificationService(db *sql.DB, hub *websocket.Hub) *NotificationService {
	return &NotificationService{
		db:  db,
		hub: hub,
	}
}

func (s *NotificationService) CreateNotification(notification *models.Notification) error {
	fmt.Printf("DEBUG: CreateNotification called - Type: %s, UserID: %d, ActorID: %d\n", notification.Type, notification.UserID, notification.ActorID)

	query := `
		INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, title, message, redirect_url, redirect_type, is_read, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, notification.UserID, notification.ActorID, notification.Type,
		notification.EntityType, notification.EntityID, notification.Title, notification.Message,
		notification.RedirectURL, notification.RedirectType, now, now)
	if err != nil {
		fmt.Printf("DEBUG: Failed to insert notification: %v\n", err)
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		fmt.Printf("DEBUG: Failed to get last insert ID: %v\n", err)
		return err
	}

	notification.ID = uint(id)
	notification.IsRead = false
	notification.CreatedAt = now
	notification.UpdatedAt = now

	fmt.Printf("DEBUG: Notification created with ID: %d\n", notification.ID)

	s.sendRealTimeNotification(notification)

	return nil
}

func (s *NotificationService) GetUserNotifications(userID uint, limit, offset int) ([]models.NotificationResponse, error) {
	query := `
SELECT n.id, n.user_id, n.actor_id, n.type, n.entity_type, n.entity_id,
   n.title, n.message, n.redirect_url, n.redirect_type, n.is_read, n.created_at, n.updated_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   COALESCE(g.id, gm_conversation.group_id, 0) as group_id, 
   COALESCE(g.name, gm_group.name) as group_name, 
   COALESCE(g.avatar, gm_group.avatar) as group_avatar
FROM notifications n
LEFT JOIN users u ON n.actor_id = u.id
LEFT JOIN groups g ON (
    (n.type IN ('group_invite', 'join_request', 'join_accepted', 'group_post', 'event_created', 'new_poll') AND n.entity_id = g.id) OR
    (n.type = 'post_shared' AND n.entity_type = 'group' AND n.entity_id = g.id) OR
    (n.type = 'image_shared' AND n.entity_type = 'group' AND n.entity_id = g.id)
)
LEFT JOIN group_messages gm ON n.type = 'message' AND n.entity_type = 'group_message' AND n.entity_id = gm.id
LEFT JOIN group_conversations gm_conversation ON gm.conversation_id = gm_conversation.id
LEFT JOIN groups gm_group ON gm_conversation.group_id = gm_group.id
WHERE n.user_id = ?
ORDER BY n.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []models.NotificationResponse
	for rows.Next() {
		var notification models.NotificationResponse
		var actor models.UserResponse
		var group models.GroupResponse
		var actorID sql.NullInt64
		var entityType sql.NullString
		var entityID sql.NullInt64
		var title sql.NullString
		var redirectURL sql.NullString
		var redirectType sql.NullString
		var avatar sql.NullString
		var nickname sql.NullString
		var firstName sql.NullString
		var lastName sql.NullString
		var groupID sql.NullInt64
		var groupName sql.NullString
		var groupAvatar sql.NullString

		err := rows.Scan(
			&notification.ID, &notification.UserID, &actorID, &notification.Type,
			&entityType, &entityID, &title, &notification.Message,
			&redirectURL, &redirectType, &notification.IsRead, &notification.CreatedAt, &notification.UpdatedAt,
			&firstName, &lastName, &avatar, &nickname,
			&groupID, &groupName, &groupAvatar,
		)
		if err != nil {
			return nil, err
		}

		if actorID.Valid {
			notification.ActorID = uint(actorID.Int64)
			actor.ID = uint(actorID.Int64)
		}
		if entityType.Valid {
			notification.EntityType = entityType.String
		}
		if entityID.Valid {
			notification.EntityID = uint(entityID.Int64)
		}
		if title.Valid {
			notification.Title = title.String
		}
		if redirectURL.Valid {
			notification.RedirectURL = redirectURL.String
		}
		if redirectType.Valid {
			notification.RedirectType = redirectType.String
		}

		if firstName.Valid {
			actor.FirstName = firstName.String
		} else {
			actor.FirstName = ""
		}
		if lastName.Valid {
			actor.LastName = lastName.String
		} else {
			actor.LastName = ""
		}
		if avatar.Valid {
			a := avatar.String
			actor.Avatar = &a
		} else {
			actor.Avatar = nil
		}
		if nickname.Valid {
			n := nickname.String
			actor.Nickname = &n
		} else {
			actor.Nickname = nil
		}

		notification.Actor = actor

		// Set group information if available
		if groupID.Valid && groupName.Valid {
			group.ID = uint(groupID.Int64)
			group.Title = groupName.String
			if groupAvatar.Valid && groupAvatar.String != "" {
				if strings.HasPrefix(groupAvatar.String, "http") {
					group.Avatar = &groupAvatar.String
				} else if strings.HasPrefix(groupAvatar.String, "/avatars/") {
					group.Avatar = &groupAvatar.String
				} else if strings.HasPrefix(groupAvatar.String, "image:") {
					group.Avatar = nil
				} else {
					avatarURL := fmt.Sprintf("http://localhost:8080/api/uploads/%s", groupAvatar.String)
					group.Avatar = &avatarURL
				}
			}
			notification.Group = &group
		}

		notification.Data = s.getNotificationData(notification.Type, notification.EntityType, notification.EntityID)

		notifications = append(notifications, notification)
	}

	return notifications, nil
}

func (s *NotificationService) GetUnreadCount(userID uint) (int, error) {
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = false`

	var count int
	err := s.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

func (s *NotificationService) MarkAsRead(userID uint, notificationIDs []uint) error {
	if len(notificationIDs) == 0 {
		return nil
	}

	placeholders := make([]string, len(notificationIDs))
	args := make([]interface{}, 0, len(notificationIDs)+2)

	for i, id := range notificationIDs {
		placeholders[i] = "?"
		args = append(args, id)
	}
	args = append(args, time.Now(), userID)

	query := fmt.Sprintf(`
		UPDATE notifications SET is_read = true, updated_at = ?
		WHERE id IN (%s) AND user_id = ?
	`, strings.Join(placeholders, ","))

	_, err := s.db.Exec(query, args...)
	return err
}

func (s *NotificationService) MarkAllAsRead(userID uint) error {
	query := `
		UPDATE notifications SET is_read = true, updated_at = ?
		WHERE user_id = ? AND is_read = false
	`

	_, err := s.db.Exec(query, time.Now(), userID)
	return err
}

func (s *NotificationService) DeleteNotification(notificationID, userID uint) error {
	query := `DELETE FROM notifications WHERE id = ? AND user_id = ?`
	_, err := s.db.Exec(query, notificationID, userID)
	return err
}

func (s *NotificationService) DeleteAllRead(userID uint) error {
	query := `DELETE FROM notifications WHERE user_id = ? AND is_read = true`
	_, err := s.db.Exec(query, userID)
	return err
}

func (s *NotificationService) NotifyFollowRequest(followerID, followingID uint) error {
	follower, err := s.getUserInfo(followerID)
	if err != nil {
		return err
	}

	// Check if the target user is private to determine the message
	var isPrivate bool
	err = s.db.QueryRow("SELECT is_private FROM users WHERE id = ?", followingID).Scan(&isPrivate)
	if err != nil {
		// Default to request message if we can't determine privacy
		isPrivate = true
	}

	var title, message string
	if isPrivate {
		title = "New Follow Request"
		message = follower.FirstName + " " + follower.LastName + " wants to follow you"
	} else {
		title = "New Follower"
		message = follower.FirstName + " " + follower.LastName + " started following you"
	}

	notification := &models.Notification{
		UserID:       followingID,
		ActorID:      followerID,
		Type:         models.NotificationFollowRequest,
		EntityType:   "user",
		EntityID:     followerID,
		Title:        title,
		Message:      message,
		RedirectURL:  "/discover/?tab=requests",
		RedirectType: "discover",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyFollowAccepted(followerID, followingID uint) error {
	following, err := s.getUserInfo(followingID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       followerID,
		ActorID:      followingID,
		Type:         models.NotificationFollowAccepted,
		EntityType:   "user",
		EntityID:     followingID,
		Title:        "Follow Request Accepted",
		Message:      following.FirstName + " " + following.LastName + " accepted your follow request",
		RedirectURL:  fmt.Sprintf("/profile/%d", followingID),
		RedirectType: "profile",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyGroupInvite(inviterID, invitedUserID, groupID uint) error {
	inviter, err := s.getUserInfo(inviterID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       invitedUserID,
		ActorID:      inviterID,
		Type:         models.NotificationGroupInvite,
		EntityType:   "group",
		EntityID:     groupID,
		Title:        "Group Invitation",
		Message:      inviter.FirstName + " " + inviter.LastName + " invited you to join \"" + group.Title + "\"",
		RedirectURL:  "/discover/?tab=requests",
		RedirectType: "discover",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyJoinRequest(requesterID, creatorID, groupID uint) error {
	requester, err := s.getUserInfo(requesterID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	// Get all admin IDs (creator + admin members)
	adminIDs, err := s.getGroupAdminIDs(groupID)
	if err != nil || len(adminIDs) == 0 {
		// Fallback to just notifying the creator if we can't get admin list
		adminIDs = []uint{creatorID}
	}

	// Send notification to all admins
	var lastError error
	for _, adminID := range adminIDs {
		notification := &models.Notification{
			UserID:       adminID,
			ActorID:      requesterID,
			Type:         models.NotificationJoinRequest,
			EntityType:   "group",
			EntityID:     groupID,
			Title:        "Join Request",
			Message:      requester.FirstName + " " + requester.LastName + " wants to join \"" + group.Title + "\"",
			RedirectURL:  "/discover/?tab=requests",
			RedirectType: "discover",
		}

		if err := s.CreateNotification(notification); err != nil {
			lastError = err
			continue
		}
	}

	return lastError
}

func (s *NotificationService) NotifyJoinAccepted(requesterID, creatorID, groupID uint) error {
	creator, err := s.getUserInfo(creatorID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       requesterID,
		ActorID:      creatorID,
		Type:         models.NotificationJoinAccepted,
		EntityType:   "group",
		EntityID:     groupID,
		Title:        "Join Request Accepted",
		Message:      creator.FirstName + " " + creator.LastName + " accepted your request to join \"" + group.Title + "\"",
		RedirectURL:  fmt.Sprintf("/chats/all?group=%d", groupID),
		RedirectType: "group",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyEventCreated(creatorID, groupID, eventID uint) error {
	creator, err := s.getUserInfo(creatorID)
	if err != nil {
		return err
	}

	event, err := s.getEventInfo(eventID)
	if err != nil {
		return err
	}

	memberIDs, err := s.GetGroupMemberIDs(groupID, creatorID)
	if err != nil {
		return err
	}

	var failedCount int
	for _, memberID := range memberIDs {
		notification := &models.Notification{
			UserID:       memberID,
			ActorID:      creatorID,
			Type:         models.NotificationEventCreated,
			EntityType:   "event",
			EntityID:     eventID,
			Title:        "New Event",
			Message:      creator.FirstName + " " + creator.LastName + " created event \"" + event.Title + "\"",
			RedirectURL:  fmt.Sprintf("/events/all?highlight=%d", eventID),
			RedirectType: "events",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue
		}
	}

	if failedCount > 0 {
		fmt.Printf("Warning: %d/%d event notifications failed to send\n", failedCount, len(memberIDs))
	}

	return nil
}

func (s *NotificationService) NotifyEventReminder(attendeeID, eventCreatorID, eventID uint) error {
	event, err := s.getEventInfo(eventID)
	if err != nil {
		return err
	}

	creator, err := s.getUserInfo(eventCreatorID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       attendeeID,
		ActorID:      eventCreatorID,
		Type:         models.NotificationEventReminder,
		EntityType:   "event",
		EntityID:     eventID,
		Title:        "Event Reminder",
		Message:      "Reminder: You have an upcoming event \"" + event.Title + "\" created by " + creator.FirstName + " " + creator.LastName,
		RedirectURL:  fmt.Sprintf("/events/all?highlight=%d", eventID),
		RedirectType: "events",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyNewMessage(senderID, receiverID uint, messageID uint, isGroup bool) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	var notificationType, title, message, redirectURL, redirectType string
	if isGroup {
		// For group messages, we need group info - this method signature needs to be updated
		// For now, use a generic approach
		notificationType = models.NotificationMessage
		title = "New Group Message"
		message = "New message from " + sender.FirstName + " " + sender.LastName
		redirectURL = "/chat" // Will be updated when group ID is available
		redirectType = "chat"
	} else {
		notificationType = models.NotificationMessage
		title = "New Message"
		message = "New message from " + sender.FirstName + " " + sender.LastName
		redirectURL = fmt.Sprintf("/chats/all?chat=%d", senderID)
		redirectType = "chat"
	}

	notification := &models.Notification{
		UserID:       receiverID,
		ActorID:      senderID,
		Type:         notificationType,
		EntityType:   "message",
		EntityID:     messageID,
		Title:        title,
		Message:      message,
		RedirectURL:  redirectURL,
		RedirectType: redirectType,
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) notifyGroupPostShare(sharerID, groupID, postID uint, sharer models.UserResponse) error {
	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	// Get all group members except the sharer
	members, err := s.getGroupMembers(groupID)
	if err != nil {
		return err
	}

	for _, member := range members {
		if member.ID == sharerID {
			continue // Don't notify the sharer
		}

		notification := &models.Notification{
			UserID:       member.ID,
			ActorID:      sharerID,
			Type:         models.NotificationPostShared,
			EntityType:   "post",
			EntityID:     postID,
			Title:        "Post Shared",
			Message:      sharer.FirstName + " " + sharer.LastName + " shared a post in " + group.Title,
			RedirectURL:  fmt.Sprintf("/chats/all?group=%d", groupID),
			RedirectType: "chat",
		}

		if err := s.CreateNotification(notification); err != nil {
			return err
		}
	}

	return nil
}

func (s *NotificationService) notifyPrivateImageShare(sharerID, receiverID, postID uint, sharer models.UserResponse) error {
	notification := &models.Notification{
		UserID:       receiverID,
		ActorID:      sharerID,
		Type:         models.NotificationImageShared,
		EntityType:   "post",
		EntityID:     postID,
		Title:        "Image Shared",
		Message:      sharer.FirstName + " " + sharer.LastName + " shared an image with you",
		RedirectURL:  fmt.Sprintf("/chats/all?chat=%d", sharerID),
		RedirectType: "chat",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) notifyGroupImageShare(sharerID, groupID, postID uint, sharer models.UserResponse) error {
	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	// Create a single notification for the group share (not individual per member)
	// The notification will be visible to all group members
	notification := &models.Notification{
		UserID:       0, // Will be set per member
		ActorID:      sharerID,
		Type:         models.NotificationImageShared,
		EntityType:   "group",
		EntityID:     groupID,
		Title:        "Image Shared",
		Message:      sharer.FirstName + " " + sharer.LastName + " shared an image in \"" + group.Title + "\"",
		RedirectURL:  fmt.Sprintf("/chats/all?group=%d", groupID),
		RedirectType: "group",
	}

	// Get all group members except the sharer and send individual notifications
	members, err := s.getGroupMembers(groupID)
	if err != nil {
		return err
	}

	for _, member := range members {
		if member.ID == sharerID {
			continue // Don't notify the sharer
		}

		// Create individual notification for each member
		memberNotification := *notification
		memberNotification.UserID = member.ID

		if err := s.CreateNotification(&memberNotification); err != nil {
			continue // Continue with other members even if one fails
		}
	}

	return nil
}

func (s *NotificationService) NotifyImageShared(sharerID, postID uint, isGroup bool, groupID uint, receiverID uint) error {
	// If postID is 0, it's an image message, not a post share, so skip ownership check
	if postID > 0 {
		// Get post owner to avoid notifying them
		var postOwnerID uint
		err := s.db.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&postOwnerID)
		if err != nil {
			return fmt.Errorf("failed to get post owner: %w", err)
		}

		// Never notify the post owner about shares of their own content
		if sharerID == postOwnerID {
			return nil
		}
	}

	sharer, err := s.getUserInfo(sharerID)
	if err != nil {
		return err
	}

	if isGroup {
		// Notify all group members except the sharer
		return s.notifyGroupImageShare(sharerID, groupID, postID, *sharer)
	} else {
		// Notify the private chat receiver
		return s.notifyPrivateImageShare(sharerID, receiverID, postID, *sharer)
	}
}

func (s *NotificationService) NotifyPostShared(sharerID, postID uint, isGroup bool, groupID uint, receiverID uint) error {
	// Get post owner to avoid notifying them
	var postOwnerID uint
	err := s.db.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&postOwnerID)
	if err != nil {
		return fmt.Errorf("failed to get post owner: %w", err)
	}

	// Never notify the post owner about shares of their own content
	if sharerID == postOwnerID {
		return nil
	}

	sharer, err := s.getUserInfo(sharerID)
	if err != nil {
		return err
	}

	if isGroup {
		// Notify all group members except the sharer
		return s.notifyGroupPostShare(sharerID, groupID, postID, *sharer)
	} else {
		// Notify the private chat receiver
		return s.notifyPrivatePostShare(sharerID, receiverID, postID, *sharer)
	}
}

func (s *NotificationService) NotifyPostLiked(likerID, postOwnerID, postID uint) error {
	if likerID == postOwnerID {
		return nil
	}

	fmt.Printf("DEBUG: NotifyPostLiked called - likerID: %d, postOwnerID: %d, postID: %d\n", likerID, postOwnerID, postID)

	// Verify this is actually a regular post (not a group post)
	// Note: We allow posts that exist in both tables to be treated as regular posts (prioritize regular posts)
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		fmt.Printf("DEBUG: Failed to check if post is regular post: %v\n", err)
		return err
	}
	if regularPostCount == 0 {
		fmt.Printf("DEBUG: ERROR - NotifyPostLiked called for a post that doesn't exist in posts table! This should not happen.\n")
		return fmt.Errorf("NotifyPostLiked called for a non-existent regular post")
	}

	liker, err := s.getUserInfo(likerID)
	if err != nil {
		fmt.Printf("DEBUG: Failed to get liker info: %v\n", err)
		return err
	}

	// This is a regular post
	message := liker.FirstName + " " + liker.LastName + " liked your post"
	redirectURL := fmt.Sprintf("/post/%d", postID)
	redirectType := "post"

	notification := &models.Notification{
		UserID:       postOwnerID,
		ActorID:      likerID,
		Type:         models.NotificationPostLiked,
		EntityType:   "post",
		EntityID:     postID,
		Title:        "Post Liked",
		Message:      message,
		RedirectURL:  redirectURL,
		RedirectType: redirectType,
	}

	err = s.CreateNotification(notification)
	if err != nil {
		fmt.Printf("DEBUG: Failed to create post liked notification: %v\n", err)
		return err
	}

	fmt.Printf("DEBUG: Post liked notification created successfully\n")
	return nil
}

func (s *NotificationService) NotifyGroupPostLiked(likerID, postOwnerID, postID, groupID uint) error {
	if likerID == postOwnerID {
		return nil
	}

	fmt.Printf("DEBUG: NotifyGroupPostLiked called - likerID: %d, postOwnerID: %d, postID: %d, groupID: %d\n", likerID, postOwnerID, postID, groupID)

	// Verify this is actually a group post
	var groupPostCount int
	var actualGroupID uint
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &actualGroupID)
	if err != nil {
		fmt.Printf("DEBUG: Failed to check if post is group post: %v\n", err)
		return err
	}
	if groupPostCount == 0 {
		fmt.Printf("DEBUG: ERROR - NotifyGroupPostLiked called for a post that doesn't exist in group_posts table! This should not happen.\n")
		return fmt.Errorf("NotifyGroupPostLiked called for a non-existent group post")
	}
	if actualGroupID == 0 {
		fmt.Printf("DEBUG: ERROR - NotifyGroupPostLiked called for a group post with invalid group_id! This should not happen.\n")
		return fmt.Errorf("NotifyGroupPostLiked called for a group post with invalid group_id")
	}
	if actualGroupID != groupID {
		fmt.Printf("DEBUG: WARNING - Group ID mismatch: expected %d, got %d. Using actual group ID.\n", groupID, actualGroupID)
		groupID = actualGroupID // Use the correct group ID
	}

	liker, err := s.getUserInfo(likerID)
	if err != nil {
		fmt.Printf("DEBUG: Failed to get liker info: %v\n", err)
		return err
	}

	// Get group name for the message
	group, err := s.getGroupInfo(groupID)
	var message string
	var redirectURL string
	var redirectType string

	if err != nil {
		fmt.Printf("DEBUG: Failed to get group info: %v\n", err)
		// Fallback to regular post message if group info can't be retrieved
		message = liker.FirstName + " " + liker.LastName + " liked your post"
		redirectURL = fmt.Sprintf("/post/%d", postID)
		redirectType = "post"
	} else {
		message = liker.FirstName + " " + liker.LastName + " liked your post in group \"" + group.Title + "\""
		redirectURL = fmt.Sprintf("/chats/all?group=%d", groupID)
		redirectType = "group"
	}

	notification := &models.Notification{
		UserID:       postOwnerID,
		ActorID:      likerID,
		Type:         models.NotificationPostLiked,
		EntityType:   "group_post",
		EntityID:     postID,
		Title:        "Post Liked",
		Message:      message,
		RedirectURL:  redirectURL,
		RedirectType: redirectType,
	}

	err = s.CreateNotification(notification)
	if err != nil {
		fmt.Printf("DEBUG: Failed to create group post liked notification: %v\n", err)
		return err
	}

	fmt.Printf("DEBUG: Group post liked notification created successfully\n")
	return nil
}

func (s *NotificationService) NotifyPostCommented(commenterID, postOwnerID, postID uint, commentID uint) error {
	if commenterID == postOwnerID {
		return nil
	}

	commenter, err := s.getUserInfo(commenterID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       postOwnerID,
		ActorID:      commenterID,
		Type:         models.NotificationPostCommented,
		EntityType:   "post",
		EntityID:     postID,
		Title:        "New Comment",
		Message:      commenter.FirstName + " " + commenter.LastName + " commented on your post",
		RedirectURL:  fmt.Sprintf("/post/%d#comment-%d", postID, commentID),
		RedirectType: "post",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyGroupPostCreated(posterID, groupID, postID uint) error {
	poster, err := s.getUserInfo(posterID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	memberIDs, err := s.GetGroupMemberIDs(groupID, posterID)
	if err != nil {
		return err
	}

	// Create notification for each group member
	var failedCount int
	for _, memberID := range memberIDs {
		notification := &models.Notification{
			UserID:       memberID,
			ActorID:      posterID,
			Type:         models.NotificationGroupPost,
			EntityType:   "group_post",
			EntityID:     postID,
			Title:        "New Group Post",
			Message:      poster.FirstName + " " + poster.LastName + " posted in \"" + group.Title + "\"",
			RedirectURL:  fmt.Sprintf("/chats/all?group=%d", groupID),
			RedirectType: "group",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue
		}
	}

	if failedCount > 0 {
		fmt.Printf("Warning: %d/%d group post notifications failed to send\n", failedCount, len(memberIDs))
	}

	return nil
}

func (s *NotificationService) NotifyNewPoll(creatorID, pollID uint) error {
	creator, err := s.getUserInfo(creatorID)
	if err != nil {
		return err
	}

	// Get followers of the creator
	followerIDs, err := s.getFollowerIDs(creatorID)
	if err != nil {
		return err
	}

	// Create notification for each follower
	for _, followerID := range followerIDs {
		notification := &models.Notification{
			UserID:       followerID,
			ActorID:      creatorID,
			Type:         models.NotificationNewPoll,
			EntityType:   "poll",
			EntityID:     pollID,
			Title:        "New Poll",
			Message:      creator.FirstName + " " + creator.LastName + " created a new poll",
			RedirectURL:  fmt.Sprintf("/poll/%d", pollID),
			RedirectType: "poll",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue
		}
	}

	return nil
}

func (s *NotificationService) NotifyGroupPollCreated(creatorID, groupID, pollID uint) error {
	fmt.Printf("DEBUG: NotifyGroupPollCreated called - creatorID: %d, groupID: %d, pollID: %d\n", creatorID, groupID, pollID)

	creator, err := s.getUserInfo(creatorID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	memberIDs, err := s.GetGroupMemberIDs(groupID, creatorID)
	if err != nil {
		return err
	}

	fmt.Printf("DEBUG: Found %d group members to notify\n", len(memberIDs))

	// Create notification for each group member
	for _, memberID := range memberIDs {
		notification := &models.Notification{
			UserID:       memberID,
			ActorID:      creatorID,
			Type:         models.NotificationNewPoll,
			EntityType:   "poll",
			EntityID:     pollID,
			Title:        "New Group Poll",
			Message:      creator.FirstName + " " + creator.LastName + " created a poll in \"" + group.Title + "\"",
			RedirectURL:  fmt.Sprintf("/chats/all?group=%d&tab=polls&highlight=%d", groupID, pollID),
			RedirectType: "group",
		}

		if err := s.CreateNotification(notification); err != nil {
			fmt.Printf("DEBUG: Failed to create notification for member %d: %v\n", memberID, err)
			continue
		}
		fmt.Printf("DEBUG: Created notification for member %d\n", memberID)
	}

	return nil
}

func (s *NotificationService) NotifyPollVoted(voterID, pollOwnerID, pollID uint) error {
	if voterID == pollOwnerID {
		return nil // Don't notify if user voted on their own poll
	}

	voter, err := s.getUserInfo(voterID)
	if err != nil {
		return err
	}

	// Get group ID for the poll
	var groupID uint
	err = s.db.QueryRow("SELECT group_id FROM polls WHERE id = ?", pollID).Scan(&groupID)
	if err != nil {
		return fmt.Errorf("failed to get poll group: %w", err)
	}

	notification := &models.Notification{
		UserID:       pollOwnerID,
		ActorID:      voterID,
		Type:         models.NotificationPollVoted,
		EntityType:   "poll",
		EntityID:     pollID,
		Title:        "Poll Vote",
		Message:      voter.FirstName + " " + voter.LastName + " voted on your poll",
		RedirectURL:  fmt.Sprintf("/chats/all?group=%d&tab=polls&highlight=%d", groupID, pollID),
		RedirectType: "group",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyEventResponse(responderID, eventCreatorID, eventID uint, responseType string) error {
	if responderID == eventCreatorID {
		return nil // Don't notify if creator responds to their own event
	}

	responder, err := s.getUserInfo(responderID)
	if err != nil {
		return err
	}

	event, err := s.getEventInfo(eventID)
	if err != nil {
		return err
	}

	var message string
	if responseType == "going" {
		message = responder.FirstName + " " + responder.LastName + " is going to your event \"" + event.Title + "\""
	} else {
		message = responder.FirstName + " " + responder.LastName + " is not going to your event \"" + event.Title + "\""
	}

	notification := &models.Notification{
		UserID:       eventCreatorID,
		ActorID:      responderID,
		Type:         models.NotificationEventResponse,
		EntityType:   "event",
		EntityID:     eventID,
		Title:        "Event Response",
		Message:      message,
		RedirectURL:  fmt.Sprintf("/events/all?highlight=%d", eventID),
		RedirectType: "events",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyGroupMessage(senderID, groupID, messageID uint) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	// Get all group members except sender
	memberIDs, err := s.GetGroupMemberIDs(groupID, senderID)
	if err != nil {
		return err
	}

	// Create notification for each group member
	for _, memberID := range memberIDs {
		notification := &models.Notification{
			UserID:       memberID,
			ActorID:      senderID,
			Type:         models.NotificationMessage,
			EntityType:   "group_message",
			EntityID:     messageID,
			Title:        "New Group Message",
			Message:      sender.FirstName + " " + sender.LastName + " sent a message in \"" + group.Title + "\"",
			RedirectURL:  fmt.Sprintf("/chats/all?group=%d", groupID),
			RedirectType: "chat",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue
		}
	}

	return nil
}

func (s *NotificationService) NotifyPrivateMessage(senderID, receiverID, messageID uint) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       receiverID,
		ActorID:      senderID,
		Type:         models.NotificationMessage,
		EntityType:   "private_message",
		EntityID:     messageID,
		Title:        "New Message",
		Message:      "New message from " + sender.FirstName + " " + sender.LastName,
		RedirectURL:  fmt.Sprintf("/chats/all?chat=%d", senderID),
		RedirectType: "chat",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) sendRealTimeNotification(notification *models.Notification) {
	if s.hub == nil {
		fmt.Printf("Hub is nil, cannot send real-time notification for notification ID %d\n", notification.ID)
		return
	}

	actor, err := s.getUserInfo(notification.ActorID)
	if err != nil {
		fmt.Printf("Failed to get actor info for notification %d: %v\n", notification.ID, err)
		return
	}

	// Get group information for group-related notifications
	var group *models.GroupResponse
	if s.isGroupRelatedNotification(notification.Type) {
		var groupID uint
		switch notification.Type {
		case models.NotificationGroupInvite, models.NotificationJoinRequest, models.NotificationJoinAccepted, models.NotificationGroupPost, models.NotificationEventCreated, models.NotificationNewPoll:
			groupID = notification.EntityID
		case models.NotificationMessage:
			if notification.EntityType == "group_message" {
				// For group messages, we need to get the group ID from the message
				// This is a simplified approach - in a real implementation, you'd store group ID in the notification or look it up
				// For now, we'll skip group info for messages to avoid complexity
			}
		case models.NotificationPostShared, models.NotificationImageShared:
			if notification.EntityType == "group" {
				groupID = notification.EntityID
			}
		}
		if groupID > 0 {
			group, _ = s.getGroupInfo(groupID)
		}
	}

	notificationResponse := models.NotificationResponse{
		ID:           notification.ID,
		UserID:       notification.UserID,
		ActorID:      notification.ActorID,
		Type:         notification.Type,
		EntityType:   notification.EntityType,
		EntityID:     notification.EntityID,
		Title:        notification.Title,
		Message:      notification.Message,
		IsRead:       notification.IsRead,
		RedirectURL:  notification.RedirectURL,
		RedirectType: notification.RedirectType,
		CreatedAt:    notification.CreatedAt,
		UpdatedAt:    notification.UpdatedAt,
		Actor:        *actor,
		Group:        group,
		Data:         s.getNotificationData(notification.Type, notification.EntityType, notification.EntityID),
	}

	wsMessage := websocket.Message{
		Type:      websocket.MessageTypeNotification,
		From:      notification.ActorID,
		To:        notification.UserID,
		Content:   notification.Message,
		Timestamp: notification.CreatedAt.Unix(),
		Data:      notificationResponse,
	}

	// Send to specific user, not broadcast to all
	s.hub.SendToUser(notification.UserID, wsMessage)
}

func (s *NotificationService) isGroupRelatedNotification(notificationType string) bool {
	groupTypes := []string{
		models.NotificationGroupInvite,
		models.NotificationJoinRequest,
		models.NotificationJoinAccepted,
		models.NotificationGroupPost,
		models.NotificationEventCreated,
		models.NotificationNewPoll,
	}

	for _, t := range groupTypes {
		if notificationType == t {
			return true
		}
	}

	// Also check for shared content in groups
	if notificationType == models.NotificationPostShared || notificationType == models.NotificationImageShared {
		return true
	}

	return false
}

func (s *NotificationService) getUserInfo(userID uint) (*models.UserResponse, error) {
	query := `SELECT first_name, last_name, avatar, nickname FROM users WHERE id = ?`

	var user models.UserResponse
	var avatar sql.NullString
	err := s.db.QueryRow(query, userID).Scan(&user.FirstName, &user.LastName, &avatar, &user.Nickname)
	if err != nil {
		return nil, err
	}

	user.ID = userID

	// Process avatar URL like in the User.ToResponse() method
	if avatar.Valid && avatar.String != "" {
		if strings.HasPrefix(avatar.String, "http") {
			user.Avatar = &avatar.String
		} else if strings.HasPrefix(avatar.String, "/avatars/") {
			user.Avatar = &avatar.String
		} else if strings.HasPrefix(avatar.String, "image:") {
			user.Avatar = nil
		} else {
			avatarURL := fmt.Sprintf("http://localhost:8080/api/uploads/%s", avatar.String)
			user.Avatar = &avatarURL
		}
	}

	return &user, nil
}

func (s *NotificationService) getGroupInfo(groupID uint) (*models.GroupResponse, error) {
	query := `SELECT name, description, avatar FROM groups WHERE id = ?`

	var group models.GroupResponse
	var avatar sql.NullString
	err := s.db.QueryRow(query, groupID).Scan(&group.Title, &group.Description, &avatar)
	if err != nil {
		return nil, err
	}

	group.ID = groupID
	if avatar.Valid && avatar.String != "" {
		if strings.HasPrefix(avatar.String, "http") {
			group.Avatar = &avatar.String
		} else if strings.HasPrefix(avatar.String, "/avatars/") {
			group.Avatar = &avatar.String
		} else if strings.HasPrefix(avatar.String, "image:") {
			group.Avatar = nil
		} else {
			avatarURL := fmt.Sprintf("http://localhost:8080/api/uploads/%s", avatar.String)
			group.Avatar = &avatarURL
		}
	}

	return &group, nil
}

func (s *NotificationService) getEventInfo(eventID uint) (*models.EventResponse, error) {
	query := `SELECT title, description FROM events WHERE id = ?`

	var event models.EventResponse
	err := s.db.QueryRow(query, eventID).Scan(&event.Title, &event.Description)
	if err != nil {
		return nil, err
	}

	event.ID = eventID
	return &event, nil
}

func (s *NotificationService) GetGroupMemberIDs(groupID, excludeUserID uint) ([]uint, error) {
	query := `
		SELECT user_id FROM group_members 
		WHERE group_id = ? AND user_id != ? AND status = 'member'
	`

	rows, err := s.db.Query(query, groupID, excludeUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var memberIDs []uint
	for rows.Next() {
		var memberID uint
		if err := rows.Scan(&memberID); err != nil {
			continue
		}
		memberIDs = append(memberIDs, memberID)
	}

	return memberIDs, nil
}

func (s *NotificationService) getFollowerIDs(userID uint) ([]uint, error) {
	query := `
		SELECT follower_id FROM follows 
		WHERE following_id = ? AND status = 'accepted'
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followerIDs []uint
	for rows.Next() {
		var followerID uint
		if err := rows.Scan(&followerID); err != nil {
			continue
		}
		followerIDs = append(followerIDs, followerID)
	}

	return followerIDs, nil
}

func (s *NotificationService) getGroupMembers(groupID uint) ([]models.UserResponse, error) {
	query := `
SELECT u.id, u.first_name, u.last_name, u.avatar, u.nickname, u.status
FROM group_members gm
JOIN users u ON gm.user_id = u.id
WHERE gm.group_id = ? AND gm.status = 'member'
ORDER BY gm.created_at ASC
	`

	rows, err := s.db.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []models.UserResponse
	for rows.Next() {
		var member models.UserResponse
		var avatar *string
		var nickname *string

		err := rows.Scan(
			&member.ID, &member.FirstName, &member.LastName, &avatar, &nickname, &member.Status,
		)
		if err != nil {
			return nil, err
		}

		member.Avatar = avatar
		member.Nickname = nickname
		members = append(members, member)
	}

	return members, nil
}

func (s *NotificationService) getGroupAdminIDs(groupID uint) ([]uint, error) {
	// Get the creator ID
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return nil, err
	}

	adminIDs := []uint{creatorID}

	// Get all admin members
	query := `
		SELECT user_id FROM group_members 
		WHERE group_id = ? AND role = 'admin' AND status = 'member' AND user_id != ?
	`
	rows, err := s.db.Query(query, groupID, creatorID)
	if err != nil {
		return adminIDs, nil // Return at least the creator
	}
	defer rows.Close()

	for rows.Next() {
		var adminID uint
		if err := rows.Scan(&adminID); err != nil {
			continue
		}
		adminIDs = append(adminIDs, adminID)
	}

	return adminIDs, nil
}

func (s *NotificationService) notifyPrivatePostShare(sharerID, receiverID, postID uint, sharer models.UserResponse) error {
	notification := &models.Notification{
		UserID:       receiverID,
		ActorID:      sharerID,
		Type:         models.NotificationPostShared,
		EntityType:   "post",
		EntityID:     postID,
		Title:        "Post Shared",
		Message:      sharer.FirstName + " " + sharer.LastName + " shared a post with you",
		RedirectURL:  fmt.Sprintf("/chats/all?chat=%d", sharerID),
		RedirectType: "chat",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) getNotificationData(notificationType, entityType string, entityID uint) interface{} {
	switch notificationType {
	case models.NotificationEventCreated:
		if event, err := s.getEventInfo(entityID); err == nil {
			return map[string]interface{}{
				"event_time": event.EventTime,
			}
		}
	}
	return nil
}

func (s *NotificationService) GetNotificationSettings(userID uint) (*models.NotificationSettings, error) {
	query := `
		SELECT id, user_id, sound_enabled, sound_theme, browser_push_enabled,
			   quiet_hours_enabled, quiet_hours_start, quiet_hours_end, muted_conversations,
			   created_at, updated_at
		FROM notification_settings WHERE user_id = ?
	`

	var settings models.NotificationSettings
	var mutedConversationsStr string
	err := s.db.QueryRow(query, userID).Scan(
		&settings.ID, &settings.UserID, &settings.SoundEnabled, &settings.SoundTheme,
		&settings.BrowserPushEnabled, &settings.QuietHoursEnabled, &settings.QuietHoursStart,
		&settings.QuietHoursEnd, &mutedConversationsStr, &settings.CreatedAt, &settings.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Parse muted conversations JSON
	if mutedConversationsStr != "" {
		err = json.Unmarshal([]byte(mutedConversationsStr), &settings.MutedConversations)
		if err != nil {
			// If JSON parsing fails, initialize as empty array
			settings.MutedConversations = []models.MutedConversation{}
		}
	} else {
		settings.MutedConversations = []models.MutedConversation{}
	}

	return &settings, nil
}

func (s *NotificationService) UpdateNotificationSettings(userID uint, req *models.NotificationSettingsRequest) (*models.NotificationSettings, error) {
	now := time.Now()

	// First, try to update existing settings
	query := `
		UPDATE notification_settings SET
			sound_enabled = ?, sound_theme = ?, browser_push_enabled = ?,
			quiet_hours_enabled = ?, quiet_hours_start = ?, quiet_hours_end = ?,
			muted_conversations = ?, updated_at = ?
		WHERE user_id = ?
	`

	// Convert muted conversations to JSON string
	mutedStr, err := json.Marshal(req.MutedConversations)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal muted conversations: %w", err)
	}

	result, err := s.db.Exec(query,
		req.SoundEnabled, req.SoundTheme, req.BrowserPushEnabled,
		req.QuietHoursEnabled, req.QuietHoursStart, req.QuietHoursEnd,
		string(mutedStr), now, userID,
	)

	if err != nil {
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}

	// If no rows were affected, insert new settings
	if rowsAffected == 0 {
		// Convert muted conversations to JSON string for insert
		mutedStr, err := json.Marshal(req.MutedConversations)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal muted conversations: %w", err)
		}

		insertQuery := `
			INSERT INTO notification_settings (
				user_id, sound_enabled, sound_theme, browser_push_enabled,
				quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
				muted_conversations, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		_, err = s.db.Exec(insertQuery,
			userID, req.SoundEnabled, req.SoundTheme, req.BrowserPushEnabled,
			req.QuietHoursEnabled, req.QuietHoursStart, req.QuietHoursEnd,
			string(mutedStr), now, now,
		)
		if err != nil {
			return nil, err
		}
	}

	// Return the updated settings
	return s.GetNotificationSettings(userID)
}
