package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"gigabit/models"
	"gigabit/websocket"
)

type GroupCommentService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewGroupCommentService(db *sql.DB, hub *websocket.Hub) *GroupCommentService {
	return &GroupCommentService{
		db:  db,
		hub: hub,
	}
}

func (s *GroupCommentService) CreateGroupPostComment(comment *models.GroupPostComment, groupID uint) error {
	query := `
		INSERT INTO group_post_comments (group_post_id, user_id, content, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, comment.GroupPostID, comment.UserID, comment.Content, now, now)
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

	// Send real-time update via WebSocket
	if s.hub != nil {
		commentResponse, err := s.GetCommentByID(uint(id))
		if err == nil {
			message := websocket.Message{
				Type:      "group_post_comment_update",
				From:      comment.UserID,
				GroupID:   groupID,
				PostID:    comment.GroupPostID,
				CommentID: comment.ID,
				Action:    "create",
				Data:      commentResponse,
				Timestamp: time.Now().Unix(),
			}
			s.hub.SendToGroup(groupID, message, comment.UserID)
		}
	}

	return nil
}

func (s *GroupCommentService) GetGroupPostComments(groupPostID uint, limit, offset int) ([]models.GroupPostCommentResponse, error) {
	query := `
		SELECT gpc.id, gpc.group_post_id, gpc.user_id, gpc.content, gpc.created_at, gpc.updated_at,
		       u.first_name, u.last_name, u.avatar, u.nickname, u.status
		FROM group_post_comments gpc
		JOIN users u ON gpc.user_id = u.id
		WHERE gpc.group_post_id = ?
		ORDER BY gpc.created_at ASC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, groupPostID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.GroupPostCommentResponse
	for rows.Next() {
		var comment models.GroupPostCommentResponse
		var firstName, lastName, status string
		var avatar, nickname *string

		err := rows.Scan(
			&comment.ID, &comment.GroupPostID, &comment.UserID, &comment.Content,
			&comment.CreatedAt, &comment.UpdatedAt,
			&firstName, &lastName, &avatar, &nickname, &status,
		)
		if err != nil {
			return nil, err
		}

		// Process avatar URL
		var avatarURL *string
		if avatar != nil && *avatar != "" {
			processed := *avatar
			if !strings.HasPrefix(processed, "http") && !strings.HasPrefix(processed, "/avatars/") && !strings.HasPrefix(processed, "image:") {
				processed = fmt.Sprintf("http://localhost:8080/api/uploads/%s", processed)
			}
			avatarURL = &processed
		}

		comment.User = models.UserResponse{
			ID:        comment.UserID,
			FirstName: firstName,
			LastName:  lastName,
			Avatar:    avatarURL,
			Nickname:  nickname,
			Status:    status,
		}

		comments = append(comments, comment)
	}

	return comments, nil
}

func (s *GroupCommentService) GetCommentByID(commentID uint) (*models.GroupPostCommentResponse, error) {
	query := `
		SELECT gpc.id, gpc.group_post_id, gpc.user_id, gpc.content, gpc.created_at, gpc.updated_at,
		       u.first_name, u.last_name, u.avatar, u.nickname, u.status
		FROM group_post_comments gpc
		JOIN users u ON gpc.user_id = u.id
		WHERE gpc.id = ?
	`

	var comment models.GroupPostCommentResponse
	var firstName, lastName, status string
	var avatar, nickname *string

	err := s.db.QueryRow(query, commentID).Scan(
		&comment.ID, &comment.GroupPostID, &comment.UserID, &comment.Content,
		&comment.CreatedAt, &comment.UpdatedAt,
		&firstName, &lastName, &avatar, &nickname, &status,
	)
	if err != nil {
		return nil, err
	}

	// Process avatar URL
	var avatarURL *string
	if avatar != nil && *avatar != "" {
		processed := *avatar
		if !strings.HasPrefix(processed, "http") && !strings.HasPrefix(processed, "/avatars/") && !strings.HasPrefix(processed, "image:") {
			processed = fmt.Sprintf("http://localhost:8080/api/uploads/%s", processed)
		}
		avatarURL = &processed
	}

	comment.User = models.UserResponse{
		ID:        comment.UserID,
		FirstName: firstName,
		LastName:  lastName,
		Avatar:    avatarURL,
		Nickname:  nickname,
		Status:    status,
	}

	return &comment, nil
}

func (s *GroupCommentService) DeleteGroupPostComment(commentID uint, userID uint, groupID uint, groupService *GroupService) error {
	// Get comment details
	var commentOwnerID uint
	var groupPostID uint
	err := s.db.QueryRow("SELECT user_id, group_post_id FROM group_post_comments WHERE id = ?", commentID).Scan(&commentOwnerID, &groupPostID)
	if err != nil {
		return err
	}

	// Check if user can delete: comment owner OR group admin
	canDelete := false
	if commentOwnerID == userID {
		canDelete = true
	} else {
		// Check if user is admin or creator of the group
		isAdmin, err := groupService.IsUserAdminOrCreator(groupID, userID)
		if err == nil && isAdmin {
			canDelete = true
		}
	}

	if !canDelete {
		return sql.ErrNoRows
	}

	// Delete the comment
	result, err := s.db.Exec("DELETE FROM group_post_comments WHERE id = ?", commentID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	// Send real-time update via WebSocket
	if s.hub != nil {
		message := websocket.Message{
			Type:      "group_post_comment_update",
			From:      userID,
			GroupID:   groupID,
			PostID:    groupPostID,
			CommentID: commentID,
			Action:    "delete",
			Data:      map[string]interface{}{"comment_id": commentID},
			Timestamp: time.Now().Unix(),
		}
		s.hub.SendToGroup(groupID, message, userID)
	}

	return nil
}

func (s *GroupCommentService) GetCommentCount(groupPostID uint) (int64, error) {
	var count int64
	err := s.db.QueryRow("SELECT COUNT(*) FROM group_post_comments WHERE group_post_id = ?", groupPostID).Scan(&count)
	return count, err
}
