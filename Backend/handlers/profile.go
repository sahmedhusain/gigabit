package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"social/models"
	"social/services"
)

type ProfileHandler struct {
	userService   *services.UserService
	followService *services.FollowService
}

func NewProfileHandler(db *sql.DB) *ProfileHandler {
	return &ProfileHandler{
		userService:   services.NewUserService(db),
		followService: services.NewFollowService(db),
	}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request, userIDStr string) {
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	requestingUserID, exists := r.Context().Value("user_id").(uint)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authorized")
		return
	}

	user, err := h.userService.GetUserByID(uint(userID))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if user.IsDeleted {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":         user.ID,
			"is_deleted": true,
			"message":    "This account has been deleted",
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		})
		return
	}

	canView, err := h.userService.CanViewProfile(requestingUserID, uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check profile privacy")
		return
	}

	// If cannot view private profile, return limited public information
	if !canView {
		// Get follow status to show if there's a pending request
		followStatus := "not_following"
		followRelation, _ := h.followService.GetFollowRelation(requestingUserID, uint(userID))
		if followRelation != nil {
			switch followRelation.Status {
			case "accepted":
				followStatus = "following"
			case "pending":
				followStatus = "pending"
			}
		}

		// Return limited profile with privacy flag
		limitedProfile := map[string]interface{}{
			"id":            user.ID,
			"first_name":    user.FirstName,
			"last_name":     user.LastName,
			"nickname":      user.Nickname,
			"avatar":        user.Avatar,
			"is_private":    user.IsPrivate,
			"created_at":    user.CreatedAt,
			"can_view":      false,
			"follow_status": followStatus,
			"message":       "This profile is private",
		}
		writeJSON(w, http.StatusOK, limitedProfile)
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Bio != "" {
		user.AboutMe = &req.Bio
	}
	if req.AvatarURL != nil {
		if *req.AvatarURL != "" {
			user.Avatar = req.AvatarURL
		} else {
			user.Avatar = nil
		}
	}

	if err := h.userService.UpdateUser(user); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *ProfileHandler) UpdateProfileImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		Filename string `json:"filename"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Filename == "" {
		writeError(w, http.StatusBadRequest, "Filename is required")
		return
	}

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	user.Avatar = &req.Filename

	if err := h.userService.UpdateUser(user); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update profile image")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Profile image updated successfully",
		"avatar":  user.Avatar,
	})
}

func (h *ProfileHandler) TogglePrivacy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var request struct {
		IsPrivate *bool `json:"is_private,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if request.IsPrivate != nil {
		user.IsPrivate = *request.IsPrivate
	} else {
		user.IsPrivate = !user.IsPrivate
	}

	if err := h.userService.UpdateUser(user); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update privacy setting")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Privacy setting updated successfully",
		"is_private": user.IsPrivate,
		"user":       user.ToResponse(),
	})
}

func (h *ProfileHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeError(w, http.StatusBadRequest, "Search query required")
		return
	}

	currentUserID := r.Context().Value("user_id")
	if currentUserID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	users, err := h.userService.SearchUsers(query, currentUserID.(uint))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to search users")
		return
	}

	var userResponses []models.UserResponse
	for _, user := range users {
		userResponses = append(userResponses, user.ToResponse())
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users": userResponses,
		"count": len(userResponses),
	})
}

func (h *ProfileHandler) GetPublicStats(w http.ResponseWriter, r *http.Request, userIDStr string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := h.userService.GetUserByID(uint(userID))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if user.IsDeleted {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"user_id":         user.ID,
			"display_name":    "Deleted Account",
			"follower_count":  0,
			"following_count": 0,
			"is_deleted":      true,
		})
		return
	}

	followers, following, err := h.followService.GetFollowCounts(uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get follow counts")
		return
	}

	response := map[string]interface{}{
		"user_id":         user.ID,
		"display_name":    user.FirstName + " " + user.LastName,
		"follower_count":  followers,
		"following_count": following,
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *ProfileHandler) CheckEmailUniqueness(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	email := r.URL.Query().Get("email")
	if email == "" {
		writeError(w, http.StatusBadRequest, "Email parameter is required")
		return
	}

	// Check if email exists
	existingUser, err := h.userService.GetUserByEmail(email)
	if err != nil {
		// If user not found, email is available
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"available": true,
		})
		return
	}

	if existingUser.IsDeleted {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"available": true,
		})
		return
	}

	userID := r.Context().Value("user_id")
	if userID != nil {
		currentUser, err := h.userService.GetUserByID(userID.(uint))
		if err == nil && currentUser.Email == email {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"available": true,
			})
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"available": false,
		"message":   "User with this email already exists",
	})
}

func (h *ProfileHandler) CheckNicknameUniqueness(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	nickname := r.URL.Query().Get("nickname")
	if nickname == "" {
		writeError(w, http.StatusBadRequest, "Nickname parameter is required")
		return
	}

	// Check if nickname exists
	existingUser, err := h.userService.GetUserByNickname(nickname)
	if err != nil {
		// If user not found, nickname is available
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"available": true,
		})
		return
	}

	if existingUser.IsDeleted {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"available": true,
		})
		return
	}

	userID := r.Context().Value("user_id")
	if userID != nil {
		currentUser, err := h.userService.GetUserByID(userID.(uint))
		if err == nil && currentUser.Nickname != nil && *currentUser.Nickname == nickname {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"available": true,
			})
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"available": false,
		"message":   "User with this nickname already exists",
	})
}
