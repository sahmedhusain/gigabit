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
	followService       *services.FollowService
	userService         *services.UserService
	notificationService *services.NotificationService
	hub                 *websocket.Hub
}

func NewFollowHandler(db *sql.DB, hub *websocket.Hub) *FollowHandler {
	return &FollowHandler{
		followService:       services.NewFollowService(db),
		userService:         services.NewUserService(db),
		notificationService: services.NewNotificationService(db, hub),
		hub:                 hub,
	}
}

func (h *FollowHandler) SendFollowRequest(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Extract target user ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/follow/")
	targetUserIDParam := strings.Split(path, "/")[0]
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

	// Send notification to the TARGET user (person being followed)
	if followRequest.Status == "pending" {
		// For private users: send follow request notification
		go h.notificationService.NotifyFollowRequest(currentUserID, uint(targetUserID))
	} else {
		// For public users: send "new follower" notification to the target
		// Note: We still use NotifyFollowRequest since it creates the right notification
		// (notifies the target that someone wants to follow them)
		go h.notificationService.NotifyFollowRequest(currentUserID, uint(targetUserID))
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

	if req.Action != "accept" && req.Action != "decline" {
		writeError(w, http.StatusBadRequest, "Action must be 'accept' or 'decline'")
		return
	}

	// Get the follow request
	followRequest, err := h.followService.GetFollowRelation(uint(followerID), currentUserID)
	if err != nil || followRequest == nil {
		writeError(w, http.StatusNotFound, "Follow request not found")
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

	// Send notification if request was accepted
	if req.Action == "accept" {
		go h.notificationService.NotifyFollowAccepted(uint(followerID), currentUserID)

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

	// Extract target user ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/unfollow/")
	targetUserIDParam := strings.Split(path, "/")[0]
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
