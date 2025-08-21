package services

import (
	"database/sql"
	"social/models"
	"social/websocket"
	"time"
)

type CommentService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewCommentService(db *sql.DB, hub *websocket.Hub) *CommentService {
	return &CommentService{
		db:  db,
		hub: hub,
	}
}

func (s *CommentService) CreateComment(comment *models.Comment) error {
	query := `
		INSERT INTO comments (post_id, user_id, content, image_url, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, comment.PostID, comment.UserID, comment.Content, comment.ImageURL, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	comment.ID = uint(id)
	comment.CreatedAt = now
	comment.UpdatedAt = now

	// Broadcast real-time comment creation
	if s.hub != nil {
		commentData := map[string]interface{}{
			"id":         comment.ID,
			"post_id":    comment.PostID,
			"user_id":    comment.UserID,
			"content":    comment.Content,
			"image_url":  comment.ImageURL,
			"created_at": comment.CreatedAt,
		}
		s.hub.BroadcastCommentUpdate(comment.PostID, comment.ID, comment.UserID, "create", commentData)
	}

	return nil
}

func (s *CommentService) GetPostComments(postID uint, limit, offset int) ([]models.CommentResponse, error) {
	query := `
		SELECT c.id, c.post_id, c.user_id, c.content, c.image_url, c.created_at, c.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.CommentResponse
	for rows.Next() {
		var comment models.CommentResponse
		var user models.UserResponse

		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.ImageURL,
			&comment.CreatedAt, &comment.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		user.ID = comment.UserID
		comment.User = user
		comments = append(comments, comment)
	}

	return comments, nil
}

func (s *CommentService) UpdateComment(commentID uint, userID uint, updateReq *models.UpdateCommentRequest) error {
	// Check if user owns the comment
	var ownerID uint
	err := s.db.QueryRow("SELECT user_id FROM comments WHERE id = ?", commentID).Scan(&ownerID)
	if err != nil {
		return err
	}

	if ownerID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	var imageURL *string
	if updateReq.ImageURL != "" {
		imageURL = &updateReq.ImageURL
	}

	query := `
		UPDATE comments SET content = ?, image_url = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`

	now := time.Now()
	_, err = s.db.Exec(query, updateReq.Content, imageURL, now, commentID, userID)
	return err
}

func (s *CommentService) DeleteComment(commentID uint, userID uint) error {
	// Check if user owns the comment
	var ownerID uint
	err := s.db.QueryRow("SELECT user_id FROM comments WHERE id = ?", commentID).Scan(&ownerID)
	if err != nil {
		return err
	}

	if ownerID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	query := `DELETE FROM comments WHERE id = ? AND user_id = ?`
	_, err = s.db.Exec(query, commentID, userID)
	return err
}

func (s *CommentService) GetCommentCount(postID uint) (int64, error) {
	var count int64
	err := s.db.QueryRow("SELECT COUNT(*) FROM comments WHERE post_id = ?", postID).Scan(&count)
	return count, err
}