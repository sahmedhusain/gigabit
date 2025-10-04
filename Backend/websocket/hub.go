// receive follower related requests, create a message type for each one.
// follow, unfollow, follow_request, cancel_follow_request
// a handler should handle these messages and send the request to the target user
// if successful, send a ws message back to the client
// insert the follower to the user table in the database only if request is accepted or if the follow is successful
// create the followers and following tables fields in the user table in the database

package websocket

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin in development
		// In production, implement proper origin checking
		return true
	},
}

// Message types
const (
	MessageTypePrivateMessage      = "private_message"
	MessageTypeGroupMessage        = "group_message"
	MessageTypeNotification        = "notification"
	MessageTypeUserStatus          = "user_status"
	MessageTypeTyping              = "typing"
	MessageTypePostUpdate          = "post_update"
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

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients mapped by user ID
	clients map[uint]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Inbound messages from clients
	broadcast chan Message

	// Database connection for WebSocket operations
	db *sql.DB

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

// NewHub creates a new websocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

// SetDB sets the database connection for the hub
func (h *Hub) SetDB(db *sql.DB) {
	h.db = db
}

// Run starts the hub and handles client registration, unregistration, and message broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("Client %d connected", client.ID)

			// Send user status update to other clients
			h.broadcastUserStatus(client.ID, "online")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
				h.mu.Unlock()
				log.Printf("Client %d disconnected", client.ID)

				// Send user status update to other clients
				h.broadcastUserStatus(client.ID, "offline")
			} else {
				h.mu.Unlock()
			}

		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}

// handleMessage processes different types of messages
func (h *Hub) handleMessage(message Message) {
	switch message.Type {
	case MessageTypePrivateMessage:
		h.handlePrivateMessage(message)
	case MessageTypeGroupMessage:
		h.handleGroupMessage(message)
	case MessageTypeNotification:
		h.handleNotification(message)
	case MessageTypeUserStatus:
		h.handleUserStatus(message)
	case MessageTypeTyping:
		h.handleTypingIndicator(message)
	case MessageTypePostUpdate:
		h.handlePostUpdate(message)
	case MessageTypeCommentUpdate:
		if message.Action == "create" {
			h.handleCommentCreate(message)
		} else {
			h.handleCommentUpdate(message)
		}
	case MessageTypeLikeUpdate:
		h.handleLikeUpdate(message)
	case MessageTypeLike:
		h.handleLike(message)
	case MessageTypeFollowUpdate:
		h.handleFollowUpdate(message)
	case MessageTypeFollow:
		h.handleFollow(message)
	case MessageTypeUnfollow:
		h.handleUnfollow(message)
	case MessageTypeFollowRequest:
		h.handleFollowRequest(message)
	case MessageTypeCancelFollowRequest:
		h.handleCancelFollowRequest(message)
	case MessageTypeGroupUpdate:
		h.handleGroupUpdate(message)
	case MessageTypeEventUpdate:
		h.handleEventUpdate(message)
	case MessageTypePing:
		h.handlePing(message)
	case MessageTypePong:
		h.handlePong(message)
	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

// handlePrivateMessage sends a message to a specific user
func (h *Hub) handlePrivateMessage(message Message) {
	h.mu.RLock()
	targetClient, exists := h.clients[message.To]
	h.mu.RUnlock()

	if exists {
		select {
		case targetClient.Send <- message:
		default:
			// Client's send channel is full, close it
			h.mu.Lock()
			delete(h.clients, targetClient.ID)
			close(targetClient.Send)
			h.mu.Unlock()
		}
	}
}

// handleGroupMessage broadcasts a message to all group members
func (h *Hub) handleGroupMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			client.mu.RLock()
			isMember := client.Groups[message.GroupID]
			client.mu.RUnlock()

			if isMember {
				select {
				case client.Send <- message:
				default:
					// Client's send channel is full, close it
					go func(c *Client) {
						h.mu.Lock()
						delete(h.clients, c.ID)
						close(c.Send)
						h.mu.Unlock()
					}(client)
				}
			}
		}
	}
}

