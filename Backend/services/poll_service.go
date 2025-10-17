package services

import (
	"database/sql"
	"errors"
	"fmt"
	"social/models"
	"social/websocket"
	"strings"
	"time"
)

type PollService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewPollService(db *sql.DB, hub *websocket.Hub) *PollService {
	return &PollService{
		db:  db,
		hub: hub,
	}
}

// CreatePoll creates a new poll with options
func (s *PollService) CreatePoll(userID uint, req *models.CreatePollRequest) (*models.PollResponse, error) {
	// Validate options
	if len(req.Options) < 2 {
		return nil, errors.New("poll must have at least 2 options")
	}
	if len(req.Options) > 10 {
		return nil, errors.New("poll cannot have more than 10 options")
	}

	// Parse expires_at if provided
	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			return nil, fmt.Errorf("invalid expires_at format: %w", err)
		}
		expiresAt = &parsedTime
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Insert poll
	var description *string
	if req.Description != "" {
		description = &req.Description
	}

	result, err := tx.Exec(`
		INSERT INTO polls (user_id, group_id, title, description, allow_multiple_choices, expires_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, userID, req.GroupID, req.Title, description, req.AllowMultipleChoices, expiresAt, time.Now(), time.Now())
	if err != nil {
		return nil, err
	}

	pollID, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	// Insert options
	for i, optionText := range req.Options {
		if optionText == "" {
			continue // Skip empty options
		}
		_, err := tx.Exec(`
			INSERT INTO poll_options (poll_id, option_text, option_order, created_at)
			VALUES (?, ?, ?, ?)
		`, pollID, optionText, i, time.Now())
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Return the created poll
	poll, err := s.GetPollByID(uint(pollID), userID)
	if err != nil {
		return nil, err
	}

	// Broadcast poll creation to group members
	if s.hub != nil && req.GroupID != nil && *req.GroupID > 0 {
		s.hub.BroadcastPollUpdate(uint(pollID), *req.GroupID, userID, "created", map[string]interface{}{
			"poll": poll,
		})
	}

	return poll, nil
}

// GetPollByID retrieves a poll by ID with all voting data
func (s *PollService) GetPollByID(pollID, userID uint) (*models.PollResponse, error) {
	// Get poll basic info
	poll := &models.Poll{}
	var description sql.NullString
	var groupID sql.NullInt64
	var expiresAt sql.NullTime

	err := s.db.QueryRow(`
		SELECT id, user_id, group_id, title, description, allow_multiple_choices, expires_at, created_at, updated_at
		FROM polls
		WHERE id = ?
	`, pollID).Scan(
		&poll.ID,
		&poll.UserID,
		&groupID,
		&poll.Title,
		&description,
		&poll.AllowMultipleChoices,
		&expiresAt,
		&poll.CreatedAt,
		&poll.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("poll not found")
		}
		return nil, err
	}

	if description.Valid {
		poll.Description = &description.String
	}
	if groupID.Valid {
		gid := uint(groupID.Int64)
		poll.GroupID = &gid
	}
	if expiresAt.Valid {
		poll.ExpiresAt = &expiresAt.Time
	}

	// Get creator info
	creator, err := s.getUserInfo(poll.UserID)
	if err != nil {
		return nil, err
	}

	// Get options with vote counts
	options, err := s.getPollOptions(pollID, userID)
	if err != nil {
		return nil, err
	}

	// Get total selections (not unique voters)
	var totalSelections int64
	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM poll_votes WHERE poll_id = ?
	`, pollID).Scan(&totalSelections)
	if err != nil {
		return nil, err
	}

	// Calculate percentages based on total selections
	for i := range options {
		if totalSelections > 0 {
			options[i].Percentage = float64(options[i].VoteCount) / float64(totalSelections) * 100
		}
	}

	// Get user's votes
	userVotes, err := s.getUserVotes(pollID, userID)
	if err != nil {
		return nil, err
	}

	// Check if poll is expired
	isExpired := false
	if poll.ExpiresAt != nil && poll.ExpiresAt.Before(time.Now()) {
		isExpired = true
	}

	return &models.PollResponse{
		ID:                   poll.ID,
		UserID:               poll.UserID,
		GroupID:              poll.GroupID,
		Title:                poll.Title,
		Description:          poll.Description,
		AllowMultipleChoices: poll.AllowMultipleChoices,
		ExpiresAt:            poll.ExpiresAt,
		CreatedAt:            poll.CreatedAt,
		UpdatedAt:            poll.UpdatedAt,
		Creator:              *creator,
		Options:              options,
		TotalVotes:           totalSelections,
		UserVoted:            len(userVotes) > 0,
		UserVotes:            userVotes,
		IsExpired:            isExpired,
	}, nil
}

