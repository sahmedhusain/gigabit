package websocket

import (
	"database/sql"
	"time"
)

func (h *Hub) handlePostUpdate(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From {
			client.mu.RLock()
			isFollowing := client.Following[message.From]
			client.mu.RUnlock()

			if isFollowing || message.Action == "create" {
				select {
				case client.Send <- message:
				default:
				}
			}
		}
	}
}

func (h *Hub) handleGroupPostUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

func (h *Hub) handleCommentCreate(message Message) {
	if h.db == nil {
		return
	}

	// Extract comment data from the message
	if commentData, ok := message.Data.(map[string]interface{}); ok {
		// Check if this is a broadcast of an already-created comment (has ID)
		if _, hasID := commentData["id"]; hasID {
			// This is a broadcast from HTTP API, just relay to other clients
			h.handleCommentUpdate(message)
			return
		}

		postID := message.PostID
		userID := message.From

		content, contentOk := commentData["content"].(string)
		if !contentOk || content == "" {
			errorMsg := Message{
				Type:      MessageTypeError,
				From:      0,
				To:        userID,
				Content:   "Invalid comment content",
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

		var imageURL *string
		if imgURL, ok := commentData["image_url"].(string); ok && imgURL != "" {
			imageURL = &imgURL
		}

		now := time.Now()
		result, err := h.db.Exec(query, postID, userID, content, imageURL, now, now)
		if err != nil {
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
			return
		}

		// Get user information for the response
		userQuery := `SELECT first_name, last_name, avatar, nickname FROM users WHERE id = ?`
		var firstName, lastName string
		var avatar, nickname sql.NullString

		err = h.db.QueryRow(userQuery, userID).Scan(&firstName, &lastName, &avatar, &nickname)
		if err != nil {
			return
		}

		// Handle nullable fields properly
		var avatarStr, nicknameStr *string
		if avatar.Valid {
			avatarStr = &avatar.String
		}
		if nickname.Valid {
			nicknameStr = &nickname.String
		}

		// Create response data with complete comment information
		responseData := map[string]interface{}{
			"id":         uint(commentID),
			"post_id":    postID,
			"user_id":    userID,
			"content":    content,
			"image_url":  imageURL, // This is already a *string or nil
			"created_at": now.Format("2006-01-02T15:04:05Z07:00"),
			"updated_at": now.Format("2006-01-02T15:04:05Z07:00"),
			"user": map[string]interface{}{
				"id":            userID,
				"first_name":    firstName,
				"last_name":     lastName,
				"avatar":        avatarStr,   // Send as *string to match frontend expectations
				"nickname":      nicknameStr, // Send as *string to match frontend expectations
				"email":         "",          // Add missing fields that frontend expects
				"date_of_birth": "",
				"about_me":      nil,
				"is_private":    false,
				"created_at":    "",
				"updated_at":    "",
			},
		}

		// Broadcast the new comment to all clients
		h.BroadcastCommentUpdate(postID, uint(commentID), userID, "create", responseData)
	} else {
	}
}

func (h *Hub) handleCommentUpdate(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From {
			select {
			case client.Send <- message:
			default:
			}
		}
	}
}

func (h *Hub) handleLikeUpdate(message Message) {
	if message.To > 0 {
		h.handlePrivateMessage(message)
	} else {

		h.mu.RLock()
		defer h.mu.RUnlock()

		for userID, client := range h.clients {
			if userID != message.From {
				select {
				case client.Send <- message:
				default:
				}
			}
		}
	}
}

func (h *Hub) handleLike(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		if userID != message.From {
			select {
			case client.Send <- message:
			default:
			}
		}
	}
}

