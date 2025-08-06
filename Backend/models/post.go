package models

import (
	"time"
	"gorm.io/gorm"
)

type Post struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null"`
	Content   string         `json:"content" gorm:"not null"`
	ImageURL  string         `json:"image_url"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	User     User      `json:"user" gorm:"foreignKey:UserID"`
	Comments []Comment `json:"comments,omitempty" gorm:"foreignKey:PostID"`
	Likes    []Like    `json:"likes,omitempty" gorm:"foreignKey:PostID"`
}

type PostResponse struct {
	ID        uint         `json:"id"`
	UserID    uint         `json:"user_id"`
	Content   string       `json:"content"`
	ImageURL  string       `json:"image_url"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	User      UserResponse `json:"user"`
	LikeCount int64        `json:"like_count"`
	IsLiked   bool         `json:"is_liked"`
	Comments  []CommentResponse `json:"comments,omitempty"`
}

type CreatePostRequest struct {
	Content  string `json:"content" binding:"required,min=1,max=1000"`
	ImageURL string `json:"image_url"`
}

type UpdatePostRequest struct {
	Content  string `json:"content" binding:"required,min=1,max=1000"`
	ImageURL string `json:"image_url"`
}
