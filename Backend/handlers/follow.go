package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gigabit/models"
	"gigabit/services"
	"gigabit/websocket"
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
	if currentUserID == uint(targetUserID) {
		writeError(w, http.StatusBadRequest, "Cannot follow yourself")
		return
	}

	targetUser, err := h.userService.GetUserByID(uint(targetUserID))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if targetUser.IsDeleted {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}
	var followRequest *models.Follow
	existingFollow, err := h.followService.GetFollowRelation(currentUserID, uint(targetUserID))
	if err == nil && existingFollow != nil {
		switch existingFollow.Status {
		case "accepted":
			writeError(w, http.StatusConflict, "Already following this user")
			return
		case "pending":
			writeError(w, http.StatusConflict, "Follow request already sent")
			return
		default:
			existingFollow.Status = "pending"
			if err := h.followService.UpdateFollowRequest(existingFollow); err != nil {
				writeError(w, http.StatusInternalServerError, "Failed to resend follow request")
				return
			}
			followRequest = existingFollow
		}
	} else {
		followRequest = &models.Follow{
			FollowerID:  currentUserID,
			FollowingID: uint(targetUserID),
			Status:      "pending",
		}

		if !targetUser.IsPrivate {
			followRequest.Status = "accepted"
		}

		if err := h.followService.CreateFollowRequest(followRequest); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to send follow request")
			return
		}
	}

	if followRequest.Status == "pending" {
		go h.notificationService.NotifyFollowRequest(currentUserID, uint(targetUserID))
	} else {
		go h.notificationService.NotifyFollowRequest(currentUserID, uint(targetUserID))
	}

	message := "Follow request sent"
	if !targetUser.IsPrivate {
		message = "Now following user"
		if h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:      websocket.MessageTypeFollowerCountUpdate,
				From:      0,
				Action:    "count_update",
				Data:      h.getFollowerCounts(currentUserID, uint(targetUserID)),
				Timestamp: time.Now().Unix(),
			})
		}
	}

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
				"is_followed_by":         false,
				"is_following_back":      false,
				"follower_first_name":    "",
				"follower_last_name":     "",
				"follower_nickname":      "",
				"follower_email":         "",
				"follower_avatar":        "",
				"follower_is_private":    false,
				"follower_created_at":    "",
				"follower_about_me":      "",
				"follower_date_of_birth": "",
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

	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
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

	followRequest, err := h.followService.GetFollowRelation(uint(followerID), currentUserID)
	if err != nil || followRequest == nil {
		writeError(w, http.StatusNotFound, "Follow relationship not found")
		return
	}

	if req.Action == "remove" {
		if err := h.followService.DeleteFollowRequest(followRequest.ID); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to remove follower")
			return
		}

		if h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:      websocket.MessageTypeFollowerCountUpdate,
				From:      0,
				Action:    "count_update",
				Data:      h.getFollowerCounts(uint(followerID), currentUserID),
				Timestamp: time.Now().Unix(),
			})
		}

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
					"first_name":             "",
					"last_name":              "",
					"nickname":               "",
					"email":                  "",
					"avatar":                 "",
					"is_private":             false,
					"created_at":             "",
					"about_me":               "",
					"date_of_birth":          "",
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

	if req.Action == "accept" {
		followRequest.Status = "accepted"
	} else {
		followRequest.Status = "declined"
	}

	if err := h.followService.UpdateFollowRequest(followRequest); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update follow request")
		return
	}

	if req.Action == "accept" {
		go h.notificationService.NotifyFollowAccepted(uint(followerID), currentUserID)

		if h.hub != nil {
			h.hub.BroadcastMessage(websocket.Message{
				Type:      websocket.MessageTypeFollowerCountUpdate,
				From:      0,
				Action:    "count_update",
				Data:      h.getFollowerCounts(uint(followerID), currentUserID),
				Timestamp: time.Now().Unix(),
			})
		}

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
					"is_followed_by":         true,
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

	followRequest, err := h.followService.GetFollowRelation(currentUserID, uint(targetUserID))
	if err != nil || followRequest == nil {
		writeError(w, http.StatusNotFound, "Not following this user")
		return
	}

	if err := h.followService.DeleteFollowRequest(followRequest.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to unfollow user")
		return
	}

	if h.hub != nil {
		h.hub.BroadcastMessage(websocket.Message{
			Type:      websocket.MessageTypeFollowerCountUpdate,
			From:      0,
			Action:    "count_update",
			Data:      h.getFollowerCounts(currentUserID, uint(targetUserID)),
			Timestamp: time.Now().Unix(),
		})

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
					"follower_first_name":    "",
					"follower_last_name":     "",
					"follower_nickname":      "",
					"follower_email":         "",
					"follower_avatar":        "",
					"follower_is_private":    false,
					"follower_created_at":    "",
					"follower_about_me":      "",
					"follower_date_of_birth": "",
				},
				Timestamp: time.Now().Unix(),
			})
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Successfully unfollowed user"})
}

func (h *FollowHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
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

func (h *FollowHandler) getFollowerCounts(userIDs ...uint) map[string]interface{} {
	counts := make(map[string]interface{})

	for _, userID := range userIDs {
		followersCount, followingCount, err := h.followService.GetFollowCounts(userID)
		if err != nil {
			continue 
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

	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	targetUserIDParam := strings.Split(path, "/")[0]
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	if currentUserID == uint(targetUserID) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"is_following":   false,
			"is_pending":     false,
			"is_followed_by": false,
			"status":         "self",
		})
		return
	}

	status, err := h.followService.GetFollowStatus(currentUserID, uint(targetUserID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get follow status")
		return
	}

	reverseStatus, err := h.followService.GetFollowStatus(uint(targetUserID), currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get reverse follow status")
		return
	}

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
