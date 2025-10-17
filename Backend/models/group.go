package models

import (
	"time"
)

type Group struct {
	ID          uint      `json:"id"`
	CreatorID   uint      `json:"creator_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Privacy     string    `json:"privacy"`
	Avatar      *string   `json:"avatar"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type GroupResponse struct {
	ID           uint                  `json:"id"`
	CreatorID    uint                  `json:"creator_id"`
	Title        string                `json:"title"`
	Description  string                `json:"description"`
	Privacy      string                `json:"privacy"`
	Avatar       *string               `json:"avatar"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
	Creator      UserResponse          `json:"creator"`
	MemberCount  int                   `json:"member_count"`
	IsMember     bool                  `json:"is_member"`
	MemberStatus string                `json:"member_status"` // "member", "sent", "rejected", "requested", "none"
	Role         string                `json:"role"`
	Members      []GroupMemberResponse `json:"members,omitempty"`
}

type CreateGroupRequest struct {
	Title         string  `json:"title" binding:"required,min=1,max=100"`
	Description   string  `json:"description" binding:"required,min=1,max=500"`
	Privacy       string  `json:"privacy" binding:"required,oneof=public private"`
	InviteMembers []uint  `json:"invite_members"`
	Avatar        *string `json:"avatar,omitempty"`
}

type UpdateGroupRequest struct {
	Title       string `json:"title" binding:"min=1,max=100"`
	Description string `json:"description" binding:"max=500"`
}

type GroupMember struct {
	ID        uint      `json:"id"`
	GroupID   uint      `json:"group_id"`
	UserID    uint      `json:"user_id"`
	Status    string    `json:"status"` // "member", "sent", "rejected"
	Role      string    `json:"role"`   // "member", "admin"
	InvitedBy *uint     `json:"invited_by,omitempty"`
	Requestor *uint     `json:"requestor,omitempty"`
	JoinedAt  time.Time `json:"joined_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GroupMemberResponse struct {
	ID        uint         `json:"id"`
	GroupID   uint         `json:"group_id"`
	User      UserResponse `json:"user"`
	Status    string       `json:"status"`
	Role      string       `json:"role"`
	InvitedBy *uint        `json:"invited_by,omitempty"`
	Requestor *uint        `json:"requestor,omitempty"`
	JoinedAt  time.Time    `json:"joined_at"`
}

type GroupPost struct {
	ID        uint      `json:"id"`
	GroupID   uint      `json:"group_id"`
	UserID    uint      `json:"user_id"`
	Content   string    `json:"content"`
	ImageURL  *string   `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GroupPostResponse struct {
	ID           uint              `json:"id"`
	GroupID      uint              `json:"group_id"`
	UserID       uint              `json:"user_id"`
	Content      string            `json:"content"`
	ImageURL     *string           `json:"image_url"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	User         UserResponse      `json:"user"`
	LikeCount    int64             `json:"like_count"`
	DislikeCount int64             `json:"dislike_count"`
	CommentCount int64             `json:"comment_count"`
	IsLiked      bool              `json:"is_liked"`
	IsDisliked   bool              `json:"is_disliked"`
	Comments     []CommentResponse `json:"comments,omitempty"`
}

type CreateGroupPostRequest struct {
	Content  string `json:"content" binding:"required,min=1,max=1000"`
	ImageURL string `json:"image_url"`
}

type GroupInviteRequest struct {
	UserIDs []uint `json:"user_ids" binding:"required,min=1"`
}

type JoinGroupRequest struct {
	GroupID uint `json:"group_id" binding:"required"`
}

type GroupInvitationResponse struct {
	ID        uint          `json:"id"`
	Group     GroupResponse `json:"group"`
	CreatedAt time.Time     `json:"created_at"`
}
