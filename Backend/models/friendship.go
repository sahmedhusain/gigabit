package models

import (
	"time"
	"gorm.io/gorm"
)

type FriendshipStatus string

const (
	FriendshipPending  FriendshipStatus = "pending"
	FriendshipAccepted FriendshipStatus = "accepted"
	FriendshipBlocked  FriendshipStatus = "blocked"
)

type Friendship struct {
	ID          uint             `json:"id" gorm:"primaryKey"`
	RequesterID uint             `json:"requester_id" gorm:"not null"`
	AddresseeID uint             `json:"addressee_id" gorm:"not null"`
	Status      FriendshipStatus `json:"status" gorm:"default:'pending'"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `json:"-" gorm:"index"`

	// Relationships
	Requester User `json:"requester" gorm:"foreignKey:RequesterID"`
	Addressee User `json:"addressee" gorm:"foreignKey:AddresseeID"`
}

type FriendshipResponse struct {
	ID          uint             `json:"id"`
	RequesterID uint             `json:"requester_id"`
	AddresseeID uint             `json:"addressee_id"`
	Status      FriendshipStatus `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Requester   UserResponse     `json:"requester"`
	Addressee   UserResponse     `json:"addressee"`
}

type FriendRequest struct {
	AddresseeID uint `json:"addressee_id" binding:"required"`
}

// Ensure unique friendship pairs (prevent duplicate requests)
func (Friendship) TableName() string {
	return "friendships"
}
