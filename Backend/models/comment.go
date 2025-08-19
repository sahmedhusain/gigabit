package models

import (
	"time"
)

type Comment struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	PostID    uint      `json:"post_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CommentResponse struct {
	ID        uint         `json:"id"`
	UserID    uint         `json:"user_id"`
	PostID    uint         `json:"post_id"`
	Content   string       `json:"content"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	User      UserResponse `json:"user"`
}

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=500"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=500"`
}
