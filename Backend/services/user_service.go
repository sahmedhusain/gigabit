package services

import (
	"database/sql"
	"fmt"
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
		INSERT INTO users (email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, status, last_status_change, created_at, updated_at, gender, is_deleted, birthday_privacy, gender_privacy)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()

	// Set default status if not provided
	if user.Status == "" {
		user.Status = "online"
	}
	if user.LastStatusChange.IsZero() {
		user.LastStatusChange = now
	}
	user.IsDeleted = false

	// Set default privacy settings if not provided
	if user.BirthdayPrivacy == "" {
		user.BirthdayPrivacy = "everyone"
	}
	if user.GenderPrivacy == "" {
		user.GenderPrivacy = "everyone"
	}

	result, err := s.db.Exec(query, user.Email, user.Password, user.FirstName, user.LastName,
		user.DateOfBirth, user.Avatar, user.Nickname, user.AboutMe, user.IsPrivate, user.Status, user.LastStatusChange, now, now, user.Gender, user.IsDeleted, user.BirthdayPrivacy, user.GenderPrivacy)
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
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, status, last_status_change, created_at, updated_at, gender, is_deleted, birthday_privacy, gender_privacy
		FROM users WHERE email = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, email)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate, &user.Status, &user.LastStatusChange, &user.CreatedAt, &user.UpdatedAt, &user.Gender, &user.IsDeleted, &user.BirthdayPrivacy, &user.GenderPrivacy)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) GetUserByNickname(nickname string) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, status, last_status_change, created_at, updated_at, gender, is_deleted, birthday_privacy, gender_privacy
		FROM users WHERE nickname = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, nickname)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate, &user.Status, &user.LastStatusChange, &user.CreatedAt, &user.UpdatedAt, &user.Gender, &user.IsDeleted, &user.BirthdayPrivacy, &user.GenderPrivacy)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, status, last_status_change, created_at, updated_at, gender, is_deleted, birthday_privacy, gender_privacy
		FROM users WHERE id = ?
	`

	user := &models.User{}
	row := s.db.QueryRow(query, id)

	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate, &user.Status, &user.LastStatusChange, &user.CreatedAt, &user.UpdatedAt, &user.Gender, &user.IsDeleted, &user.BirthdayPrivacy, &user.GenderPrivacy)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) UpdateUser(user *models.User) error {
	query := `
		UPDATE users SET 
			email = ?, first_name = ?, last_name = ?, date_of_birth = ?, avatar = ?, nickname = ?, about_me = ?, is_private = ?, password = ?, gender = ?, birthday_privacy = ?, gender_privacy = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, user.Email, user.FirstName, user.LastName, user.DateOfBirth, user.Avatar, user.Nickname,
		user.AboutMe, user.IsPrivate, user.Password, user.Gender, user.BirthdayPrivacy, user.GenderPrivacy, now, user.ID)
	if err != nil {
		return err
	}

	user.UpdatedAt = now
	return nil
}

