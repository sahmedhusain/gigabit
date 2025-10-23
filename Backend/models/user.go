package models

import (
	"fmt"
	"strings"
	"time"
)

type User struct {
	ID               uint      `json:"id"`
	Email            string    `json:"email"`
	Password         string    `json:"-"` // "-" excludes from JSON
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	DateOfBirth      string    `json:"date_of_birth"`
	Avatar           *string   `json:"avatar"`
	Nickname         *string   `json:"nickname"`
	AboutMe          *string   `json:"about_me"`
	Gender           *string   `json:"gender"`
	IsPrivate        bool      `json:"is_private"`
	BirthdayPrivacy  string    `json:"birthday_privacy"`
	GenderPrivacy    string    `json:"gender_privacy"`
	Status           string    `json:"status"`
	LastStatusChange time.Time `json:"last_status_change"`
	IsDeleted        bool      `json:"is_deleted"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type UserResponse struct {
	ID               uint      `json:"id"`
	Email            string    `json:"email"`
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	DateOfBirth      string    `json:"date_of_birth"`
	Avatar           *string   `json:"avatar"`
	Nickname         *string   `json:"nickname"`
	AboutMe          *string   `json:"about_me"`
	Gender           *string   `json:"gender"`
	IsPrivate        bool      `json:"is_private"`
	BirthdayPrivacy  string    `json:"birthday_privacy"`
	GenderPrivacy    string    `json:"gender_privacy"`
	Status           string    `json:"status"`
	LastStatusChange time.Time `json:"last_status_change"`
	IsDeleted        bool      `json:"is_deleted"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (u *User) ToResponse() UserResponse {
	avatarURL := ""
	if u.Avatar != nil && *u.Avatar != "" {
		// If it's already a full URL, use as is
		if strings.HasPrefix(*u.Avatar, "http") {
			avatarURL = *u.Avatar
		} else if strings.HasPrefix(*u.Avatar, "/avatars/") {
			// For built-in avatars, use as is
			avatarURL = *u.Avatar
		} else if strings.HasPrefix(*u.Avatar, "image:") {
			// Invalid avatar format, return empty
			avatarURL = ""
		} else {
			// For uploaded files, prepend the uploads path
			avatarURL = fmt.Sprintf("http://localhost:8080/api/uploads/%s", *u.Avatar)
		}
	}

	return UserResponse{
		ID:               u.ID,
		Email:            u.Email,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		DateOfBirth:      u.DateOfBirth,
		Avatar:           &avatarURL,
		Nickname:         u.Nickname,
		AboutMe:          u.AboutMe,
		Gender:           u.Gender,
		IsPrivate:        u.IsPrivate,
		BirthdayPrivacy:  u.BirthdayPrivacy,
		GenderPrivacy:    u.GenderPrivacy,
		Status:           u.Status,
		LastStatusChange: u.LastStatusChange,
		IsDeleted:        u.IsDeleted,
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
	}
}