// handleUserStatus handles user status related messages
func (h *Hub) handleUserStatus(message Message) {
	if message.Data == nil {
		return
	}

	data, ok := message.Data.(map[string]interface{})
	if !ok {
		return
	}

	action, ok := data["action"].(string)
	if !ok {
		return
	}

	switch action {
	case "get_online_users":
		h.handleGetOnlineUsers(message.From)
	case "status_change":
		h.handleStatusChange(message)
	default:
		log.Printf("Unknown user status action: %s", action)
	}
}

// handleGetOnlineUsers sends the list of online users to the requesting client
func (h *Hub) handleGetOnlineUsers(userID uint) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	onlineUsers := make([]map[string]interface{}, 0, len(h.clients))
	for id := range h.clients {
		// Get user info from database if available
		var username string
		if h.db != nil {
			var firstName, lastName string
			err := h.db.QueryRow("SELECT first_name, last_name FROM users WHERE id = ?", id).Scan(&firstName, &lastName)
			if err == nil {
				username = firstName + " " + lastName
			}
		}

		if username == "" {
			username = fmt.Sprintf("User %d", id)
		}

		onlineUsers = append(onlineUsers, map[string]interface{}{
			"user_id":   id,
			"username":  username,
			"is_online": true,
		})
	}

	responseMessage := Message{
		Type: MessageTypeUserStatus,
		From: 0, // System message
		To:   userID,
		Data: map[string]interface{}{
			"online_users": onlineUsers,
		},
		Timestamp: time.Now().Unix(),
	}

	h.SendToUser(userID, responseMessage)
}

// handleStatusChange handles user status change requests
func (h *Hub) handleStatusChange(message Message) {
	// For now, we only handle online/offline status automatically
	// Custom status changes can be implemented later
	log.Printf("Status change request from user %d", message.From)
}

// handleNotification sends a notification to a specific user
func (h *Hub) handleNotification(message Message) {
	h.handlePrivateMessage(message) // Same logic as private message
}

// handleTypingIndicator handles typing indicators for private and group chats
func (h *Hub) handleTypingIndicator(message Message) {
	if message.GroupID > 0 {
		// Group typing indicator
		h.handleGroupMessage(message)
	} else {
		// Private typing indicator
		h.handlePrivateMessage(message)
	}
}

// broadcastUserStatus sends user status updates to all connected clients
func (h *Hub) broadcastUserStatus(userID uint, status string) {
	message := Message{
		Type: MessageTypeUserStatus,
		From: userID,
		Data: map[string]interface{}{
			"user_id": userID,
			"status":  status,
		},
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		if client.ID != userID { // Don't send to the user themselves
			select {
			case client.Send <- message:
			default:
				// Client's send channel is full, close it
				go func(c *Client) {
					h.mu.Lock()
					delete(h.clients, c.ID)
					close(c.Send)
					h.mu.Unlock()
				}(client)
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID uint, message Message) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		select {
		case client.Send <- message:
		default:
			// Client's send channel is full
			log.Printf("Failed to send message to user %d: send channel full", userID)
		}
	}
}

// SendToGroup sends a message to all members of a group
func (h *Hub) SendToGroup(groupID uint, message Message, excludeUserID uint) {
	message.GroupID = groupID
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != excludeUserID {
			client.mu.RLock()
			isMember := client.Groups[groupID]
			client.mu.RUnlock()

			if isMember {
				select {
				case client.Send <- message:
				default:
					log.Printf("Failed to send message to user %d in group %d", userID, groupID)
				}
			}
		}
	}
}

// AddUserToGroup adds a user to a group for message broadcasting
func (h *Hub) AddUserToGroup(userID, groupID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		if client.Groups == nil {
			client.Groups = make(map[uint]bool)
		}
		client.Groups[groupID] = true
		client.mu.Unlock()
	}
}

// RemoveUserFromGroup removes a user from a group
func (h *Hub) RemoveUserFromGroup(userID, groupID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		delete(client.Groups, groupID)
		client.mu.Unlock()
	}
}