func (h *Hub) handleFollowStatus(message Message) {
	if h.db == nil {
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if target user exists
	var isPrivate bool
	var firstName, lastName string
	err := h.db.QueryRow("SELECT is_private, first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&isPrivate, &firstName, &lastName)
	if err != nil {
		h.sendErrorMessage(followerID, "User not found")
		return
	}

	// Query the follow relationship
	var status string
	var followID int
	err = h.db.QueryRow("SELECT id, status FROM follows WHERE follower_id = ? AND following_id = ?", followerID, targetUserID).Scan(&followID, &status)
	if err != nil && err != sql.ErrNoRows {
		h.sendErrorMessage(followerID, "Failed to check follow status")
		return
	}

	// Determine the follow status
	var followStatus string
	if err == sql.ErrNoRows {
		followStatus = "not_following"
	} else {
		// Map database status to API status
		switch status {
		case "accepted":
			followStatus = "following"
		case "pending":
			followStatus = "pending"
		default:
			followStatus = "not_following"
		}
	}

	// Check if the target user follows the current user back
	var isFollowedBy bool
	err = h.db.QueryRow("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'", targetUserID, followerID).Scan(new(int))
	if err == nil {
		isFollowedBy = true
	}

	// Send response to the requesting user
	h.SendToUser(followerID, Message{
		Type:   MessageTypeFollowUpdate,
		From:   0, // System message
		To:     followerID,
		Action: "status",
		Data: map[string]interface{}{
			"user_id":        targetUserID,
			"user_name":      firstName + " " + lastName,
			"status":         followStatus,
			"is_followed_by": isFollowedBy,
		},
		Timestamp: time.Now().Unix(),
	})
}

func (h *Hub) handleFollowUpdate(message Message) {
	// Send to the user being followed
	if message.To > 0 {
		h.handlePrivateMessage(message)
	}

	// Also broadcast to followers of both users for real-time updates
	h.mu.RLock()
	defer h.mu.RUnlock()

	// Get all users who might need updates (followers of both users)
	affectedUsers := make(map[uint]bool)

	// Add followers of the target user (they see follower count changes)
	for userID, client := range h.clients {
		client.mu.RLock()
		isFollowingTarget := client.Following[message.To]
		client.mu.RUnlock()

		if isFollowingTarget {
			affectedUsers[userID] = true
		}
	}

	// Add followers of the current user (they see following count changes)
	for userID, client := range h.clients {
		client.mu.RLock()
		isFollowingCurrent := client.Following[message.From]
		client.mu.RUnlock()

		if isFollowingCurrent {
			affectedUsers[userID] = true
		}
	}

	// Send updates to affected users
	for userID := range affectedUsers {
		if userID != message.From { // Don't send to the user who performed the action
			select {
			case h.clients[userID].Send <- message:
			default:
			}
		}
	}
}

func (h *Hub) handleFollow(message Message) {
	if h.db == nil {
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if target user exists and is public
	var isPrivate bool
	var firstName, lastName string
	err := h.db.QueryRow("SELECT is_private, first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&isPrivate, &firstName, &lastName)
	if err != nil {
		h.sendErrorMessage(followerID, "User not found")
		return
	}

	// If user is private, send error - should use follow_request instead
	if isPrivate {
		h.sendErrorMessage(followerID, "This user is private. Send a follow request instead")
		return
	}

	// Check if already following
	var existingID int
	err = h.db.QueryRow("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'", followerID, targetUserID).Scan(&existingID)
	if err == nil {
		h.sendErrorMessage(followerID, "Already following this user")
		return
	}

	// Create follow relationship
	now := time.Now()
	_, err = h.db.Exec("INSERT INTO follows (follower_id, following_id, status, created_at, updated_at) VALUES (?, ?, 'accepted', ?, ?)",
		followerID, targetUserID, now, now)
	if err != nil {
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

	// Send notification to target user (show follower's name, not receiver's)
	var followerFirstName, followerLastName string
	h.db.QueryRow("SELECT first_name, last_name FROM users WHERE id = ?", followerID).Scan(&followerFirstName, &followerLastName)

	h.SendToUser(targetUserID, Message{
		Type:   MessageTypeNotification,
		From:   followerID,
		To:     targetUserID,
		Action: "new_follower",
		Data: map[string]interface{}{
			"type":    "follow",
			"message": followerFirstName + " " + followerLastName + " started following you",
		},
		Timestamp: time.Now().Unix(),
	})

	// Broadcast follower count updates
	h.broadcastFollowerCountUpdate(followerID)
	h.broadcastFollowerCountUpdate(targetUserID)
}

func (h *Hub) handleUnfollow(message Message) {
	if h.db == nil {
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if currently following
	var followID int
	err := h.db.QueryRow("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'", followerID, targetUserID).Scan(&followID)
	if err != nil {
		h.sendErrorMessage(followerID, "Not following this user")
		return
	}

	// Remove follow relationship
	_, err = h.db.Exec("DELETE FROM follows WHERE id = ?", followID)
	if err != nil {
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
}

func (h *Hub) handleFollowRequest(message Message) {
	if h.db == nil {
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if target user exists
	var isPrivate bool
	var firstName, lastName string
	err := h.db.QueryRow("SELECT is_private, first_name, last_name FROM users WHERE id = ?", targetUserID).Scan(&isPrivate, &firstName, &lastName)
	if err != nil {
		h.sendErrorMessage(followerID, "User not found")
		return
	}

	// Check if already following or request exists
	var existingStatus string
	var existingID int
	err = h.db.QueryRow("SELECT id, status FROM follows WHERE follower_id = ? AND following_id = ?", followerID, targetUserID).Scan(&existingID, &existingStatus)
	if err == nil {
		switch existingStatus {
		case "accepted":
			h.sendErrorMessage(followerID, "Already following this user")
			return
		case "pending":
			h.sendErrorMessage(followerID, "Follow request already sent")
			return
		case "declined":
			// Allow resending declined requests by updating status to pending
			now := time.Now()
			_, err = h.db.Exec("UPDATE follows SET status = 'pending', updated_at = ? WHERE id = ?", now, existingID)
			if err != nil {
				h.sendErrorMessage(followerID, "Failed to resend follow request")
				return
			}
		default:
			h.sendErrorMessage(followerID, "Follow request exists")
			return
		}
	}

	// Determine status for new requests or resend
	now := time.Now()
	status := "pending"
	if !isPrivate {
		status = "accepted" // Auto-accept for public users
	}

	// Only insert if this is a new request (not resending declined)
	if existingStatus != "declined" {
		_, err = h.db.Exec("INSERT INTO follows (follower_id, following_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			followerID, targetUserID, status, now, now)
		if err != nil {
			h.sendErrorMessage(followerID, "Failed to send follow request")
			return
		}
	} else {
		// For resend, status is already set to pending above
		status = "pending"
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
}

func (h *Hub) handleCancelFollowRequest(message Message) {
	if h.db == nil {
		h.sendErrorMessage(message.From, "Database not available")
		return
	}

	targetUserID := message.To
	followerID := message.From

	if targetUserID == 0 {
		h.sendErrorMessage(followerID, "Invalid target user")
		return
	}

	// Check if pending request exists
	var followID int
	err := h.db.QueryRow("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'", followerID, targetUserID).Scan(&followID)
	if err != nil {
		h.sendErrorMessage(followerID, "No pending follow request found")
		return
	}

	// Delete the follow request
	_, err = h.db.Exec("DELETE FROM follows WHERE id = ?", followID)
	if err != nil {
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
}

func (h *Hub) handleGroupUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

func (h *Hub) handleEventUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

func (h *Hub) handlePollUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

func (h *Hub) handlePollVoteUpdate(message Message) {
	if message.GroupID > 0 {
		h.handleGroupMessage(message)
	}
}

func (h *Hub) handleSearch(message Message) {
	if h.db == nil {
		return
	}

	userID := message.From
	searchData, ok := message.Data.(map[string]interface{})
	if !ok {
		h.sendSearchResults(userID, []interface{}{}, "", 0)
		return
	}

	query, ok := searchData["query"].(string)
	if !ok || len(query) < 2 {
		// Send empty results for invalid queries
		h.sendSearchResults(userID, []interface{}{}, query, 0)
		return
	}

	// Perform basic search directly here to avoid import cycles
	suggestions := h.performBasicSearch(userID, query)

	// Convert to interface{} slice for JSON serialization
	results := make([]interface{}, len(suggestions))
	for i, s := range suggestions {
		results[i] = s
	}

	h.sendSearchResults(userID, results, query, len(results))
}

func (h *Hub) performBasicSearch(userID uint, query string) []map[string]interface{} {
	var results []map[string]interface{}

	// Simple user search
	userQuery := `
		SELECT id, first_name, last_name, email, avatar, nickname
		FROM users
		WHERE id != ? AND (
			LOWER(first_name) LIKE LOWER(?) OR
			LOWER(last_name) LIKE LOWER(?) OR
			LOWER(email) LIKE LOWER(?) OR
			LOWER(nickname) LIKE LOWER(?)
		)
		ORDER BY first_name, last_name
		LIMIT 3
	`

	pattern := "%" + query + "%"
	rows, err := h.db.Query(userQuery, userID, pattern, pattern, pattern, pattern)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id uint
			var firstName, lastName, email string
			var avatar, nickname sql.NullString

			if err := rows.Scan(&id, &firstName, &lastName, &email, &avatar, &nickname); err == nil {
				displayName := firstName + " " + lastName
				if nickname.Valid && nickname.String != "" {
					displayName = nickname.String
				}

				avatarStr := ""
				if avatar.Valid {
					avatarStr = avatar.String
				}

				results = append(results, map[string]interface{}{
					"type":     "user",
					"id":       id,
					"title":    displayName,
					"subtitle": email,
					"image":    avatarStr,
					"url":      "/profile/" + string(rune(id)),
				})
			}
		}
	}

	return results
}

func (h *Hub) sendSearchResults(userID uint, results []interface{}, query string, count int) {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if !exists {
		return
	}

	searchResultMessage := Message{
		Type:      MessageTypeSearchResults,
		From:      0, // System message
		To:        userID,
		Content:   query,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"results": results,
			"count":   count,
			"query":   query,
		},
	}

	select {
	case client.Send <- searchResultMessage:
	default:
	}
}

func (h *Hub) handleSharedPost(message Message) {
	// Shared posts are sent to specific recipients like private/group messages
	if message.GroupID > 0 {
		// Group shared post - broadcast to all group members except sender
		h.SendToGroup(message.GroupID, message, message.From)
	} else if message.To > 0 {
		// Private shared post - send to specific user
		h.SendToUser(message.To, message)
	}
}
