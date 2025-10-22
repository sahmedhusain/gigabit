package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"social/middleware"
	"social/models"
	"social/services"
	"social/utils"
	"social/websocket"
)

type UserHandler struct {
	userService *services.UserService
	db          *sql.DB
	hub         *websocket.Hub
}

func NewUserHandler(db *sql.DB, hub *websocket.Hub) *UserHandler {
	return &UserHandler{
		userService: services.NewUserService(db),
		db:          db,
		hub:         hub,
	}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request, userIDParam string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := h.userService.GetUserByID(uint(userID))
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.GetUserByID(userID)
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
	if req.Email != "" {
		// Check if email is already taken by another user
		existingUser, err := h.userService.GetUserByEmail(req.Email)
		if err == nil && existingUser != nil && existingUser.ID != userID {
			writeError(w, http.StatusConflict, "Email already in use")
			return
		}
		user.Email = req.Email
	}
	if req.Nickname != "" {
		// Check if nickname is already taken by another user
		existingUser, err := h.userService.GetUserByNickname(req.Nickname)
		if err == nil && existingUser != nil && existingUser.ID != userID {
			writeError(w, http.StatusConflict, "Nickname already in use")
			return
		}
		user.Nickname = &req.Nickname
	}
	if req.DateOfBirth != "" {
		user.DateOfBirth = req.DateOfBirth
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
	if req.Gender != "" {
		user.Gender = &req.Gender
	}

	if err := h.userService.UpdateUser(user); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeError(w, http.StatusBadRequest, "Search query is required")
		return
	}

	users, err := h.userService.SearchUsers(query, 20)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to search users")
		return
	}

	var responses []models.UserResponse
	for _, user := range users {
		responses = append(responses, user.ToResponse())
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"users": responses})
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get all users except the current user
	query := `
		SELECT id, email, first_name, last_name, avatar, nickname, is_private
		FROM users 
		WHERE id != ? 
		ORDER BY first_name, last_name
		LIMIT 50
		`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get users")
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var user struct {
			ID        uint    `json:"id"`
			Email     string  `json:"email"`
			FirstName string  `json:"first_name"`
			LastName  string  `json:"last_name"`
			Avatar    *string `json:"avatar"`
			Nickname  *string `json:"nickname"`
			IsPrivate bool    `json:"is_private"`
		}

		err := rows.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname, &user.IsPrivate)
		if err != nil {
			continue
		}

		displayName := user.FirstName + " " + user.LastName
		if user.Nickname != nil && *user.Nickname != "" {
			displayName = *user.Nickname + " (" + displayName + ")"
		}

		users = append(users, map[string]interface{}{
			"id":           user.ID,
			"first_name":   user.FirstName,
			"last_name":    user.LastName,
			"email":        user.Email,
			"avatar":       user.Avatar,
			"nickname":     user.Nickname,
			"display_name": displayName,
			"is_private":   user.IsPrivate,
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}

func (h *UserHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"online":    true,
		"invisible": true,
		"busy":      true,
		"away":      true,
		"offline":   true,
	}
	if !validStatuses[req.Status] {
		writeError(w, http.StatusBadRequest, "Invalid status. Must be one of: online, invisible, busy, away, offline")
		return
	}

	if err := h.userService.UpdateUserStatus(userID, req.Status); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update status")
		return
	}

	// Determine what status to broadcast to other users
	broadcastStatus := req.Status
	if req.Status == "invisible" {
		// If user is going invisible, broadcast offline status instead
		broadcastStatus = "offline"
	}

	// Broadcast status change to all connected clients via WebSocket
	h.hub.BroadcastUserStatus(userID, broadcastStatus)

	// Get updated user
	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get updated user")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *UserHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	// Verify password
	if !utils.CheckPassword(req.Password, user.Password) {
		writeError(w, http.StatusUnauthorized, "Incorrect password")
		return
	}

	// Delete user (this will cascade delete related data if foreign keys are set)
	if err := h.userService.DeleteUser(userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete account")
		return
	}

	// Delete sessions
	h.db.Exec("DELETE FROM sessions WHERE user_id = ?", userID)

	writeJSON(w, http.StatusOK, map[string]string{"message": "Account deleted successfully"})
}

func (h *UserHandler) TogglePrivacy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		IsPrivate bool `json:"is_private"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	user.IsPrivate = req.IsPrivate
	if err := h.userService.UpdateUser(user); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update privacy")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}
