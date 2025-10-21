package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"social/models"
	"social/services"
	"social/websocket"
)

type FollowHandler struct {
	followService *services.FollowService
	userService   *services.UserService
	hub           *websocket.Hub
}

func NewFollowHandler(db *sql.DB, hub *websocket.Hub) *FollowHandler {
	return &FollowHandler{
		followService: services.NewFollowService(db),
		userService:   services.NewUserService(db),
		hub:           hub,
	}
}

func (h *FollowHandler) SendFollowRequest(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Extract target user ID from URL path - route is /api/users/{userId}/follow
	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	parts := strings.Split(path, "/")
	if len(parts) < 1 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}
	targetUserIDParam := parts[0]
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check if trying to follow themselves
	if currentUserID == uint(targetUserID) {
		writeError(w, http.StatusBadRequest, "Cannot follow yourself")
		return
	}

	// Check if target user exists
	targetUser, err := h.userService.GetUserByID(uint(targetUserID))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	// Check if already following or request exists
	existingFollow, err := h.followService.GetFollowRelation(currentUserID, uint(targetUserID))
	if err == nil && existingFollow != nil {
		switch existingFollow.Status {
		case "accepted":
			writeError(w, http.StatusConflict, "Already following this user")
		case "pending":
			writeError(w, http.StatusConflict, "Follow request already sent")
		default:
			writeError(w, http.StatusConflict, "Follow request exists")
		}
		return
	}

	// Create follow request
	followRequest := &models.Follow{
		FollowerID:  currentUserID,
		FollowingID: uint(targetUserID),
		Status:      "pending",
	}

	// If target user has public profile, auto-accept
	if !targetUser.IsPrivate {
		followRequest.Status = "accepted"
	}

	if err := h.followService.CreateFollowRequest(followRequest); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to send follow request")
		return
	}

	message := "Follow request sent"
	if !targetUser.IsPrivate {
		message = "Now following user"
		// Broadcast follower count updates for accepted follows
		if h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:      websocket.MessageTypeFollowerCountUpdate,
				From:      0, // System message
				Action:    "count_update",
				Data:      h.getFollowerCounts(currentUserID, uint(targetUserID)),
				Timestamp: time.Now().Unix(),
			})
		}
	}

	// Broadcast follow update message
	if h.hub != nil {
		h.hub.BroadcastMessage(websocket.Message{
			Type:   websocket.MessageTypeFollowUpdate,
			From:   currentUserID,
			To:     uint(targetUserID),
			Action: "follow",
			Data: map[string]interface{}{
				"action":                 "follow",
				"follower_id":            currentUserID,
				"user_id":                targetUserID,
				"first_name":             targetUser.FirstName,
				"last_name":              targetUser.LastName,
				"nickname":               targetUser.Nickname,
				"email":                  targetUser.Email,
				"avatar":                 targetUser.Avatar,
				"is_private":             targetUser.IsPrivate,
				"created_at":             targetUser.CreatedAt,
				"about_me":               targetUser.AboutMe,
				"date_of_birth":          targetUser.DateOfBirth,
				"updated_at":             time.Now(),
				"is_followed_by":         false, // Will be updated if there's a follow back
				"is_following_back":      false, // Will be updated if there's a follow back
				"follower_first_name":    "",    // Not needed for follow action
				"follower_last_name":     "",    // Not needed for follow action
				"follower_nickname":      "",    // Not needed for follow action
				"follower_email":         "",    // Not needed for follow action
				"follower_avatar":        "",    // Not needed for follow action
				"follower_is_private":    false, // Not needed for follow action
				"follower_created_at":    "",    // Not needed for follow action
				"follower_about_me":      "",    // Not needed for follow action
				"follower_date_of_birth": "",    // Not needed for follow action
			},
			Timestamp: time.Now().Unix(),
		})
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": message,
		"status":  followRequest.Status,
	})
}