// IsUserOnline checks if a user is currently connected
func (h *Hub) IsUserOnline(userID uint) bool {
	h.mu.RLock()
	_, exists := h.clients[userID]
	h.mu.RUnlock()
	return exists
}

// GetOnlineUsers returns a list of currently online user IDs
func (h *Hub) GetOnlineUsers() []uint {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]uint, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// BroadcastMessage adds a message to the broadcast channel
func (h *Hub) BroadcastMessage(message Message) {
	select {
	case h.broadcast <- message:
	default:
		log.Printf("Broadcast channel full, dropping message")
	}
}

// readPump handles reading messages from the websocket connection
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler for connection health
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var message Message
		err := c.Conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Websocket error: %v", err)
			}
			break
		}

		// Set the sender ID
		message.From = c.ID
		message.Timestamp = time.Now().Unix()

		// Broadcast the message
		c.Hub.BroadcastMessage(message)
	}
}

// writePump handles writing messages to the websocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWS handles websocket requests from clients
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID uint) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Websocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:        userID,
		Hub:       h,
		Conn:      conn,
		Send:      make(chan Message, 256),
		Groups:    make(map[uint]bool),
		Following: make(map[uint]bool),
		LastPing:  time.Now(),
	}

	client.Hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// handlePostUpdate broadcasts post updates to followers
func (h *Hub) handlePostUpdate(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			client.mu.RLock()
			isFollowing := client.Following[message.From]
			client.mu.RUnlock()

			// Send to followers or if it's a public post update
			if isFollowing || message.Action == "create" {
				select {
				case client.Send <- message:
				default:
					log.Printf("Failed to send post update to user %d", userID)
				}
			}
		}
	}
}

// handleCommentCreate processes comment creation via WebSocket
func (h *Hub) handleCommentCreate(message Message) {
	if h.db == nil {
		log.Printf("Database not available")
		return
	}

	// Extract comment data from the message
	if commentData, ok := message.Data.(map[string]interface{}); ok {
		postID := message.PostID
		userID := message.From

		content, _ := commentData["content"].(string)

		// Check if we have either content or image_url
		var imageURL *string
		if imgURL, ok := commentData["image_url"].(string); ok && imgURL != "" {
			imageURL = &imgURL
		}

		// Require either content or image
		if content == "" && imageURL == nil {
			log.Printf("Comment must have either content or image from user %d", userID)
			// Send error back to client
			errorMsg := Message{
				Type:      MessageTypeError,
				From:      0, // System message
				To:        userID,
				Content:   "Comment must have either text or image",
				Timestamp: time.Now().Unix(),
			}
			h.SendToUser(userID, errorMsg)
			return
		}

		// Create the comment directly in the database
		query := `
			INSERT INTO comments (post_id, user_id, content, image_url, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`

		now := time.Now()
		result, err := h.db.Exec(query, postID, userID, content, imageURL, now, now)
		if err != nil {
			log.Printf("Failed to create comment via WebSocket: %v", err)
			// Send error back to client
			errorMsg := Message{
				Type:      MessageTypeError,
				From:      0,
				To:        userID,
				Content:   "Failed to create comment",
				Timestamp: time.Now().Unix(),
			}
			h.SendToUser(userID, errorMsg)
			return
		}

		commentID, err := result.LastInsertId()
		if err != nil {
			log.Printf("Failed to get comment ID: %v", err)
			return
		}

		// Get user information for the response
		userQuery := `SELECT first_name, last_name, avatar, nickname FROM users WHERE id = ?`
		var firstName, lastName string
		var avatar, nickname *string

		err = h.db.QueryRow(userQuery, userID).Scan(&firstName, &lastName, &avatar, &nickname)
		if err != nil {
			log.Printf("Failed to get user info: %v", err)
			return
		}

		// Create response data with complete comment information
		responseData := map[string]interface{}{
			"id":         uint(commentID),
			"post_id":    postID,
			"user_id":    userID,
			"content":    content,
			"image_url":  imageURL,
			"created_at": now.Format("2006-01-02T15:04:05Z"),
			"updated_at": now.Format("2006-01-02T15:04:05Z"),
			"user": map[string]interface{}{
				"id":         userID,
				"first_name": firstName,
				"last_name":  lastName,
				"avatar":     avatar,
				"nickname":   nickname,
			},
		}

		// Broadcast the new comment to all clients
		h.BroadcastCommentUpdate(postID, uint(commentID), userID, "create", responseData)

		log.Printf("Comment created via WebSocket: postID=%d, userID=%d, commentID=%d", postID, userID, commentID)
	} else {
		log.Printf("Invalid comment data format from user %d", message.From)
	}
}