// GetGroupPolls retrieves all polls for a group
func (s *PollService) GetGroupPolls(groupID, userID uint, limit, offset int) ([]models.PollResponse, error) {
	rows, err := s.db.Query(`
		SELECT id FROM polls
		WHERE group_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var polls []models.PollResponse
	for rows.Next() {
		var pollID uint
		if err := rows.Scan(&pollID); err != nil {
			return nil, err
		}

		poll, err := s.GetPollByID(pollID, userID)
		if err != nil {
			continue // Skip polls with errors
		}
		polls = append(polls, *poll)
	}

	return polls, nil
}

// VotePoll allows a user to vote on poll options
func (s *PollService) VotePoll(pollID, userID uint, optionIDs []uint) error {
	poll := &models.Poll{}
	var allowMultiple bool
	var expiresAt sql.NullTime

	err := s.db.QueryRow(`
		SELECT id, allow_multiple_choices, expires_at
		FROM polls
		WHERE id = ?
	`, pollID).Scan(&poll.ID, &allowMultiple, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("poll not found")
		}
		return err
	}

	// Check if poll is expired
	if expiresAt.Valid && expiresAt.Time.Before(time.Now()) {
		return errors.New("poll has expired")
	}

	// Validate option count
	if !allowMultiple && len(optionIDs) > 1 {
		return errors.New("poll does not allow multiple choices")
	}

	// Verify all options belong to this poll
	for _, optionID := range optionIDs {
		var count int
		err := s.db.QueryRow(`
			SELECT COUNT(*) FROM poll_options WHERE id = ? AND poll_id = ?
		`, optionID, pollID).Scan(&count)
		if err != nil || count == 0 {
			return fmt.Errorf("invalid option ID: %d", optionID)
		}
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?
	`, pollID, userID)
	if err != nil {
		return err
	}

	// Add new votes
	for _, optionID := range optionIDs {
		_, err := tx.Exec(`
			INSERT INTO poll_votes (poll_id, option_id, user_id, created_at)
			VALUES (?, ?, ?, ?)
		`, pollID, optionID, userID, time.Now())
		if err != nil {
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	// Get group ID for broadcasting
	var groupID sql.NullInt64
	err = s.db.QueryRow(`
		SELECT group_id FROM polls WHERE id = ?
	`, pollID).Scan(&groupID)
	if err != nil {
		return err
	}

	// Broadcast vote update to group members
	if s.hub != nil && groupID.Valid && groupID.Int64 > 0 {
		voteData := map[string]interface{}{
			"poll_id": pollID,
			"user_id": userID,
			"action":  "vote",
		}
		s.hub.BroadcastPollVoteUpdate(pollID, uint(groupID.Int64), userID, "vote_changed", voteData)
	}

	return nil
}

// UnvotePoll removes all user votes from a poll
func (s *PollService) UnvotePoll(pollID, userID uint) error {
	// Get poll info for broadcasting
	var groupID sql.NullInt64
	err := s.db.QueryRow(`
		SELECT group_id FROM polls WHERE id = ?
	`, pollID).Scan(&groupID)
	if err != nil {
		return err
	}

	result, err := s.db.Exec(`
		DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?
	`, pollID, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("no votes found to remove")
	}

	// Broadcast vote update to group members
	if s.hub != nil && groupID.Valid && groupID.Int64 > 0 {
		voteData := map[string]interface{}{
			"poll_id": pollID,
			"user_id": userID,
			"action":  "unvote",
		}
		s.hub.BroadcastPollVoteUpdate(pollID, uint(groupID.Int64), userID, "vote_changed", voteData)
	}

	return nil
}

// DeletePoll deletes a poll and all its related data
func (s *PollService) DeletePoll(pollID, userID uint) error {
	// Check if user is authorized to delete this poll
	var pollUserID uint
	var groupID sql.NullInt64
	err := s.db.QueryRow(`
		SELECT user_id, group_id FROM polls WHERE id = ?
	`, pollID).Scan(&pollUserID, &groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("poll not found")
		}
		return err
	}

	// Check if user is the creator
	if pollUserID != userID {
		// If poll belongs to a group, check if user is group admin
		if groupID.Valid {
			isAdmin, err := s.isUserGroupAdmin(uint(groupID.Int64), userID)
			if err != nil || !isAdmin {
				return errors.New("unauthorized")
			}
		} else {
			return errors.New("unauthorized")
		}
	}

	// Delete poll votes first
	_, err = s.db.Exec("DELETE FROM poll_votes WHERE poll_id = ?", pollID)
	if err != nil {
		return err
	}

	// Delete poll options
	_, err = s.db.Exec("DELETE FROM poll_options WHERE poll_id = ?", pollID)
	if err != nil {
		return err
	}

	// Delete the poll
	_, err = s.db.Exec("DELETE FROM polls WHERE id = ?", pollID)
	if err != nil {
		return err
	}

	// Broadcast poll deletion to group members
	if s.hub != nil && groupID.Valid && groupID.Int64 > 0 {
		deleteData := map[string]interface{}{
			"poll_id": pollID,
			"action":  "deleted",
		}
		s.hub.BroadcastPollUpdate(pollID, uint(groupID.Int64), userID, "poll_deleted", deleteData)
	}

	return nil
}

// ExpirePoll sets a poll to expired status
func (s *PollService) ExpirePoll(pollID, userID uint) error {
	// Check if user is authorized to expire this poll
	var pollUserID uint
	var groupID sql.NullInt64
	var expiresAt sql.NullTime
	err := s.db.QueryRow(`
		SELECT user_id, group_id, expires_at FROM polls WHERE id = ?
	`, pollID).Scan(&pollUserID, &groupID, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("poll not found")
		}
		return err
	}

	// Check if poll is already expired
	if expiresAt.Valid && expiresAt.Time.Before(time.Now()) {
		return errors.New("poll already expired")
	}

	// Check if user is the creator
	if pollUserID != userID {
		// If poll belongs to a group, check if user is group admin
		if groupID.Valid {
			isAdmin, err := s.isUserGroupAdmin(uint(groupID.Int64), userID)
			if err != nil || !isAdmin {
				return errors.New("unauthorized")
			}
		} else {
			return errors.New("unauthorized")
		}
	}

	// Set expires_at to current time to expire the poll
	now := time.Now()
	_, err = s.db.Exec(`
		UPDATE polls SET expires_at = ?, updated_at = ? WHERE id = ?
	`, now, now, pollID)
	if err != nil {
		return err
	}

	// Broadcast poll expiration to group members
	if s.hub != nil && groupID.Valid && groupID.Int64 > 0 {
		expireData := map[string]interface{}{
			"poll_id":    pollID,
			"action":     "expired",
			"expires_at": now.Format(time.RFC3339),
		}
		s.hub.BroadcastPollUpdate(pollID, uint(groupID.Int64), userID, "poll_expired", expireData)
	}

	return nil
}

