package models

import (
	"time"
)

type Group struct {
	ID           uint      `json:"id"`
	CreatorID    uint      `json:"creator_id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Privacy      string    `json:"privacy"`
	CreatePosts  string    `json:"create_posts"`
	CreatePolls  string    `json:"create_polls"`
	CreateEvents string    `json:"create_events"`
	SendMessages string    `json:"send_messages"`
	Avatar       *string   `json:"avatar"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type GroupResponse struct {
	ID           uint                  `json:"id"`
	CreatorID    uint                  `json:"creator_id"`
	Title        string                `json:"title"`
	Description  string                `json:"description"`
	Privacy      string                `json:"privacy"`
	CreatePosts  string                `json:"create_posts"`
	CreatePolls  string                `json:"create_polls"`
	CreateEvents string                `json:"create_events"`
	SendMessages string                `json:"send_messages"`
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
	Description   string  `json:"description" binding:"min=1,max=500"`
	Privacy       string  `json:"privacy" binding:"required,oneof=public private"`
	CreatePosts   string  `json:"create_posts" binding:"required,oneof=admins_only all_members"`
	CreatePolls   string  `json:"create_polls" binding:"required,oneof=admins_only all_members"`
	CreateEvents  string  `json:"create_events" binding:"required,oneof=admins_only all_members"`
	SendMessages  string  `json:"send_messages" binding:"required,oneof=admins_only all_members"`
	InviteMembers []uint  `json:"invite_members"`
	Avatar        *string `json:"avatar,omitempty"`
}

type UpdateGroupRequest struct {
	Title       string  `json:"title" binding:"min=1,max=100"`
	Description string  `json:"description" binding:"max=500"`
	Avatar      *string `json:"avatar,omitempty"`
}

type UpdateGroupPermissionsRequest struct {
	CreatePosts  string `json:"create_posts" binding:"required,oneof=admins_only all_members"`
	CreatePolls  string `json:"create_polls" binding:"required,oneof=admins_only all_members"`
	CreateEvents string `json:"create_events" binding:"required,oneof=admins_only all_members"`
	SendMessages string `json:"send_messages" binding:"required,oneof=admins_only all_members"`
}

type GroupMember struct {
	ID        uint      `json:"id"`
	GroupID   uint      `json:"group_id"`
	UserID    uint      `json:"user_id"`
	Status    string    `json:"status"` // "member", "sent", "requested", "rejected"
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
	ID           uint                       `json:"id"`
	GroupID      uint                       `json:"group_id"`
	UserID       uint                       `json:"user_id"`
	Content      string                     `json:"content"`
	ImageURL     *string                    `json:"image_url"`
	CreatedAt    time.Time                  `json:"created_at"`
	UpdatedAt    time.Time                  `json:"updated_at"`
	User         UserResponse               `json:"user"`
	LikeCount    int64                      `json:"like_count"`
	DislikeCount int64                      `json:"dislike_count"`
	CommentCount int64                      `json:"comment_count"`
	IsLiked      bool                       `json:"is_liked"`
	IsDisliked   bool                       `json:"is_disliked"`
	Comments     []GroupPostCommentResponse `json:"comments,omitempty"`
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
	// Type distinguishes between a direct invite sent to the current user ("invite")
	// and a join request awaiting the current user's approval as an admin ("join_request").
	Type string `json:"type,omitempty"`
	// RequestUser is populated when Type == "join_request" and represents
	// the user who requested to join the group.
	RequestUser *UserResponse `json:"request_user,omitempty"`
}

type GroupPostComment struct {
	ID          uint      `json:"id"`
	GroupPostID uint      `json:"group_post_id"`
	UserID      uint      `json:"user_id"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type GroupPostCommentResponse struct {
	ID          uint         `json:"id"`
	GroupPostID uint         `json:"group_post_id"`
	UserID      uint         `json:"user_id"`
	Content     string       `json:"content"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	User        UserResponse `json:"user"`
}

type CreateGroupPostCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=500"`
}
