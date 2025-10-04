package models

import (
	"time"
)

type Comment struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	PostID    uint      `json:"post_id"`
	Content   string    `json:"content"`
	ImageURL  *string   `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CommentResponse struct {
	ID        uint         `json:"id"`
	UserID    uint         `json:"user_id"`
	PostID    uint         `json:"post_id"`
	Content   string       `json:"content"`
	ImageURL  *string      `json:"image_url"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	User      UserResponse `json:"user"`
}

type CreateCommentRequest struct {
	Content  string `json:"content" binding:"omitempty,max=500"`
	ImageURL string `json:"image_url"`
}

type UpdateCommentRequest struct {
	Content  string `json:"content" binding:"omitempty,max=500"`
	ImageURL string `json:"image_url"`
}