// Helper functions

func (s *PollService) getUserInfo(userID uint) (*models.UserResponse, error) {
	user := &models.UserResponse{}
	var rawAvatar sql.NullString

	err := s.db.QueryRow(`
		SELECT id, email, first_name, last_name, nickname, avatar, date_of_birth
		FROM users
		WHERE id = ?
	`, userID).Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.Nickname,
		&rawAvatar,
		&user.DateOfBirth,
	)
	if err != nil {
		return nil, err
	}

	if rawAvatar.Valid {
		processed := rawAvatar.String
		if processed != "" {
			if strings.HasPrefix(processed, "http") {
				user.Avatar = &processed
			} else if strings.HasPrefix(processed, "/avatars/") {
				user.Avatar = &processed
			} else if strings.HasPrefix(processed, "image:") {
				// leave nil for invalid avatar marker
			} else {
				full := fmt.Sprintf("http://localhost:8080/api/uploads/%s", processed)
				user.Avatar = &full
			}
		}
	}

	return user, nil
}

func (s *PollService) getPollOptions(pollID, userID uint) ([]models.PollOptionResponse, error) {
	rows, err := s.db.Query(`
		SELECT 
			po.id,
			po.option_text,
			po.option_order
		FROM poll_options po
		WHERE po.poll_id = ?
		ORDER BY po.option_order
	`, pollID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var options []models.PollOptionResponse
	for rows.Next() {
		option := models.PollOptionResponse{}
		err := rows.Scan(
			&option.ID,
			&option.OptionText,
			&option.OptionOrder,
		)
		if err != nil {
			return nil, err
		}

		// Get vote count (total selections for this option)
		err = s.db.QueryRow(`
			SELECT COUNT(*) FROM poll_votes WHERE option_id = ?
		`, option.ID).Scan(&option.VoteCount)
		if err != nil {
			return nil, err
		}

		// Set total voters (unique voters for this option) for "+more" display
		err = s.db.QueryRow(`
			SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE option_id = ?
		`, option.ID).Scan(&option.TotalVoters)
		if err != nil {
			return nil, err
		}

		// Get voters (limit to 5 for display)
		voterRows, err := s.db.Query(`
			SELECT DISTINCT u.first_name, u.last_name
			FROM poll_votes pv
			JOIN users u ON pv.user_id = u.id
			WHERE pv.option_id = ?
			ORDER BY u.first_name, u.last_name
			LIMIT 5
		`, option.ID)
		if err == nil {
			var voters []string
			for voterRows.Next() {
				var firstName, lastName string
				if err := voterRows.Scan(&firstName, &lastName); err == nil {
					voters = append(voters, fmt.Sprintf("%s %s", firstName, lastName))
				}
			}
			voterRows.Close()
			option.Voters = voters
		}

		options = append(options, option)
	}

	return options, nil
}

func (s *PollService) getUserVotes(pollID, userID uint) ([]uint, error) {
	rows, err := s.db.Query(`
		SELECT option_id FROM poll_votes
		WHERE poll_id = ? AND user_id = ?
	`, pollID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var votes []uint
	for rows.Next() {
		var optionID uint
		if err := rows.Scan(&optionID); err != nil {
			return nil, err
		}
		votes = append(votes, optionID)
	}

	return votes, nil
}

func (s *PollService) isUserGroupAdmin(groupID, userID uint) (bool, error) {
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
