package services

import (
	"database/sql"
	"log"
	"social/models"
	"time"
)

type EventService struct {
	db *sql.DB
}

func (s *EventService) DeleteEventResponse(u uint, userID uint) any {
	panic("unimplemented")
}

func NewEventService(db *sql.DB) *EventService {
	return &EventService{db: db}
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

	return nil
}

func (s *EventService) GetEventByID(eventID, currentUserID uint) (*models.EventResponse, error) {
	query := `
SELECT e.id, e.group_id, e.creator_id, e.title, e.description, e.event_date, e.location,
   e.created_at, e.updated_at,
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
		&event.EventTime, &event.Location, &event.CreatedAt, &event.UpdatedAt,
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
   e.created_at, e.updated_at,
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
			&event.EventTime, &event.Location, &event.CreatedAt, &event.UpdatedAt,
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

func (s *EventService) UpdateEvent(eventID, userID uint, updateReq *models.UpdateEventRequest) error {
	// Check if user is the creator
	var creatorID uint
	var groupID uint
	err := s.db.QueryRow("SELECT creator_id, group_id FROM events WHERE id = ?", eventID).Scan(&creatorID, &groupID)
	if err != nil {
		return err
	}

	if creatorID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	query := `
		UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, updated_at = ?
		WHERE id = ? AND creator_id = ?
	`

	now := time.Now()
	_, err = s.db.Exec(query, updateReq.Title, updateReq.Description, updateReq.EventTime, updateReq.Location,
		now, eventID, userID)
	return err
}

func (s *EventService) DeleteEvent(eventID, userID uint) error {
	// Check if user is the creator
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM events WHERE id = ?", eventID).Scan(&creatorID)
	if err != nil {
		return err
	}

	if creatorID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	// Delete related data first
	s.db.Exec("DELETE FROM event_responses WHERE event_id = ?", eventID)

	// Delete the event
	_, err = s.db.Exec("DELETE FROM events WHERE id = ? AND creator_id = ?", eventID, userID)
	return err
}

func (s *EventService) RespondToEvent(eventID, userID uint, option string) error {
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

	return err
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
	return err
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
   e.created_at, e.updated_at,
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
			&event.EventTime, &event.Location, &event.CreatedAt, &event.UpdatedAt,
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

func (s *EventService) getEventGroupID(eventID uint) (uint, error) {
	query := `SELECT group_id FROM events WHERE id = ?`

	var groupID uint
	err := s.db.QueryRow(query, eventID).Scan(&groupID)
	return groupID, err
}