func (h *FollowHandler) RespondToFollowRequest(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Extract follower ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/users/") // full path is /api/users/{userId}/follow
	parts := strings.Split(path, "/")
	if len(parts) < 1 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}
	followerIDParam := parts[0]
	followerID, err := strconv.ParseUint(followerIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req struct {
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Action != "accept" && req.Action != "decline" && req.Action != "remove" {
		writeError(w, http.StatusBadRequest, "Action must be 'accept', 'decline', or 'remove'")
		return
	}

	// Get the follow request
	followRequest, err := h.followService.GetFollowRelation(uint(followerID), currentUserID)
	if err != nil || followRequest == nil {
		writeError(w, http.StatusNotFound, "Follow relationship not found")
		return
	}

	// Handle different actions
	if req.Action == "remove" {
		// Remove follower - delete the relationship regardless of status
		if err := h.followService.DeleteFollowRequest(followRequest.ID); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to remove follower")
			return
		}

		// Broadcast follower count updates
		if h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:      websocket.MessageTypeFollowerCountUpdate,
				From:      0, // System message
				Action:    "count_update",
				Data:      h.getFollowerCounts(uint(followerID), currentUserID),
				Timestamp: time.Now().Unix(),
			})
		}

		// Get follower user details for the follow update message
		followerUser, err := h.userService.GetUserByID(uint(followerID))
		if err == nil && h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:   websocket.MessageTypeFollowUpdate,
				From:   uint(followerID),
				To:     currentUserID,
				Action: "unfollow",
				Data: map[string]interface{}{
					"action":                 "unfollow",
					"follower_id":            followerID,
					"user_id":                currentUserID,
					"first_name":             "",    // Not needed for unfollow from followers list
					"last_name":              "",    // Not needed for unfollow from followers list
					"nickname":               "",    // Not needed for unfollow from followers list
					"email":                  "",    // Not needed for unfollow from followers list
					"avatar":                 "",    // Not needed for unfollow from followers list
					"is_private":             false, // Not needed for unfollow from followers list
					"created_at":             "",    // Not needed for unfollow from followers list
					"about_me":               "",    // Not needed for unfollow from followers list
					"date_of_birth":          "",    // Not needed for unfollow from followers list
					"updated_at":             time.Now(),
					"is_followed_by":         false,
					"is_following_back":      false,
					"follower_first_name":    followerUser.FirstName,
					"follower_last_name":     followerUser.LastName,
					"follower_nickname":      followerUser.Nickname,
					"follower_email":         followerUser.Email,
					"follower_avatar":        followerUser.Avatar,
					"follower_is_private":    followerUser.IsPrivate,
					"follower_created_at":    followerUser.CreatedAt,
					"follower_about_me":      followerUser.AboutMe,
					"follower_date_of_birth": followerUser.DateOfBirth,
				},
				Timestamp: time.Now().Unix(),
			})
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Follower removed successfully",
			"status":  "removed",
		})
		return
	}

	if followRequest.Status != "pending" {
		writeError(w, http.StatusBadRequest, "Follow request not pending")
		return
	}

	// Update follow request status
	if req.Action == "accept" {
		followRequest.Status = "accepted"
	} else {
		followRequest.Status = "declined"
	}

	if err := h.followService.UpdateFollowRequest(followRequest); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update follow request")
		return
	}

	// Broadcast follower count updates if request was accepted
	if req.Action == "accept" && h.hub != nil {
		h.hub.BroadcastMessage(websocket.Message{
			Type:      websocket.MessageTypeFollowerCountUpdate,
			From:      0, // System message
			Action:    "count_update",
			Data:      h.getFollowerCounts(uint(followerID), currentUserID),
			Timestamp: time.Now().Unix(),
		})

		// Get user details for the follow update message
		followerUser, err := h.userService.GetUserByID(uint(followerID))
		currentUserDetails, err2 := h.userService.GetUserByID(currentUserID)
		if err == nil && err2 == nil && h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:   websocket.MessageTypeFollowUpdate,
				From:   uint(followerID),
				To:     currentUserID,
				Action: "follow",
				Data: map[string]interface{}{
					"action":                 "follow",
					"follower_id":            followerID,
					"user_id":                currentUserID,
					"first_name":             currentUserDetails.FirstName,
					"last_name":              currentUserDetails.LastName,
					"nickname":               currentUserDetails.Nickname,
					"email":                  currentUserDetails.Email,
					"avatar":                 currentUserDetails.Avatar,
					"is_private":             currentUserDetails.IsPrivate,
					"created_at":             currentUserDetails.CreatedAt,
					"about_me":               currentUserDetails.AboutMe,
					"date_of_birth":          currentUserDetails.DateOfBirth,
					"updated_at":             time.Now(),
					"is_followed_by":         true,  // Since this is an accept, the current user is being followed
					"is_following_back":      false, // Check if current user follows back
					"follower_first_name":    followerUser.FirstName,
					"follower_last_name":     followerUser.LastName,
					"follower_nickname":      followerUser.Nickname,
					"follower_email":         followerUser.Email,
					"follower_avatar":        followerUser.Avatar,
					"follower_is_private":    followerUser.IsPrivate,
					"follower_created_at":    followerUser.CreatedAt,
					"follower_about_me":      followerUser.AboutMe,
					"follower_date_of_birth": followerUser.DateOfBirth,
				},
				Timestamp: time.Now().Unix(),
			})
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Follow request " + req.Action + "ed",
		"status":  followRequest.Status,
	})
}

