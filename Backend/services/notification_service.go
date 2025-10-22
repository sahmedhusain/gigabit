package services

import (
	"database/sql"
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
	query := `
		INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, title, message, is_read, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, notification.UserID, notification.ActorID, notification.Type,
		notification.EntityType, notification.EntityID, notification.Title, notification.Message, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	notification.ID = uint(id)
	notification.IsRead = false
	notification.CreatedAt = now
	notification.UpdatedAt = now

	s.sendRealTimeNotification(notification)

	return nil
}

func (s *NotificationService) GetUserNotifications(userID uint, limit, offset int) ([]models.NotificationResponse, error) {
	query := `
SELECT n.id, n.user_id, n.actor_id, n.type, n.entity_type, n.entity_id,
   n.title, n.message, n.is_read, n.created_at, n.updated_at,
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
		var avatar sql.NullString
		var nickname sql.NullString
		var firstName sql.NullString
		var lastName sql.NullString

		err := rows.Scan(
			&notification.ID, &notification.UserID, &actorID, &notification.Type,
			&entityType, &entityID, &title, &notification.Message,
			&notification.IsRead, &notification.CreatedAt, &notification.UpdatedAt,
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

	notification := &models.Notification{
		UserID:     followingID,
		ActorID:    followerID,
		Type:       models.NotificationFollowRequest,
		EntityType: "user",
		EntityID:   followerID,
		Title:      "New Follow Request",
		Message:    follower.FirstName + " " + follower.LastName + " wants to follow you",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyFollowAccepted(followerID, followingID uint) error {
	following, err := s.getUserInfo(followingID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:     followerID,
		ActorID:    followingID,
		Type:       models.NotificationFollowAccepted,
		EntityType: "user",
		EntityID:   followingID,
		Title:      "Follow Request Accepted",
		Message:    following.FirstName + " " + following.LastName + " accepted your follow request",
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
		UserID:     invitedUserID,
		ActorID:    inviterID,
		Type:       models.NotificationGroupInvite,
		EntityType: "group",
		EntityID:   groupID,
		Title:      "Group Invitation",
		Message:    inviter.FirstName + " " + inviter.LastName + " invited you to join \"" + group.Title + "\"",
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
		UserID:     creatorID,
		ActorID:    requesterID,
		Type:       models.NotificationJoinRequest,
		EntityType: "group",
		EntityID:   groupID,
		Title:      "Join Request",
		Message:    requester.FirstName + " " + requester.LastName + " wants to join \"" + group.Title + "\"",
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

	memberIDs, err := s.getGroupMemberIDs(groupID, creatorID)
	if err != nil {
		return err
	}

	for _, memberID := range memberIDs {
		notification := &models.Notification{
			UserID:     memberID,
			ActorID:    creatorID,
			Type:       models.NotificationEventCreated,
			EntityType: "event",
			EntityID:   eventID,
			Title:      "New Event",
			Message:    creator.FirstName + " " + creator.LastName + " created event \"" + event.Title + "\"",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue
		}
	}

	return nil
}

func (s *NotificationService) NotifyNewMessage(senderID, receiverID uint, messageID uint) error {
	sender, err := s.getUserInfo(senderID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:     receiverID,
		ActorID:    senderID,
		Type:       models.NotificationNewMessage,
		EntityType: "message",
		EntityID:   messageID,
		Title:      "New Message",
		Message:    "New message from " + sender.FirstName + " " + sender.LastName,
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) NotifyPostLiked(likerID, postOwnerID, postID uint) error {
	if likerID == postOwnerID {
		return nil
	}

	liker, err := s.getUserInfo(likerID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:     postOwnerID,
		ActorID:    likerID,
		Type:       models.NotificationPostLiked,
		EntityType: "post",
		EntityID:   postID,
		Title:      "Post Liked",
		Message:    liker.FirstName + " " + liker.LastName + " liked your post",
	}

	return s.CreateNotification(notification)
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
		UserID:     postOwnerID,
		ActorID:    commenterID,
		Type:       models.NotificationPostCommented,
		EntityType: "post",
		EntityID:   postID,
		Title:      "New Comment",
		Message:    commenter.FirstName + " " + commenter.LastName + " commented on your post",
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

	memberIDs, err := s.getGroupMemberIDs(groupID, posterID)
	if err != nil {
		return err
	}

	for _, memberID := range memberIDs {
		notification := &models.Notification{
			UserID:     memberID,
			ActorID:    posterID,
			Type:       models.NotificationGroupPost,
			EntityType: "group_post",
			EntityID:   postID,
			Title:      "New Group Post",
			Message:    poster.FirstName + " " + poster.LastName + " posted in \"" + group.Title + "\"",
		}

		if err := s.CreateNotification(notification); err != nil {
			continue
		}
	}

	return nil
}

func (s *NotificationService) NotifyGroupPostLiked(likerID, postOwnerID, groupID, postID uint) error {
	if likerID == postOwnerID {
		return nil
	}

	liker, err := s.getUserInfo(likerID)
	if err != nil {
		return err
	}

	group, err := s.getGroupInfo(groupID)
	if err != nil {
		return err
	}

	notification := &models.Notification{
		UserID:     postOwnerID,
		ActorID:    likerID,
		Type:       models.NotificationGroupPostLiked,
		EntityType: "group_post",
		EntityID:   postID,
		Title:      "Post Liked",
		Message:    liker.FirstName + " " + liker.LastName + " liked your post in \"" + group.Title + "\"",
	}

	return s.CreateNotification(notification)
}

func (s *NotificationService) sendRealTimeNotification(notification *models.Notification) {
	if s.hub == nil {
		return
	}

	actor, err := s.getUserInfo(notification.ActorID)
	if err != nil {
	}

	notificationResponse := models.NotificationResponse{
		ID:         notification.ID,
		UserID:     notification.UserID,
		ActorID:    notification.ActorID,
		Type:       notification.Type,
		EntityType: notification.EntityType,
		EntityID:   notification.EntityID,
		Title:      notification.Title,
		Message:    notification.Message,
		IsRead:     notification.IsRead,
		CreatedAt:  notification.CreatedAt,
		UpdatedAt:  notification.UpdatedAt,
		Actor:      *actor,
		Data:       s.getNotificationData(notification.Type, notification.EntityType, notification.EntityID),
	}

	wsMessage := websocket.Message{
		Type:      websocket.MessageTypeNotification,
		From:      notification.ActorID,
		To:        notification.UserID,
		Content:   notification.Message,
		Timestamp: notification.CreatedAt.Unix(),
		Data:      notificationResponse,
	}

	s.hub.BroadcastMessage(wsMessage)
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
	query := `SELECT title, description FROM groups WHERE id = ?`

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

func (s *NotificationService) getGroupMemberIDs(groupID, excludeUserID uint) ([]uint, error) {
	query := `
		SELECT user_id FROM group_members 
		WHERE group_id = ? AND user_id != ? AND status = 'accepted'
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
