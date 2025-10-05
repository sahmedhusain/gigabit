package websocket

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types constants
const (
	MessageTypePrivateMessage      = "private_message"
	MessageTypeGroupMessage        = "group_message"
	MessageTypeNotification        = "notification"
	MessageTypeUserStatus          = "user_status"
	MessageTypeTyping              = "typing"
	MessageTypePostUpdate          = "post_update"
	MessageTypeGroupPostUpdate     = "group_post_update"
	MessageTypeCommentUpdate       = "comment_update"
	MessageTypeLikeUpdate          = "like_update"
	MessageTypeLike                = "like"
	MessageTypeFollowUpdate        = "follow_update"
	MessageTypeFollow              = "follow"
	MessageTypeUnfollow            = "unfollow"
	MessageTypeFollowRequest       = "follow_request"
	MessageTypeCancelFollowRequest = "cancel_follow_request"
	MessageTypeFollowerCountUpdate = "follower_count_update"
	MessageTypeGroupUpdate         = "group_update"
	MessageTypeEventUpdate         = "event_update"
	MessageTypeError               = "error"
	MessageTypePing                = "ping"
	MessageTypePong                = "pong"
)

// Message represents a websocket message
type Message struct {
	Type      string      `json:"type"`
	From      uint        `json:"from"`
	To        uint        `json:"to,omitempty"`       // For private messages
	GroupID   uint        `json:"group_id,omitempty"` // For group messages
	PostID    uint        `json:"post_id,omitempty"`  // For post updates
	EventID   uint        `json:"event_id,omitempty"` // For event updates
	Content   string      `json:"content"`
	Action    string      `json:"action,omitempty"` // create, update, delete, like, unlike
	Data      interface{} `json:"data,omitempty"`
	MessageID string      `json:"message_id,omitempty"` // For message deduplication
	Timestamp int64       `json:"timestamp"`
}

// Client represents a websocket client
type Client struct {
	ID        uint
	Hub       *Hub
	Conn      *websocket.Conn
	Send      chan Message
	Groups    map[uint]bool // Groups the user is member of
	Following map[uint]bool // Users this client is following (for feed updates)
	LastPing  time.Time     // Last ping time for connection health
	mu        sync.RWMutex
}

