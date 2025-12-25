package services

import (
	"database/sql"
	"gigabit/models"
	"time"
)

type FollowService struct {
	db *sql.DB
}

func NewFollowService(db *sql.DB) *FollowService {
	return &FollowService{db: db}
}

func (s *FollowService) CreateFollowRequest(follow *models.Follow) error {
	query := `
		INSERT INTO follows (follower_id, following_id, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, follow.FollowerID, follow.FollowingID, follow.Status, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	follow.ID = uint(id)
	follow.CreatedAt = now
	follow.UpdatedAt = now

	return nil
}

func (s *FollowService) GetFollowRelation(followerID, followingID uint) (*models.Follow, error) {
	query := `
		SELECT id, follower_id, following_id, status, created_at, updated_at
		FROM follows 
		WHERE follower_id = ? AND following_id = ?
	`

	follow := &models.Follow{}
	err := s.db.QueryRow(query, followerID, followingID).Scan(
		&follow.ID, &follow.FollowerID, &follow.FollowingID,
		&follow.Status, &follow.CreatedAt, &follow.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return follow, nil
}

func (s *FollowService) UpdateFollowRequest(follow *models.Follow) error {
	query := `
		UPDATE follows SET status = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, follow.Status, now, follow.ID)
	if err != nil {
		return err
	}

	follow.UpdatedAt = now
	return nil
}

func (s *FollowService) DeleteFollowRequest(followID uint) error {
	query := `DELETE FROM follows WHERE id = ?`
	_, err := s.db.Exec(query, followID)
	return err
}

func (s *FollowService) GetFollowers(userID uint) ([]models.FollowUserResponse, error) {
	query := `
		SELECT u.id, u.first_name, u.last_name, u.avatar, u.nickname, f.created_at
		FROM follows f
		JOIN users u ON f.follower_id = u.id
		WHERE f.following_id = ? AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []models.FollowUserResponse
	for rows.Next() {
		var follower models.FollowUserResponse
		err := rows.Scan(
			&follower.ID, &follower.FirstName, &follower.LastName,
			&follower.Avatar, &follower.Nickname, &follower.FollowedAt,
		)
		if err != nil {
			return nil, err
		}
		followers = append(followers, follower)
	}

	return followers, nil
}

func (s *FollowService) GetFollowing(userID uint) ([]models.FollowUserResponse, error) {
	query := `
		SELECT u.id, u.first_name, u.last_name, u.avatar, u.nickname, f.created_at
		FROM follows f
		JOIN users u ON f.following_id = u.id
		WHERE f.follower_id = ? AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []models.FollowUserResponse
	for rows.Next() {
		var user models.FollowUserResponse
		err := rows.Scan(
			&user.ID, &user.FirstName, &user.LastName,
			&user.Avatar, &user.Nickname, &user.FollowedAt,
		)
		if err != nil {
			return nil, err
		}
		following = append(following, user)
	}

	return following, nil
}

func (s *FollowService) GetPendingFollowRequests(userID uint) ([]models.FollowRequestResponse, error) {
	query := `
		SELECT f.id, u.id, u.first_name, u.last_name, u.avatar, u.nickname, f.created_at
		FROM follows f
		JOIN users u ON f.follower_id = u.id
		WHERE f.following_id = ? AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.FollowRequestResponse
	for rows.Next() {
		var request models.FollowRequestResponse
		err := rows.Scan(
			&request.RequestID, &request.User.ID, &request.User.FirstName,
			&request.User.LastName, &request.User.Avatar, &request.User.Nickname,
			&request.RequestedAt,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, request)
	}

	return requests, nil
}

func (s *FollowService) GetOutgoingFollowRequests(userID uint) ([]models.FollowRequestResponse, error) {
	query := `
		SELECT f.id, u.id, u.first_name, u.last_name, u.avatar, u.nickname, f.created_at
		FROM follows f
		JOIN users u ON f.following_id = u.id
		WHERE f.follower_id = ? AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.FollowRequestResponse
	for rows.Next() {
		var request models.FollowRequestResponse
		err := rows.Scan(
			&request.RequestID, &request.User.ID, &request.User.FirstName,
			&request.User.LastName, &request.User.Avatar, &request.User.Nickname,
			&request.RequestedAt,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, request)
	}

	return requests, nil
}

func (s *FollowService) GetFollowStatus(followerID, followingID uint) (string, error) {
	query := `
		SELECT status FROM follows 
		WHERE follower_id = ? AND following_id = ?
	`

	var status string
	err := s.db.QueryRow(query, followerID, followingID).Scan(&status)
	if err == sql.ErrNoRows {
		return "none", nil
	}
	if err != nil {
		return "", err
	}

	return status, nil
}

func (s *FollowService) GetFollowCounts(userID uint) (followers, following int, err error) {
	followersQuery := `SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'`
	err = s.db.QueryRow(followersQuery, userID).Scan(&followers)
	if err != nil {
		return 0, 0, err
	}

	followingQuery := `SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'`
	err = s.db.QueryRow(followingQuery, userID).Scan(&following)
	if err != nil {
		return 0, 0, err
	}

	return followers, following, nil
}
