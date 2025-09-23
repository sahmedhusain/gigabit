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
	userService *services.UserService
}

func NewProfileHandler(db *sql.DB) *ProfileHandler {
	return &ProfileHandler{
		userService: services.NewUserService(db),
	}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request, userIDStr string) {

	//covert string to int
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	//get the requesting user id from context for privacy check
	requestingUserID, exists := r.Context().Value("user_id").(uint)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authorized")
		return
	}

	//get the user profile
	user, err := h.userService.GetUserByID(uint(userID))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	//check if the requesting user can view this profile (private account)
	canView, err := h.userService.CanViewProfile(requestingUserID, uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check profile privacy")
		return
	}

	if !canView {
		writeError(w, http.StatusForbidden, "Cannot view this profile")
		return
	}

	writeJSON(w, http.StatusOK, user)

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

	// Update fields if provided
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Bio != "" {
		user.AboutMe = &req.Bio
	}
	if req.AvatarURL != "" {
		user.Avatar = &req.AvatarURL
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

	// Get uploaded filename from request body
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

	// Update avatar
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

	// Parse the request body to get the desired privacy setting
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

	// If is_private is provided in request, use that value, otherwise toggle
	if request.IsPrivate != nil {
		user.IsPrivate = *request.IsPrivate
	} else {
		// Toggle privacy setting (backward compatibility)
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

	// Get current user ID for filtering
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

	// Convert to response format
	var userResponses []models.UserResponse
	for _, user := range users {
		userResponses = append(userResponses, user.ToResponse())
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users": userResponses,
		"count": len(userResponses),
	})
}
