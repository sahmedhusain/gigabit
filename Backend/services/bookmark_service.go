package services

import (
	"database/sql"
	"fmt"

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
			   p.id, p.user_id, p.content, p.image_url, p.privacy, p.created_at, p.updated_at, p.share_count,
			   u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname,
			   COUNT(DISTINCT l.id) as like_count,
			   COUNT(DISTINCT c.id) as comment_count,
			   CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
			   CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
		FROM bookmarks b
		JOIN posts p ON b.post_id = p.id
		JOIN users u ON p.user_id = u.id
		LEFT JOIN likes l ON p.id = l.post_id
		LEFT JOIN comments c ON p.id = c.post_id
		LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
		LEFT JOIN bookmarks ub ON p.id = ub.post_id AND ub.user_id = ?
		WHERE b.user_id = ?
		GROUP BY b.id, p.id, u.id
		ORDER BY b.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, userID, userID, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get bookmarks: %v", err)
	}
	defer rows.Close()

	var bookmarks []models.BookmarkResponse
	for rows.Next() {
		var bookmark models.BookmarkResponse
		var post models.PostResponse
		var user models.UserResponse

		var avatar, nickname sql.NullString
		err := rows.Scan(
			&bookmark.ID, &bookmark.UserID, &bookmark.PostID, &bookmark.CreatedAt, &bookmark.UpdatedAt,
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.CreatedAt, &post.UpdatedAt, &post.ShareCount,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &avatar, &nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan bookmark: %v", err)
		}

		// Handle nullable fields
		if avatar.Valid {
			user.Avatar = &avatar.String
		}
		if nickname.Valid {
			user.Nickname = &nickname.String
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
