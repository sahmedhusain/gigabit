package models

import (
	"time"
)

type Post struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Content   string    `json:"content"`
	ImageURL  *string   `json:"image_url"`
	Privacy   string    `json:"privacy"` // "public", "almost_private", "private"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PostResponse struct {
	ID           uint              `json:"id"`
	UserID       uint              `json:"user_id"`
	Content      string            `json:"content"`
	ImageURL     *string           `json:"image_url"`
	Privacy      string            `json:"privacy"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	User         UserResponse      `json:"user"`
	LikeCount    int64             `json:"like_count"`
	CommentCount int64             `json:"comment_count"`
	IsLiked      bool              `json:"is_liked"`
	Comments     []CommentResponse `json:"comments,omitempty"`
}

type CreatePostRequest struct {
	Content         string `json:"content" binding:"required,min=1,max=1000"`
	ImageURL        string `json:"image_url"`
	Privacy         string `json:"privacy" binding:"required,oneof=public almost_private private"`
	SpecificUserIDs []uint `json:"specific_user_ids"`
}

type UpdatePostRequest struct {
	Content         string `json:"content" binding:"min=1,max=1000"`
	ImageURL        string `json:"image_url"`
	Privacy         string `json:"privacy" binding:"oneof=public almost_private private"`
	SpecificUserIDs []uint `json:"specific_user_ids"`
}

type PostPrivacy struct {
	ID     uint `json:"id"`
	PostID uint `json:"post_id"`
	UserID uint `json:"user_id"`
}
