package services

import (
	"database/sql"
	"fmt"
	"log"
	"social/models"
	"social/websocket"
)

type BookmarkService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewBookmarkService(db *sql.DB, hub *websocket.Hub) *BookmarkService {
	return &BookmarkService{
		db:  db,
		hub: hub,
	}
}

func (s *BookmarkService) BookmarkPost(userID, postID uint) error {
	// Check if bookmark already exists
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?)", userID, postID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check existing bookmark: %v", err)
	}

	if exists {
		return fmt.Errorf("post already bookmarked")
	}

	// Insert bookmark
	_, err = s.db.Exec("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)", userID, postID)
	if err != nil {
		return fmt.Errorf("failed to create bookmark: %v", err)
	}

	log.Printf("User %d bookmarked post %d", userID, postID)
	return nil
}

func (s *BookmarkService) UnbookmarkPost(userID, postID uint) error {
	result, err := s.db.Exec("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?", userID, postID)
	if err != nil {
		return fmt.Errorf("failed to remove bookmark: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("bookmark not found")
	}

	log.Printf("User %d unbookmarked post %d", userID, postID)
	return nil
}

func (s *BookmarkService) IsPostBookmarked(userID, postID uint) (bool, error) {
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?)", userID, postID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check bookmark status: %v", err)
	}
	return exists, nil
}

func (s *BookmarkService) GetUserBookmarks(userID uint, limit, offset int) ([]models.BookmarkResponse, error) {
	query := `
		SELECT b.id, b.user_id, b.post_id, b.created_at, b.updated_at,
			   p.id, p.user_id, p.content, p.image_url, p.privacy, p.created_at, p.updated_at,
			   u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM bookmarks b
		JOIN posts p ON b.post_id = p.id
		JOIN users u ON p.user_id = u.id
		WHERE b.user_id = ?
		ORDER BY b.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get bookmarks: %v", err)
	}
	defer rows.Close()

	var bookmarks []models.BookmarkResponse
	for rows.Next() {
		var bookmark models.BookmarkResponse
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&bookmark.ID, &bookmark.UserID, &bookmark.PostID, &bookmark.CreatedAt, &bookmark.UpdatedAt,
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.CreatedAt, &post.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan bookmark: %v", err)
		}

		post.User = user
		bookmark.Post = post
		bookmarks = append(bookmarks, bookmark)
	}

	return bookmarks, nil
}

func (s *BookmarkService) GetBookmarkCount(userID uint) (int64, error) {
	var count int64
	err := s.db.QueryRow("SELECT COUNT(*) FROM bookmarks WHERE user_id = ?", userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get bookmark count: %v", err)
	}
	return count, nil
}
