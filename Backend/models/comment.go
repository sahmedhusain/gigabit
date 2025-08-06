package models

import (
	"time"
	"gorm.io/gorm"
)

type Comment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null"`
	PostID    uint           `json:"post_id" gorm:"not null"`
	Content   string         `json:"content" gorm:"not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID"`
	Post Post `json:"post" gorm:"foreignKey:PostID"`
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
