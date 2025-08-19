package models

import (
	"time"
)

type User struct {
	ID          uint      `json:"id"`
	Email       string    `json:"email"`
	Password    string    `json:"-"` // "-" excludes from JSON
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth string    `json:"date_of_birth"`
	Avatar      *string   `json:"avatar"`
	Nickname    *string   `json:"nickname"`
	AboutMe     *string   `json:"about_me"`
	IsPrivate   bool      `json:"is_private"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UserResponse struct {
	ID          uint      `json:"id"`
	Email       string    `json:"email"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth string    `json:"date_of_birth"`
	Avatar      *string   `json:"avatar"`
	Nickname    *string   `json:"nickname"`
	AboutMe     *string   `json:"about_me"`
	IsPrivate   bool      `json:"is_private"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:          u.ID,
		Email:       u.Email,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		DateOfBirth: u.DateOfBirth,
		Avatar:      u.Avatar,
		Nickname:    u.Nickname,
		AboutMe:     u.AboutMe,
		IsPrivate:   u.IsPrivate,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}
