package models

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"` // "-" excludes from JSON
	FirstName string         `json:"first_name"`
	LastName  string         `json:"last_name"`
	Bio       string         `json:"bio"`
	AvatarURL string         `json:"avatar_url"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Posts         []Post       `json:"posts,omitempty" gorm:"foreignKey:UserID"`
	Comments      []Comment    `json:"comments,omitempty" gorm:"foreignKey:UserID"`
	Likes         []Like       `json:"likes,omitempty" gorm:"foreignKey:UserID"`
	SentRequests  []Friendship `json:"sent_requests,omitempty" gorm:"foreignKey:RequesterID"`
	ReceivedRequests []Friendship `json:"received_requests,omitempty" gorm:"foreignKey:AddresseeID"`
}

type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Bio       string    `json:"bio"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Bio:       u.Bio,
		AvatarURL: u.AvatarURL,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