// handleCommentUpdate broadcasts comment updates to post author and commenters
func (h *Hub) handleCommentUpdate(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// For now, broadcast to all connected clients
	// In a real implementation, you'd track who should receive comment updates
	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			select {
			case client.Send <- message:
			default:
				log.Printf("Failed to send comment update to user %d", userID)
			}
		}
	}
}

// handleLikeUpdate broadcasts like updates to post author
func (h *Hub) handleLikeUpdate(message Message) {
	if message.To > 0 { // If we know who to send to
		h.handlePrivateMessage(message)
	} else {
		// Broadcast to interested parties
		h.mu.RLock()
		defer h.mu.RUnlock()

		for userID, client := range h.clients {
			if userID != message.From { // Don't send back to sender
				select {
				case client.Send <- message:
				default:
					log.Printf("Failed to send like update to user %d", userID)
				}
			}
		}
	}
}

func (h *Hub) handleLike(message Message) {
	// Broadcast like updates to all connected clients except sender
	h.mu.RLock()
	defer h.mu.RUnlock()

	log.Printf("Broadcasting like update for post %d by user %d", message.PostID, message.From)

	for userID, client := range h.clients {
		if userID != message.From { // Don't send back to sender
			select {
			case client.Send <- message:
				log.Printf("Successfully sent like update to user %d", userID)
			default:
				log.Printf("Failed to send like update to user %d", userID)
			}
		}
	}
}

// handleFollowUpdate broadcasts follow updates
func (h *Hub) handleFollowUpdate(message Message) {
	// Send to the user being followed
	if message.To > 0 {
		h.handlePrivateMessage(message)
	}
}

// handleGroupUpdate broadcasts group updates to group members
func (h *Hub) handleGroupUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

// handleEventUpdate broadcasts event updates to group members
func (h *Hub) handleEventUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

// handlePing responds to ping messages with pong
func (h *Hub) handlePing(message Message) {
	h.mu.RLock()
	client, exists := h.clients[message.From]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		client.LastPing = time.Now()
		client.mu.Unlock()

		pongMessage := Message{
			Type:      MessageTypePong,
			From:      0, // Server response
			To:        message.From,
			Timestamp: time.Now().Unix(),
		}

		select {
		case client.Send <- pongMessage:
		default:
			log.Printf("Failed to send pong to user %d", message.From)
		}
	}
}

// handlePong handles pong responses from clients
func (h *Hub) handlePong(message Message) {
	h.mu.RLock()
	client, exists := h.clients[message.From]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		client.LastPing = time.Now()
		client.mu.Unlock()
	}
}

// AddUserToFollowing adds a user to the following list for real-time updates
func (h *Hub) AddUserToFollowing(userID, followingUserID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		if client.Following == nil {
			client.Following = make(map[uint]bool)
		}
		client.Following[followingUserID] = true
		client.mu.Unlock()
	}
}

// RemoveUserFromFollowing removes a user from the following list
func (h *Hub) RemoveUserFromFollowing(userID, followingUserID uint) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if exists {
		client.mu.Lock()
		delete(client.Following, followingUserID)
		client.mu.Unlock()
	}
}

