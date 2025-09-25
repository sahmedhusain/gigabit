package services

import (
	"database/sql"
	"log"
	"social/models"
	"time"
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
		INSERT INTO users (email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()

	log.Printf("Creating user with avatar: %v", user.Avatar)
	if user.Avatar != nil {
		log.Printf("Avatar length: %d", len(*user.Avatar))
		log.Printf("Avatar starts with: %s", (*user.Avatar)[:min(100, len(*user.Avatar))])
	}

	result, err := s.db.Exec(query, user.Email, user.Password, user.FirstName, user.LastName,
		user.DateOfBirth, user.Avatar, user.Nickname, user.AboutMe, user.IsPrivate, now, now)
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
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, created_at, updated_at
		FROM users WHERE email = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, email)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate,
		&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) GetUserByNickname(nickname string) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, created_at, updated_at
		FROM users WHERE nickname = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, nickname)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate,
		&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, created_at, updated_at
		FROM users WHERE id = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, id)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate,
		&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) UpdateUser(user *models.User) error {
	query := `
		UPDATE users SET 
			first_name = ?, last_name = ?, avatar = ?, nickname = ?, about_me = ?, is_private = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, user.FirstName, user.LastName, user.Avatar, user.Nickname,
		user.AboutMe, user.IsPrivate, now, user.ID)
	if err != nil {
		return err
	}

	user.UpdatedAt = now
	return nil
}

func (s *UserService) SearchUsers(query string, currentUserID uint) ([]*models.User, error) {
	sqlQuery := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, created_at, updated_at
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
			&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate,
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

// UpdateUserPrivacy updates the privacy setting for a user
func (s *UserService) UpdateUserPrivacy(userID uint, isPrivate bool) error {
	query := `
		UPDATE users 
		SET is_private = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, isPrivate, now, userID)
	if err != nil {
		return err
	}

	return nil
}
