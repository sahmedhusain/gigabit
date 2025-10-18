package services

import (
	"database/sql"
	"fmt"
	"log"
	"social/models"
	"social/websocket"
	"strings"
	"time"
)

type EventService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewEventService(db *sql.DB, hub *websocket.Hub) *EventService {
	return &EventService{
		db:  db,
		hub: hub,
	}
}

func (s *EventService) CreateEvent(event *models.Event) error {
	query := `
INSERT INTO events (group_id, creator_id, title, description, event_date, location, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`

	now := time.Now()
	result, err := s.db.Exec(query, event.GroupID, event.CreatorID, event.Title,
		event.Description, event.EventTime, event.Location, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	event.ID = uint(id)
	event.CreatedAt = now
	event.UpdatedAt = now

	// Broadcast event creation to group members
	if s.hub != nil {
		// Get the complete event data for broadcasting
		eventResponse, err := s.GetEventByID(event.ID, event.CreatorID)
		if err == nil {
			s.hub.BroadcastEventUpdate(event.ID, event.GroupID, event.CreatorID, "created", map[string]interface{}{
				"event": eventResponse,
			})
		}
	}

	return nil
}

func (s *EventService) GetEventByID(eventID, currentUserID uint) (*models.EventResponse, error) {
	query := `
SELECT e.id, e.group_id, e.creator_id, e.title, e.description, e.event_date, e.location,
   e.canceled, e.cancel_reason, e.created_at, e.updated_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   g.name as group_title
FROM events e
JOIN users u ON e.creator_id = u.id
JOIN groups g ON e.group_id = g.id
WHERE e.id = ?
`

	var event models.EventResponse
	var creator models.UserResponse
	var group models.GroupEventResponse
	var avatar sql.NullString
	var nickname sql.NullString

	err := s.db.QueryRow(query, eventID).Scan(
		&event.ID, &event.GroupID, &event.CreatorID, &event.Title, &event.Description,
		&event.EventTime, &event.Location, &event.Canceled, &event.CancelReason,
		&event.CreatedAt, &event.UpdatedAt,
		&creator.FirstName, &creator.LastName, &avatar, &nickname,
		&group.Title,
	)
	if err != nil {
		return nil, err
	}

	creator.ID = event.CreatorID
	if avatar.Valid {
		v := avatar.String
		creator.Avatar = &v
	}
	if nickname.Valid {
		v := nickname.String
		creator.Nickname = &v
	}
	group.ID = event.GroupID
	event.Creator = creator
	event.Group = group

	// Get response counts
	event.GoingCount, event.NotGoingCount, err = s.getEventResponseCounts(eventID)
	if err != nil {
		return nil, err
	}

	// Get current user's response
	event.UserResponse, err = s.GetUserEventResponse(eventID, currentUserID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	return &event, nil
}

func (s *EventService) GetGroupEvents(groupID, currentUserID uint, limit, offset int) ([]models.EventResponse, error) {
	// First check if user is a group member
	isMember, err := s.isUserGroupMember(groupID, currentUserID)
	if err != nil || !isMember {
		return nil, sql.ErrNoRows
	}

	query := `
SELECT e.id, e.group_id, e.creator_id, e.title, e.description, e.event_date, e.location,
   e.canceled, e.cancel_reason, e.created_at, e.updated_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   g.name as group_title
FROM events e
JOIN users u ON e.creator_id = u.id
JOIN groups g ON e.group_id = g.id
WHERE e.group_id = ?
ORDER BY e.event_date ASC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.EventResponse
	for rows.Next() {
		var event models.EventResponse
		var creator models.UserResponse
		var group models.GroupEventResponse
		var avatar sql.NullString
		var nickname sql.NullString

		err := rows.Scan(
			&event.ID, &event.GroupID, &event.CreatorID, &event.Title, &event.Description,
			&event.EventTime, &event.Location, &event.Canceled, &event.CancelReason,
			&event.CreatedAt, &event.UpdatedAt,
			&creator.FirstName, &creator.LastName, &avatar, &nickname,
			&group.Title,
		)
		if err != nil {
			return nil, err
		}

		creator.ID = event.CreatorID
		if avatar.Valid {
			v := avatar.String
			creator.Avatar = &v
		}
		if nickname.Valid {
			v := nickname.String
			creator.Nickname = &v
		}
		group.ID = event.GroupID
		event.Creator = creator
		event.Group = group

		// Get response counts
		event.GoingCount, event.NotGoingCount, err = s.getEventResponseCounts(event.ID)
		if err != nil {
			return nil, err
		}

		// Get current user's response
		event.UserResponse, err = s.GetUserEventResponse(event.ID, currentUserID)
		if err != nil && err != sql.ErrNoRows {
			return nil, err
		}

		events = append(events, event)
	}

	return events, nil
}

func (s *EventService) CancelEvent(eventID, userID uint, cancelReason string) error {
	// Check if user is the creator or group admin
	var creatorID uint
	var groupID uint
	err := s.db.QueryRow("SELECT creator_id, group_id FROM events WHERE id = ?", eventID).Scan(&creatorID, &groupID)
	if err != nil {
		return err
	}

	// Check if user is creator or admin
	if creatorID != userID {
		// Check if user is admin of the group
		isAdmin, err := s.isUserGroupAdmin(groupID, userID)
		if err != nil || !isAdmin {
			return sql.ErrNoRows // Unauthorized
		}
	}

	query := `
		UPDATE events SET canceled = ?, cancel_reason = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err = s.db.Exec(query, true, cancelReason, now, eventID)
	if err != nil {
		return err
	}

	// Broadcast event cancellation to group members
	if s.hub != nil {
		eventData := map[string]interface{}{
			"canceled":      true,
			"cancel_reason": cancelReason,
			"updated_at":    now.Format(time.RFC3339),
		}
		s.hub.BroadcastEventUpdate(eventID, groupID, userID, "cancelled", eventData)
	}

	return nil
}

func (s *EventService) UpdateEvent(eventID, userID uint, req *models.UpdateEventRequest) error {
	// Check if user is the creator or group admin
	var creatorID uint
	var groupID uint
	err := s.db.QueryRow("SELECT creator_id, group_id FROM events WHERE id = ?", eventID).Scan(&creatorID, &groupID)
	if err != nil {
		return err
	}

	// Check if user is creator or admin
	if creatorID != userID {
		// Check if user is admin of the group
		isAdmin, err := s.isUserGroupAdmin(groupID, userID)
		if err != nil || !isAdmin {
			return sql.ErrNoRows // Unauthorized
		}
	}

	// Check if event is canceled
	var canceled bool
	err = s.db.QueryRow("SELECT canceled FROM events WHERE id = ?", eventID).Scan(&canceled)
	if err != nil {
		return err
	}
	if canceled {
		return sql.ErrNoRows // Cannot update canceled events
	}

	// Build dynamic update query based on provided fields
	setParts := []string{}
	args := []interface{}{}

	if req.Title != "" {
		setParts = append(setParts, "title = ?")
		args = append(args, req.Title)
	}

	if req.Description != "" {
		setParts = append(setParts, "description = ?")
		args = append(args, req.Description)
	}

	if !req.EventTime.IsZero() {
		setParts = append(setParts, "event_date = ?")
		args = append(args, req.EventTime)
	}

	// Always update location since it's always provided by frontend (including empty to clear)
	setParts = append(setParts, "location = ?")
	args = append(args, req.Location)

	if len(setParts) == 0 {
		return nil // Nothing to update
	}

	// Always update the updated_at timestamp
	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now())

	// Add event ID at the end
	args = append(args, eventID)

	query := fmt.Sprintf("UPDATE events SET %s WHERE id = ?", strings.Join(setParts, ", "))

	_, err = s.db.Exec(query, args...)
	if err != nil {
		return err
	}

	// Broadcast event update to group members
	if s.hub != nil {
		// Prepare update data for broadcasting
		updateData := make(map[string]interface{})
		if req.Title != "" {
			updateData["title"] = req.Title
		}
		if req.Description != "" {
			updateData["description"] = req.Description
		}
		if !req.EventTime.IsZero() {
			updateData["event_time"] = req.EventTime.Format(time.RFC3339)
		}
		// Always include location since it's always updated
		updateData["location"] = req.Location
		updateData["updated_at"] = time.Now().Format(time.RFC3339)

		s.hub.BroadcastEventUpdate(eventID, groupID, userID, "updated", updateData)
	}

	return nil
}

func (s *EventService) DeleteEvent(eventID, userID uint) error {
	// Check if user is the creator or group admin
	var creatorID uint
	var groupID uint
	err := s.db.QueryRow("SELECT creator_id, group_id FROM events WHERE id = ?", eventID).Scan(&creatorID, &groupID)
	if err != nil {
		return err
	}

	// Check if user is creator or admin
	if creatorID != userID {
		// Check if user is admin of the group
		isAdmin, err := s.isUserGroupAdmin(groupID, userID)
		if err != nil || !isAdmin {
			return sql.ErrNoRows // Unauthorized
		}
	}

	// Delete related data first (event responses)
	_, err = s.db.Exec("DELETE FROM event_responses WHERE event_id = ?", eventID)
	if err != nil {
		return err
	}

	// Delete the event
	_, err = s.db.Exec("DELETE FROM events WHERE id = ?", eventID)
	if err != nil {
		return err
	}

	// Broadcast event deletion to group members
	if s.hub != nil {
		s.hub.BroadcastEventUpdate(eventID, groupID, userID, "deleted", nil)
	}

	return nil
}

func (s *EventService) RespondToEvent(eventID, userID uint, option string) error {
	// Check if the event is canceled
	var canceled bool
	err := s.db.QueryRow("SELECT canceled FROM events WHERE id = ?", eventID).Scan(&canceled)
	if err != nil {
		return err
	}
	if canceled {
		return sql.ErrNoRows // Cannot respond to canceled events
	}

	// Check if user is a member of the group that owns this event
	groupID, err := s.getEventGroupID(eventID)
	if err != nil {
		return err
	}

	isMember, err := s.isUserGroupMember(groupID, userID)
	if err != nil || !isMember {
		return sql.ErrNoRows // Unauthorized
	}

	// Check if user already responded
	existingResponse, err := s.GetUserEventResponse(eventID, userID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	// If clicking the same option again, remove the response
	if existingResponse == option {
		return s.RemoveEventResponse(eventID, userID)
	}

	now := time.Now()

	if existingResponse != "none" {
		// Update existing response
		query := `
			UPDATE event_responses SET response = ?, updated_at = ?
			WHERE event_id = ? AND user_id = ?
		`
		_, err = s.db.Exec(query, option, now, eventID, userID)
	} else {
		// Create new response
		query := `
			INSERT INTO event_responses (event_id, user_id, response, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
		`
		_, err = s.db.Exec(query, eventID, userID, option, now, now)
	}

	if err != nil {
		return err
	}

	// Broadcast event response update to group members
	if s.hub != nil {
		responseData := map[string]interface{}{
			"user_id":  userID,
			"response": option,
		}
		s.hub.BroadcastEventUpdate(eventID, groupID, userID, "rsvp_updated", responseData)
	}

	return nil
}

func (s *EventService) RemoveEventResponse(eventID, userID uint) error {
	// Check if user is a member of the group that owns this event
	groupID, err := s.getEventGroupID(eventID)
	if err != nil {
		return err
	}

	isMember, err := s.isUserGroupMember(groupID, userID)
	if err != nil || !isMember {
		return sql.ErrNoRows // Unauthorized
	}

	query := `DELETE FROM event_responses WHERE event_id = ? AND user_id = ?`
	_, err = s.db.Exec(query, eventID, userID)
	if err != nil {
		return err
	}

	// Broadcast event response removal to group members
	if s.hub != nil {
		responseData := map[string]interface{}{
			"user_id":  userID,
			"response": "none", // Indicate response was removed
		}
		s.hub.BroadcastEventUpdate(eventID, groupID, userID, "rsvp_updated", responseData)
	}

	return nil
}

func (s *EventService) GetEventResponses(eventID, currentUserID uint) ([]models.EventResponseDetail, error) {
	// Check if user is a member of the group that owns this event
	groupID, err := s.getEventGroupID(eventID)
	if err != nil {
		return nil, err
	}

	isMember, err := s.isUserGroupMember(groupID, currentUserID)
	if err != nil || !isMember {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT er.id, er.event_id, er.user_id, er.response, er.created_at,
			   u.first_name, u.last_name, u.avatar, u.nickname
		FROM event_responses er
		JOIN users u ON er.user_id = u.id
		WHERE er.event_id = ?
		ORDER BY er.created_at DESC
	`

	rows, err := s.db.Query(query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var responses []models.EventResponseDetail
	for rows.Next() {
		var response models.EventResponseDetail
		var user models.UserResponse

		err := rows.Scan(
			&response.ID, &response.EventID, &user.ID, &response.Option, &response.CreatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		response.User = user
		responses = append(responses, response)
	}

	return responses, nil
}

func (s *EventService) GetUserEvents(userID uint, limit, offset int) ([]models.EventResponse, error) {
	// Get events from groups the user is a member of
	query := `
SELECT DISTINCT e.id, e.group_id, e.creator_id, e.title, e.description, e.event_date, e.location,
   e.canceled, e.cancel_reason, e.created_at, e.updated_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   g.name as group_title
FROM events e
JOIN users u ON e.creator_id = u.id
JOIN groups g ON e.group_id = g.id
JOIN group_members gm ON e.group_id = gm.group_id AND gm.user_id = ? AND gm.status IN ('accepted', 'member')
ORDER BY e.event_date ASC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, userID, limit, offset)
	if err != nil {
		log.Printf("Error executing GetUserEvents query: %v", err)
		return nil, err
	}
	defer rows.Close()

	var events []models.EventResponse
	for rows.Next() {
		var event models.EventResponse
		var creator models.UserResponse
		var group models.GroupEventResponse
		var avatar sql.NullString
		var nickname sql.NullString

		err := rows.Scan(
			&event.ID, &event.GroupID, &event.CreatorID, &event.Title, &event.Description,
			&event.EventTime, &event.Location, &event.Canceled, &event.CancelReason,
			&event.CreatedAt, &event.UpdatedAt,
			&creator.FirstName, &creator.LastName, &avatar, &nickname,
			&group.Title,
		)
		if err != nil {
			log.Printf("Error scanning event row: %v", err)
			return nil, err
		}

		creator.ID = event.CreatorID
		if avatar.Valid {
			v := avatar.String
			creator.Avatar = &v
		}
		if nickname.Valid {
			v := nickname.String
			creator.Nickname = &v
		}
		group.ID = event.GroupID
		event.Creator = creator
		event.Group = group

		// Get response counts
		event.GoingCount, event.NotGoingCount, err = s.getEventResponseCounts(event.ID)
		if err != nil {
			log.Printf("Error getting event response counts for event %d: %v", event.ID, err)
			return nil, err
		}

		// Get current user's response
		event.UserResponse, err = s.GetUserEventResponse(event.ID, userID)
		if err != nil && err != sql.ErrNoRows {
			log.Printf("Error getting user event response for event %d, user %d: %v", event.ID, userID, err)
			return nil, err
		}

		events = append(events, event)
	}

	return events, nil
}

// Helper functions

func (s *EventService) getEventResponseCounts(eventID uint) (going, notGoing int, err error) {
	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN response = 'going' THEN 1 ELSE 0 END), 0) as going_count,
			COALESCE(SUM(CASE WHEN response = 'not_going' THEN 1 ELSE 0 END), 0) as not_going_count
		FROM event_responses 
		WHERE event_id = ?
	`

	err = s.db.QueryRow(query, eventID).Scan(&going, &notGoing)
	return
}

func (s *EventService) GetUserEventResponse(eventID, userID uint) (string, error) {
	query := `SELECT response FROM event_responses WHERE event_id = ? AND user_id = ?`

	var option string
	err := s.db.QueryRow(query, eventID, userID).Scan(&option)
	if err == sql.ErrNoRows {
		return "none", nil
	}
	if err != nil {
		return "", err
	}

	return option, nil
}

func (s *EventService) isUserGroupMember(groupID, userID uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM group_members 
		WHERE group_id = ? AND user_id = ? AND status IN ('member','accepted')
	`

	var count int
	err := s.db.QueryRow(query, groupID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *EventService) isUserGroupAdmin(groupID, userID uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM group_members 
		WHERE group_id = ? AND user_id = ? AND role = 'admin'
	`

	var count int
	err := s.db.QueryRow(query, groupID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *EventService) getEventGroupID(eventID uint) (uint, error) {
	query := `SELECT group_id FROM events WHERE id = ?`

	var groupID uint
	err := s.db.QueryRow(query, eventID).Scan(&groupID)
	return groupID, err
}