// BroadcastPostUpdate broadcasts a post update to relevant users
func (h *Hub) BroadcastPostUpdate(postID, authorID uint, action string, postData interface{}) {
	message := Message{
		Type:      MessageTypePostUpdate,
		From:      authorID,
		PostID:    postID,
		Action:    action,
		Data:      postData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastCommentUpdate broadcasts a comment update
func (h *Hub) BroadcastCommentUpdate(postID uint, commentID, authorID uint, action string, commentData interface{}) {
	message := Message{
		Type:      MessageTypeCommentUpdate,
		From:      authorID,
		PostID:    postID,
		Action:    action,
		Data:      commentData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastLikeUpdate broadcasts a like update
func (h *Hub) BroadcastLikeUpdate(postID, userID uint, action string, likeData interface{}) {
	message := Message{
		Type:      MessageTypeLikeUpdate,
		From:      userID,
		PostID:    postID,
		Action:    action,
		Data:      likeData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastFollowUpdate broadcasts a follow update
func (h *Hub) BroadcastFollowUpdate(fromUserID, toUserID uint, action string, followData interface{}) {
	message := Message{
		Type:      MessageTypeFollowUpdate,
		From:      fromUserID,
		To:        toUserID,
		Action:    action,
		Data:      followData,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// BroadcastToAll broadcasts a message to all connected users
func (h *Hub) BroadcastToAll(messageType, action string, data interface{}) {
	message := Message{
		Type:      messageType,
		From:      0, // System message
		Action:    action,
		Data:      data,
		Timestamp: time.Now().Unix(),
	}
	h.BroadcastMessage(message)
}

// CleanupStaleConnections removes connections that haven't responded to ping in a while
func (h *Hub) CleanupStaleConnections() {
	h.mu.RLock()
	staleClients := make([]*Client, 0)
	now := time.Now()

	for _, client := range h.clients {
		client.mu.RLock()
		if now.Sub(client.LastPing) > 2*time.Minute {
			staleClients = append(staleClients, client)
		}
		client.mu.RUnlock()
	}
	h.mu.RUnlock()

	// Close stale connections
	for _, client := range staleClients {
		client.Conn.Close()
	}
}

// handleFollow processes follow requests for public users
func (h *Hub) handleFollow(message Message) {
	if h.db == nil {
		log.Printf("Database not available")
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		log.Printf("Invalid target user ID in follow message")
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if target user exists and is public
	var isPrivate bool
	var firstName, lastName string
	err := h.db.QueryRow("SELECT is_private, first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&isPrivate, &firstName, &lastName)
	if err != nil {
		log.Printf("User %d not found: %v", targetUserID, err)
		h.sendErrorMessage(followerID, "User not found")
		return
	}

	// If user is private, send error - should use follow_request instead
	if isPrivate {
		log.Printf("User %d is private, follow request needed", targetUserID)
		h.sendErrorMessage(followerID, "This user is private. Send a follow request instead")
		return
	}

	// Check if already following
	var existingID int
	err = h.db.QueryRow("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'", followerID, targetUserID).Scan(&existingID)
	if err == nil {
		log.Printf("User %d already following user %d", followerID, targetUserID)
		h.sendErrorMessage(followerID, "Already following this user")
		return
	}

	// Create follow relationship
	now := time.Now()
	_, err = h.db.Exec("INSERT INTO follows (follower_id, following_id, status, created_at, updated_at) VALUES (?, ?, 'accepted', ?, ?)",
		followerID, targetUserID, now, now)
	if err != nil {
		log.Printf("Failed to create follow relationship: %v", err)
		h.sendErrorMessage(followerID, "Failed to follow user")
		return
	}

	// Update the follower's following list in memory
	h.AddUserToFollowing(followerID, targetUserID)

	// Send success response to follower
	h.SendToUser(followerID, Message{
		Type:   MessageTypeFollowUpdate,
		From:   0, // System message
		To:     followerID,
		Action: "follow_success",
		Data: map[string]interface{}{
			"user_id":   targetUserID,
			"user_name": firstName + " " + lastName,
			"status":    "following",
		},
		Timestamp: time.Now().Unix(),
	})

	// Send notification to target user
	h.SendToUser(targetUserID, Message{
		Type:   MessageTypeNotification,
		From:   followerID,
		To:     targetUserID,
		Action: "new_follower",
		Data: map[string]interface{}{
			"type":    "follow",
			"message": firstName + " " + lastName + " started following you",
		},
		Timestamp: time.Now().Unix(),
	})

	// Broadcast follower count updates
	h.broadcastFollowerCountUpdate(followerID)
	h.broadcastFollowerCountUpdate(targetUserID)

	log.Printf("User %d now following user %d", followerID, targetUserID)
}

// handleUnfollow processes unfollow requests
func (h *Hub) handleUnfollow(message Message) {
	if h.db == nil {
		log.Printf("Database not available")
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		log.Printf("Invalid target user ID in unfollow message")
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if currently following
	var followID int
	err := h.db.QueryRow("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'", followerID, targetUserID).Scan(&followID)
	if err != nil {
		log.Printf("User %d not following user %d: %v", followerID, targetUserID, err)
		h.sendErrorMessage(followerID, "Not following this user")
		return
	}

	// Remove follow relationship
	_, err = h.db.Exec("DELETE FROM follows WHERE id = ?", followID)
	if err != nil {
		log.Printf("Failed to unfollow user: %v", err)
		h.sendErrorMessage(followerID, "Failed to unfollow user")
		return
	}

	// Update the follower's following list in memory
	h.RemoveUserFromFollowing(followerID, targetUserID)

	// Get target user name
	var firstName, lastName string
	h.db.QueryRow("SELECT first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&firstName, &lastName)

	// Send success response to follower
	h.SendToUser(followerID, Message{
		Type:   MessageTypeFollowUpdate,
		From:   0, // System message
		To:     followerID,
		Action: "unfollow_success",
		Data: map[string]interface{}{
			"user_id":   targetUserID,
			"user_name": firstName + " " + lastName,
			"status":    "not_following",
		},
		Timestamp: time.Now().Unix(),
	})

	// Broadcast follower count updates
	h.broadcastFollowerCountUpdate(followerID)
	h.broadcastFollowerCountUpdate(targetUserID)

	log.Printf("User %d unfollowed user %d", followerID, targetUserID)
}

// handleFollowRequest processes follow requests for private users
func (h *Hub) handleFollowRequest(message Message) {
	if h.db == nil {
		log.Printf("Database not available")
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		log.Printf("Invalid target user ID in follow request message")
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if target user exists
	var isPrivate bool
	var firstName, lastName string
	err := h.db.QueryRow("SELECT is_private, first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&isPrivate, &firstName, &lastName)
	if err != nil {
		log.Printf("User %d not found: %v", targetUserID, err)
		h.sendErrorMessage(followerID, "User not found")
		return
	}

	// Check if already following or request exists
	var existingStatus string
	err = h.db.QueryRow("SELECT status FROM follows WHERE follower_id = ? AND following_id = ?", followerID, targetUserID).Scan(&existingStatus)
	if err == nil {
		switch existingStatus {
		case "accepted":
			h.sendErrorMessage(followerID, "Already following this user")
		case "pending":
			h.sendErrorMessage(followerID, "Follow request already sent")
		default:
			h.sendErrorMessage(followerID, "Follow request exists")
		}
		return
	}

	// Create follow request
	now := time.Now()
	status := "pending"
	if !isPrivate {
		status = "accepted" // Auto-accept for public users
	}

	_, err = h.db.Exec("INSERT INTO follows (follower_id, following_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		followerID, targetUserID, status, now, now)
	if err != nil {
		log.Printf("Failed to create follow request: %v", err)
		h.sendErrorMessage(followerID, "Failed to send follow request")
		return
	}

	if status == "accepted" {
		// Update the follower's following list in memory
		h.AddUserToFollowing(followerID, targetUserID)
		// Broadcast follower count updates
		h.broadcastFollowerCountUpdate(followerID)
		h.broadcastFollowerCountUpdate(targetUserID)
	}

	// Get follower name for notification
	var followerFirstName, followerLastName string
	h.db.QueryRow("SELECT first_name, last_name FROM users WHERE id = ?", followerID).Scan(&followerFirstName, &followerLastName)

	// Send success response to follower
	responseMessage := "Follow request sent"
	if status == "accepted" {
		responseMessage = "Now following user"
	}

	h.SendToUser(followerID, Message{
		Type:   MessageTypeFollowUpdate,
		From:   0, // System message
		To:     followerID,
		Action: "follow_request_sent",
		Data: map[string]interface{}{
			"user_id":   targetUserID,
			"user_name": firstName + " " + lastName,
			"status":    status,
			"message":   responseMessage,
		},
		Timestamp: time.Now().Unix(),
	})

	// Send notification to target user
	notificationMessage := followerFirstName + " " + followerLastName + " wants to follow you"
	if status == "accepted" {
		notificationMessage = followerFirstName + " " + followerLastName + " started following you"
	}

	h.SendToUser(targetUserID, Message{
		Type:   MessageTypeNotification,
		From:   followerID,
		To:     targetUserID,
		Action: "follow_request",
		Data: map[string]interface{}{
			"type":    "follow_request",
			"message": notificationMessage,
		},
		Timestamp: time.Now().Unix(),
	})

	log.Printf("Follow request from user %d to user %d with status %s", followerID, targetUserID, status)
}

// handleCancelFollowRequest processes cancel follow request
func (h *Hub) handleCancelFollowRequest(message Message) {
	if h.db == nil {
		log.Printf("Database not available")
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		log.Printf("Invalid target user ID in cancel follow request message")
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if pending request exists
	var followID int
	err := h.db.QueryRow("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'", followerID, targetUserID).Scan(&followID)
	if err != nil {
		log.Printf("No pending follow request from user %d to user %d: %v", followerID, targetUserID, err)
		h.sendErrorMessage(followerID, "No pending follow request found")
		return
	}

	// Delete the follow request
	_, err = h.db.Exec("DELETE FROM follows WHERE id = ?", followID)
	if err != nil {
		log.Printf("Failed to cancel follow request: %v", err)
		h.sendErrorMessage(followerID, "Failed to cancel follow request")
		return
	}

	// Get target user name
	var firstName, lastName string
	h.db.QueryRow("SELECT first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&firstName, &lastName)

	// Send success response to follower
	h.SendToUser(followerID, Message{
		Type:   MessageTypeFollowUpdate,
		From:   0, // System message
		To:     followerID,
		Action: "follow_request_cancelled",
		Data: map[string]interface{}{
			"user_id":   targetUserID,
			"user_name": firstName + " " + lastName,
			"status":    "not_following",
		},
		Timestamp: time.Now().Unix(),
	})

	log.Printf("Follow request cancelled by user %d to user %d", followerID, targetUserID)
}

// sendErrorMessage sends an error message to a user
func (h *Hub) sendErrorMessage(userID uint, errorMsg string) {
	h.SendToUser(userID, Message{
		Type:      MessageTypeError,
		From:      0, // System message
		To:        userID,
		Content:   errorMsg,
		Timestamp: time.Now().Unix(),
	})
}

// broadcastFollowerCountUpdate broadcasts updated follower counts to a user's profile viewers
func (h *Hub) broadcastFollowerCountUpdate(userID uint) {
	if h.db == nil {
		return
	}

	// Get updated follower counts from database
	followersQuery := `SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'`
	followingQuery := `SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'`

	var followersCount, followingCount int

	err := h.db.QueryRow(followersQuery, userID).Scan(&followersCount)
	if err != nil {
		log.Printf("Failed to get followers count for user %d: %v", userID, err)
		return
	}

	err = h.db.QueryRow(followingQuery, userID).Scan(&followingCount)
	if err != nil {
		log.Printf("Failed to get following count for user %d: %v", userID, err)
		return
	}

	// Broadcast the count update to all connected clients
	countUpdateMessage := Message{
		Type:   MessageTypeFollowerCountUpdate,
		From:   0, // System message
		Action: "count_update",
		Data: map[string]interface{}{
			"user_id":         userID,
			"followers_count": followersCount,
			"following_count": followingCount,
		},
		Timestamp: time.Now().Unix(),
	}

	h.BroadcastMessage(countUpdateMessage)
}