func (h *FollowHandler) Unfollow(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Extract target user ID from URL path - route is /api/users/{userId}/follow
	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	parts := strings.Split(path, "/")
	if len(parts) < 1 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}
	targetUserIDParam := parts[0]
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get the follow relation
	followRequest, err := h.followService.GetFollowRelation(currentUserID, uint(targetUserID))
	if err != nil || followRequest == nil {
		writeError(w, http.StatusNotFound, "Not following this user")
		return
	}

	// Delete the follow relation
	if err := h.followService.DeleteFollowRequest(followRequest.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to unfollow user")
		return
	}

	// Broadcast follower count updates
	if h.hub != nil {
		h.hub.BroadcastMessage(websocket.Message{
			Type:      websocket.MessageTypeFollowerCountUpdate,
			From:      0, // System message
			Action:    "count_update",
			Data:      h.getFollowerCounts(currentUserID, uint(targetUserID)),
			Timestamp: time.Now().Unix(),
		})

		// Get target user details for the follow update message
		targetUserDetails, err := h.userService.GetUserByID(uint(targetUserID))
		if err == nil && h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:   websocket.MessageTypeFollowUpdate,
				From:   currentUserID,
				To:     uint(targetUserID),
				Action: "unfollow",
				Data: map[string]interface{}{
					"action":                 "unfollow",
					"follower_id":            currentUserID,
					"user_id":                targetUserID,
					"first_name":             targetUserDetails.FirstName,
					"last_name":              targetUserDetails.LastName,
					"nickname":               targetUserDetails.Nickname,
					"email":                  targetUserDetails.Email,
					"avatar":                 targetUserDetails.Avatar,
					"is_private":             targetUserDetails.IsPrivate,
					"created_at":             targetUserDetails.CreatedAt,
					"about_me":               targetUserDetails.AboutMe,
					"date_of_birth":          targetUserDetails.DateOfBirth,
					"updated_at":             time.Now(),
					"is_followed_by":         false,
					"is_following_back":      false,
					"follower_first_name":    "",    // Not needed for unfollow action
					"follower_last_name":     "",    // Not needed for unfollow action
					"follower_nickname":      "",    // Not needed for unfollow action
					"follower_email":         "",    // Not needed for unfollow action
					"follower_avatar":        "",    // Not needed for unfollow action
					"follower_is_private":    false, // Not needed for unfollow action
					"follower_created_at":    "",    // Not needed for unfollow action
					"follower_about_me":      "",    // Not needed for unfollow action
					"follower_date_of_birth": "",    // Not needed for unfollow action
				},
				Timestamp: time.Now().Unix(),
			})
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Successfully unfollowed user"})
}

func (h *FollowHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	pathParts := strings.Split(path, "/")
	if len(pathParts) < 2 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}
	userIDParam := pathParts[0]
	userID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if current user can view this profile
	canView, err := h.userService.CanViewProfile(currentUserID, uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check permissions")
		return
	}

	if !canView {
		writeError(w, http.StatusForbidden, "Cannot view this user's followers")
		return
	}

	followers, err := h.followService.GetFollowers(uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get followers")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"followers": followers,
		"count":     len(followers),
	})
}

func (h *FollowHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	pathParts := strings.Split(path, "/")
	if len(pathParts) < 2 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}
	userIDParam := pathParts[0]
	userID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if current user can view this profile
	canView, err := h.userService.CanViewProfile(currentUserID, uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check permissions")
		return
	}

	if !canView {
		writeError(w, http.StatusForbidden, "Cannot view this user's following list")
		return
	}

	following, err := h.followService.GetFollowing(uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get following list")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"following": following,
		"count":     len(following),
	})
}

func (h *FollowHandler) GetFollowRequests(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	requests, err := h.followService.GetPendingFollowRequests(currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get follow requests")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"count":    len(requests),
	})
}

func (h *FollowHandler) GetOutgoingFollowRequests(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	requests, err := h.followService.GetOutgoingFollowRequests(currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get outgoing follow requests")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"count":    len(requests),
	})
}

// getFollowerCounts returns follower counts for multiple users
func (h *FollowHandler) getFollowerCounts(userIDs ...uint) map[string]interface{} {
	counts := make(map[string]interface{})

	for _, userID := range userIDs {
		followersCount, followingCount, err := h.followService.GetFollowCounts(userID)
		if err != nil {
			continue // Skip on error
		}

		counts[fmt.Sprintf("user_%d", userID)] = map[string]interface{}{
			"user_id":         userID,
			"followers_count": followersCount,
			"following_count": followingCount,
		}
	}

	return counts
}

func (h *FollowHandler) GetFollowStatus(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Extract target user ID from URL path - route is /api/users/{userId}/follow-status
	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	targetUserIDParam := strings.Split(path, "/")[0]
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check if trying to get status for themselves
	if currentUserID == uint(targetUserID) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"is_following":   false,
			"is_pending":     false,
			"is_followed_by": false,
			"status":         "self",
		})
		return
	}

	// Get follow status from current user to target user
	status, err := h.followService.GetFollowStatus(currentUserID, uint(targetUserID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get follow status")
		return
	}

	// Get follow status from target user to current user (follow back)
	reverseStatus, err := h.followService.GetFollowStatus(uint(targetUserID), currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get reverse follow status")
		return
	}

	// Determine response based on statuses
	var isFollowing, isPending, isFollowedBy bool
	var responseStatus string

	switch status {
	case "accepted":
		isFollowing = true
		isPending = false
		responseStatus = "following"
	case "pending":
		isFollowing = false
		isPending = true
		responseStatus = "pending"
	default:
		isFollowing = false
		isPending = false
		responseStatus = "not_following"
	}

	// Check if target user follows current user back
	if reverseStatus == "accepted" {
		isFollowedBy = true
		if isFollowing {
			responseStatus = "follow_back"
		}
	} else {
		isFollowedBy = false
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"is_following":   isFollowing,
		"is_pending":     isPending,
		"is_followed_by": isFollowedBy,
		"status":         responseStatus,
	})
}