func (s *UserService) SearchUsers(query string, currentUserID uint) ([]*models.User, error) {
	sqlQuery := `
		SELECT id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_private, status, last_status_change, created_at, updated_at, gender, is_deleted, birthday_privacy, gender_privacy
		FROM users 
		WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR nickname LIKE ?) 
		AND id != ?
		AND is_deleted = false
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
			&user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPrivate, &user.Status, &user.LastStatusChange, &user.CreatedAt, &user.UpdatedAt, &user.Gender, &user.IsDeleted, &user.BirthdayPrivacy, &user.GenderPrivacy)
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

// DeleteAccount performs a soft delete of a user account with all associated cleanup
func (s *UserService) DeleteAccount(userID uint) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. Leave all groups with admin transfer logic
	if err = s.leaveAllGroups(tx, userID); err != nil {
		return err
	}

	// 2. Delete all posts and related data
	if err = s.deleteAllPosts(tx, userID); err != nil {
		return err
	}

	// 3. Remove all follow relationships
	if err = s.removeAllFollows(tx, userID); err != nil {
		return err
	}

	// 4. Mark private messages as deleted
	if err = s.markPrivateMessagesDeleted(tx, userID); err != nil {
		return err
	}

	// 5. Soft delete the user (set nullable fields to null, keep record)
	if err = s.softDeleteUser(tx, userID); err != nil {
		return err
	}

	return tx.Commit()
}

// leaveAllGroups handles leaving all groups with admin transfer logic
func (s *UserService) leaveAllGroups(tx *sql.Tx, userID uint) error {
	// Get all groups the user is a member of
	groupQuery := `SELECT group_id FROM group_members WHERE user_id = ? AND status = 'member'`
	rows, err := tx.Query(groupQuery, userID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var groupIDs []uint
	for rows.Next() {
		var groupID uint
		if err := rows.Scan(&groupID); err != nil {
			return err
		}
		groupIDs = append(groupIDs, groupID)
	}

	// Process each group
	for _, groupID := range groupIDs {
		if err := s.leaveGroupWithAdminTransfer(tx, groupID, userID); err != nil {
			return err
		}
	}

	return nil
}

// leaveGroupWithAdminTransfer implements the same logic as LeaveGroup but within a transaction
func (s *UserService) leaveGroupWithAdminTransfer(tx *sql.Tx, groupID, userID uint) error {
	var creatorID uint
	err := tx.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return err
	}

	if creatorID == userID {
		// User is the creator, need to transfer admin rights
		adminQuery := `
			SELECT user_id FROM group_members 
			WHERE group_id = ? AND role = 'admin' AND status = 'member' AND user_id != ?
			ORDER BY created_at ASC
			LIMIT 1
		`

		var nextAdminID uint
		adminErr := tx.QueryRow(adminQuery, groupID, creatorID).Scan(&nextAdminID)

		if adminErr == nil {
			// Transfer creator role to next admin
			_, err = tx.Exec("UPDATE groups SET creator_id = ? WHERE id = ?", nextAdminID, groupID)
			if err != nil {
				return err
			}
		} else {
			// No other admins, find first member
			firstMemberQuery := `
				SELECT user_id FROM group_members 
				WHERE group_id = ? AND status = 'member' AND user_id != ?
				ORDER BY created_at ASC
				LIMIT 1
			`

			var firstMemberID uint
			firstErr := tx.QueryRow(firstMemberQuery, groupID, creatorID).Scan(&firstMemberID)

			if firstErr == nil {
				// Transfer creator role to first member and make them admin
				_, err = tx.Exec("UPDATE groups SET creator_id = ? WHERE id = ?", firstMemberID, groupID)
				if err != nil {
					return err
				}

				_, err = tx.Exec("UPDATE group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?", groupID, firstMemberID)
				if err != nil {
					return err
				}
			} else {
				// No other members, delete the group
				_, err = tx.Exec("DELETE FROM groups WHERE id = ?", groupID)
				if err != nil {
					return err
				}
				_, err = tx.Exec("DELETE FROM group_members WHERE group_id = ?", groupID)
				if err != nil {
					return err
				}
				_, err = tx.Exec("DELETE FROM group_posts WHERE group_id = ?", groupID)
				if err != nil {
					return err
				}
				_, err = tx.Exec("DELETE FROM group_messages WHERE group_id = ?", groupID)
				if err != nil {
					return err
				}
				return nil // Group deleted, no need to remove member
			}
		}
	}

	// Remove user from group
	_, err = tx.Exec("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", groupID, userID)
	return err
}

// deleteAllPosts deletes all posts by the user and related data
func (s *UserService) deleteAllPosts(tx *sql.Tx, userID uint) error {
	// Delete comments on user's posts
	_, err := tx.Exec(`
		DELETE FROM comments 
		WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)
	`, userID)
	if err != nil {
		return err
	}

	// Delete likes on user's posts
	_, err = tx.Exec(`
		DELETE FROM likes 
		WHERE entity_type = 'post' AND entity_id IN (SELECT id FROM posts WHERE user_id = ?)
	`, userID)
	if err != nil {
		return err
	}

	// Delete shares of user's posts
	_, err = tx.Exec("DELETE FROM shares WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userID)
	if err != nil {
		return err
	}

	// Delete post privacy settings
	_, err = tx.Exec("DELETE FROM post_privacy WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userID)
	if err != nil {
		return err
	}

	// Delete the posts
	_, err = tx.Exec("DELETE FROM posts WHERE user_id = ?", userID)
	return err
}

// removeAllFollows removes all follow relationships for the user
func (s *UserService) removeAllFollows(tx *sql.Tx, userID uint) error {
	// Delete follows where user is follower
	_, err := tx.Exec("DELETE FROM follows WHERE follower_id = ?", userID)
	if err != nil {
		return err
	}

	// Delete follows where user is following
	_, err = tx.Exec("DELETE FROM follows WHERE following_id = ?", userID)
	return err
}

// markPrivateMessagesDeleted marks all private messages sent by the user as deleted
func (s *UserService) markPrivateMessagesDeleted(tx *sql.Tx, userID uint) error {
	_, err := tx.Exec("UPDATE private_messages SET is_deleted = true WHERE sender_id = ?", userID)
	return err
}

// softDeleteUser sets user data to null but keeps the record
func (s *UserService) softDeleteUser(tx *sql.Tx, userID uint) error {
	query := `
		UPDATE users SET 
			is_deleted = true,
			updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	_, err := tx.Exec(query, now, userID)
	return err
}
