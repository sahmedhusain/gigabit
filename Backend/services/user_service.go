package services

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"social/models"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, gender, is_private, status, last_status_change, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()

	log.Printf("Creating user with avatar: %v", user.Avatar)
	if user.Avatar != nil {
		log.Printf("Avatar length: %d", len(*user.Avatar))
		log.Printf("Avatar starts with: %s", (*user.Avatar)[:min(100, len(*user.Avatar))])
	}

	// Set default status if not provided
	if user.Status == "" {
		user.Status = "online"
	}
	if user.LastStatusChange.IsZero() {
		user.LastStatusChange = now
	}

	result, err := s.db.Exec(query, user.Email, user.Password, user.FirstName, user.LastName,
		user.DateOfBirth, user.Avatar, user.Nickname, user.AboutMe, user.Gender, user.IsPrivate, user.Status, user.LastStatusChange, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	user.ID = uint(id)
	user.CreatedAt = now
	user.UpdatedAt = now

	return nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, gender, is_private, status, last_status_change, created_at, updated_at
		FROM users WHERE email = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, email)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.Gender, &user.IsPrivate, &user.Status, &user.LastStatusChange,
		&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) GetUserByNickname(nickname string) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, gender, is_private, status, last_status_change, created_at, updated_at
		FROM users WHERE nickname = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, nickname)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.Gender, &user.IsPrivate, &user.Status, &user.LastStatusChange,
		&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, gender, is_private, status, last_status_change, created_at, updated_at
		FROM users WHERE id = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, id)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.Gender, &user.IsPrivate, &user.Status, &user.LastStatusChange,
		&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) UpdateUser(user *models.User) error {
	query := `
		UPDATE users SET 
			email = ?, first_name = ?, last_name = ?, date_of_birth = ?, avatar = ?, nickname = ?, about_me = ?, is_private = ?, password = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, user.Email, user.FirstName, user.LastName, user.DateOfBirth, user.Avatar, user.Nickname,
		user.AboutMe, user.IsPrivate, user.Password, now, user.ID)
	if err != nil {
		return err
	}

	user.UpdatedAt = now
	return nil
}

func (s *UserService) SearchUsers(query string, currentUserID uint) ([]*models.User, error) {
	sqlQuery := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, gender, is_private, status, last_status_change, created_at, updated_at
		FROM users 
		WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR nickname LIKE ?) 
		AND id != ?
		LIMIT 20
	`

	searchPattern := "%" + query + "%"
	rows, err := s.db.Query(sqlQuery, searchPattern, searchPattern, searchPattern, searchPattern, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
			&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.Gender, &user.IsPrivate, &user.Status, &user.LastStatusChange,
			&user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func (s *UserService) CanViewProfile(currentUserID, targetUserID uint) (bool, error) {
	if currentUserID == targetUserID {
		return true, nil
	}

	targetUser, err := s.GetUserByID(targetUserID)
	if err != nil {
		return false, err
	}

	if !targetUser.IsPrivate {
		return true, nil
	}

	return s.AreUsersConnected(currentUserID, targetUserID)
}

func (s *UserService) AreUsersConnected(userID1, userID2 uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM follows 
		WHERE (follower_id = ? AND following_id = ? AND status = 'accepted')
		OR (follower_id = ? AND following_id = ? AND status = 'accepted')
	`

	var count int
	err := s.db.QueryRow(query, userID1, userID2, userID2, userID1).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// UpdateUserStatus updates the status for a user
func (s *UserService) UpdateUserStatus(userID uint, status string) error {
	query := `
		UPDATE users 
		SET status = ?, last_status_change = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, status, now, now, userID)
	if err != nil {
		return err
	}

	return nil
}

// GenerateUniqueNickname generates a unique nickname from email
func (s *UserService) GenerateUniqueNickname(email string) (string, error) {
	// Extract the part before @ from email
	atIndex := -1
	for i, char := range email {
		if char == '@' {
			atIndex = i
			break
		}
	}

	if atIndex == -1 {
		return "", fmt.Errorf("invalid email format")
	}

	baseNickname := email[:atIndex]

	// Check if the base nickname is available
	_, err := s.GetUserByNickname(baseNickname)
	if err != nil {
		if err == sql.ErrNoRows {
			return baseNickname, nil
		}
		return "", err
	}

	// Base nickname is taken, try with counter
	counter := 2
	for {
		candidateNickname := fmt.Sprintf("%s%d", baseNickname, counter)

		_, err := s.GetUserByNickname(candidateNickname)
		if err != nil {
			if err == sql.ErrNoRows {
				// Nickname with counter is available
				return candidateNickname, nil
			}
			return "", err
		}

		counter++
		// Prevent infinite loop - reasonable limit
		if counter > 9999 {
			return "", fmt.Errorf("unable to generate unique nickname")
		}
	}
}

func (s *UserService) DeleteUser(userID uint) error {
	query := `DELETE FROM users WHERE id = ?`
	_, err := s.db.Exec(query, userID)
	return err
}
