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
   u.first_name, u.last_name, u.avatar, u.nickname
FROM notifications n
LEFT JOIN users u ON n.actor_id = u.id
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

		err := rows.Scan(
			&notification.ID, &notification.UserID, &actorID, &notification.Type,
			&entityType, &entityID, &title, &notification.Message,
			&redirectURL, &redirectType, &notification.IsRead, &notification.CreatedAt, &notification.UpdatedAt,
			&firstName, &lastName, &avatar, &nickname,
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
		RedirectURL:  "/discover/requests",
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
		RedirectURL:  fmt.Sprintf("/groups/%d", groupID),
		RedirectType: "group",
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

	notification := &models.Notification{
		UserID:       creatorID,
		ActorID:      requesterID,
		Type:         models.NotificationJoinRequest,
		EntityType:   "group",
		EntityID:     groupID,
		Title:        "Join Request",
		Message:      requester.FirstName + " " + requester.LastName + " wants to join \"" + group.Title + "\"",
		RedirectURL:  fmt.Sprintf("/groups/%d/requests", groupID),
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
			RedirectURL:  fmt.Sprintf("/events/%d", eventID),
			RedirectType: "event",
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

func (s *NotificationService) NotifyNewMessage(senderID, receiverID uint, messageID uint, isGroup bool) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	var notificationType, title, message, redirectURL, redirectType string
	if isGroup {
		// For group messages, we need group info - this method signature needs to be updated
		// For now, use a generic approach
		notificationType = models.NotificationGroupMessage
		title = "New Group Message"
		message = "New message from " + sender.FirstName + " " + sender.LastName
		redirectURL = "/chat" // Will be updated when group ID is available
		redirectType = "chat"
	} else {
		notificationType = models.NotificationPrivateMessage
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

func (s *NotificationService) NotifyImageShared(senderID, receiverID uint, messageID uint) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       receiverID,
		ActorID:      senderID,
		Type:         models.NotificationImageShared,
		EntityType:   "message",
		EntityID:     messageID,
		Title:        "Image Shared",
		Message:      sender.FirstName + " " + sender.LastName + " shared an image with you",
		RedirectURL:  fmt.Sprintf("/chats/all?chat=%d", senderID),
		RedirectType: "chat",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyPostShared(senderID, receiverID uint, messageID uint) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       receiverID,
		ActorID:      senderID,
		Type:         models.NotificationPostShared,
		EntityType:   "message",
		EntityID:     messageID,
		Title:        "Post Shared",
		Message:      sender.FirstName + " " + sender.LastName + " shared a post with you",
		RedirectURL:  fmt.Sprintf("/chats/all?chat=%d", senderID),
		RedirectType: "chat",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyPostLiked(likerID, postOwnerID, postID uint) error {
	if likerID == postOwnerID {
		return nil
	}

	fmt.Printf("DEBUG: NotifyPostLiked called - likerID: %d, postOwnerID: %d, postID: %d\n", likerID, postOwnerID, postID)

	liker, err := s.getUserInfo(likerID)
	if err != nil {
		fmt.Printf("DEBUG: Failed to get liker info: %v\n", err)
		return err
	}

	notification := &models.Notification{
		UserID:       postOwnerID,
		ActorID:      likerID,
		Type:         models.NotificationPostLiked,
		EntityType:   "post",
		EntityID:     postID,
		Title:        "Post Liked",
		Message:      liker.FirstName + " " + liker.LastName + " liked your post",
		RedirectURL:  fmt.Sprintf("/post/%d", postID),
		RedirectType: "post",
	}

	err = s.CreateNotification(notification)
	if err != nil {
		fmt.Printf("DEBUG: Failed to create post liked notification: %v\n", err)
		return err
	}

	fmt.Printf("DEBUG: Post liked notification created successfully\n")
	return nil
}

func (s *NotificationService) NotifyPostCommented(commenterID, postOwnerID, postID uint) error {
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
		RedirectURL:  fmt.Sprintf("/post/%d", postID),
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
			RedirectURL:  fmt.Sprintf("/groups/%d", groupID),
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

func (s *NotificationService) NotifyNewPost(posterID, postID uint) error {
	poster, err := s.getUserInfo(posterID)
	if err != nil {
		return err
	}

	// Get followers of the poster
	followerIDs, err := s.getFollowerIDs(posterID)
	if err != nil {
		return err
	}

	// Create notification for each follower
	for _, followerID := range followerIDs {
		notification := &models.Notification{
			UserID:       followerID,
			ActorID:      posterID,
			Type:         models.NotificationNewPost,
			EntityType:   "post",
			EntityID:     postID,
			Title:        "New Post",
			Message:      poster.FirstName + " " + poster.LastName + " shared a new post",
			RedirectURL:  fmt.Sprintf("/post/%d", postID),
			RedirectType: "post",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue // Continue with other followers even if one fails
		}
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
			RedirectURL:  fmt.Sprintf("/groups/%d", groupID),
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

	notification := &models.Notification{
		UserID:       pollOwnerID,
		ActorID:      voterID,
		Type:         models.NotificationPollVoted,
		EntityType:   "poll",
		EntityID:     pollID,
		Title:        "Poll Vote",
		Message:      voter.FirstName + " " + voter.LastName + " voted on your poll",
		RedirectURL:  fmt.Sprintf("/poll/%d", pollID),
		RedirectType: "poll",
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
		RedirectURL:  fmt.Sprintf("/events/%d", eventID),
		RedirectType: "event",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyCommentReplied(replierID, originalCommenterID, postID, commentID uint) error {
	if replierID == originalCommenterID {
		return nil // Don't notify if replying to own comment
	}

	replier, err := s.getUserInfo(replierID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:       originalCommenterID,
		ActorID:      replierID,
		Type:         models.NotificationCommentReplied,
		EntityType:   "comment",
		EntityID:     commentID,
		Title:        "Comment Reply",
		Message:      replier.FirstName + " " + replier.LastName + " replied to your comment",
		RedirectURL:  fmt.Sprintf("/post/%d#comment-%d", postID, commentID),
		RedirectType: "post",
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
			Type:         models.NotificationGroupMessage,
			EntityType:   "message",
			EntityID:     messageID,
			Title:        "New Group Message",
			Message:      sender.FirstName + " " + sender.LastName + " sent a message in \"" + group.Title + "\"",
			RedirectURL:  fmt.Sprintf("/chats/all?chat=%d", senderID),
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
		Type:         models.NotificationPrivateMessage,
		EntityType:   "message",
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

func (s *NotificationService) getUserInfo(userID uint) (*models.UserResponse, error) {
	query := `SELECT first_name, last_name, avatar, nickname FROM users WHERE id = ?`

	var user models.UserResponse
	err := s.db.QueryRow(query, userID).Scan(&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname)
	if err != nil {
		return nil, err
	}

	user.ID = userID
	return &user, nil
}

func (s *NotificationService) getGroupInfo(groupID uint) (*models.GroupResponse, error) {
	query := `SELECT name, description FROM groups WHERE id = ?`

	var group models.GroupResponse
	err := s.db.QueryRow(query, groupID).Scan(&group.Title, &group.Description)
	if err != nil {
		return nil, err
	}

	group.ID = groupID
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
