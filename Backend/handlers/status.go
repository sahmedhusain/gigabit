package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"social/services"
	"strconv"
	"strings"
	"time"
)

type StatusHandler struct {
	userService *services.UserService
	db          *sql.DB
}

func NewStatusHandler(db *sql.DB) *StatusHandler {
	return &StatusHandler{
		userService: services.NewUserService(db),
		db:          db,
	}
}

// StatusResponse represents the response structure for status operations
type StatusResponse struct {
	UserID           uint      `json:"user_id"`
	Status           string    `json:"status"`
	LastStatusChange time.Time `json:"last_status_change"`
	IsOnline         bool      `json:"is_online"`
}

// StatusUpdateRequest represents the request to update user status
type StatusUpdateRequest struct {
	Status string `json:"status"`
}

// GetUserStatus returns the current status of a user
func (h *StatusHandler) GetUserStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract user ID from URL path: /api/users/{id}/status
	path := strings.TrimPrefix(r.URL.Path, "/api/users/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 || parts[1] != "status" {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	userID, err := strconv.ParseUint(parts[0], 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get user status from database
	var status string
	var lastStatusChange time.Time
	query := `SELECT status, last_status_change FROM users WHERE id = ?`
	err = h.db.QueryRow(query, uint(userID)).Scan(&status, &lastStatusChange)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "User not found")
		} else {
			log.Printf("Failed to get user status: %v", err)
			writeError(w, http.StatusInternalServerError, "Failed to get user status")
		}
		return
	}

	// For invisible users, return offline status to others (except themselves)
	requestingUserID := r.Context().Value("user_id")
	displayStatus := status
	if status == "invisible" && requestingUserID != uint(userID) {
		displayStatus = "offline"
	}

	response := StatusResponse{
		UserID:           uint(userID),
		Status:           displayStatus,
		LastStatusChange: lastStatusChange,
		IsOnline:         status != "offline" && status != "invisible",
	}

	writeJSON(w, http.StatusOK, response)
}

// GetMyStatus returns the current status of the authenticated user
func (h *StatusHandler) GetMyStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get user status from database
	var status string
	var lastStatusChange time.Time
	query := `SELECT status, last_status_change FROM users WHERE id = ?`
	err := h.db.QueryRow(query, userID.(uint)).Scan(&status, &lastStatusChange)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "User not found")
		} else {
			log.Printf("Failed to get user status: %v", err)
			writeError(w, http.StatusInternalServerError, "Failed to get user status")
		}
		return
	}

	// Return the real status to the user themselves
	response := StatusResponse{
		UserID:           userID.(uint),
		Status:           status,
		LastStatusChange: lastStatusChange,
		IsOnline:         true, // If they're making a request, they're online
	}

	writeJSON(w, http.StatusOK, response)
}

// UpdateMyStatus updates the authenticated user's status
func (h *StatusHandler) UpdateMyStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req StatusUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"online":    true,
		"away":      true,
		"busy":      true,
		"invisible": true,
		"offline":   true,
	}

	if !validStatuses[req.Status] {
		writeError(w, http.StatusBadRequest, "Invalid status. Valid statuses are: online, away, busy, invisible, offline")
		return
	}

	// Update status in database
	query := `UPDATE users SET status = ?, last_status_change = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := h.db.Exec(query, req.Status, userID.(uint))
	if err != nil {
		log.Printf("Failed to update user status: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to update status")
		return
	}

	// Get updated status and timestamp
	var updatedStatus string
	var lastStatusChange time.Time
	query = `SELECT status, last_status_change FROM users WHERE id = ?`
	err = h.db.QueryRow(query, userID.(uint)).Scan(&updatedStatus, &lastStatusChange)
	if err != nil {
		log.Printf("Failed to get updated status: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to get updated status")
		return
	}

	log.Printf("User %d status updated to: %s", userID.(uint), updatedStatus)

	response := StatusResponse{
		UserID:           userID.(uint),
		Status:           updatedStatus,
		LastStatusChange: lastStatusChange,
		IsOnline:         true,
	}

	writeJSON(w, http.StatusOK, response)
}

// GetOnlineUsers returns a list of all online users with their statuses
func (h *StatusHandler) GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	requestingUserID := r.Context().Value("user_id")
	if requestingUserID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get all users with their current status (exclude offline and invisible users for others)
	query := `
		SELECT u.id, u.first_name, u.last_name, u.nickname, u.avatar, u.status, u.last_status_change
		FROM users u 
		WHERE u.status IN ('online', 'away', 'busy') 
		   OR (u.status = 'invisible' AND u.id = ?)
		ORDER BY u.last_status_change DESC
	`

	rows, err := h.db.Query(query, requestingUserID.(uint))
	if err != nil {
		log.Printf("Failed to get online users: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to get online users")
		return
	}
	defer rows.Close()

	var onlineUsers []map[string]interface{}
	for rows.Next() {
		var userID uint
		var firstName, lastName string
		var nickname, avatar *string
		var status string
		var lastStatusChange time.Time

		err := rows.Scan(&userID, &firstName, &lastName, &nickname, &avatar, &status, &lastStatusChange)
		if err != nil {
			log.Printf("Failed to scan user row: %v", err)
			continue
		}

		// For invisible users, show them their real status but show as offline to others
		displayStatus := status
		if status == "invisible" && userID != requestingUserID.(uint) {
			displayStatus = "offline"
		}

		user := map[string]interface{}{
			"user_id":            userID,
			"first_name":         firstName,
			"last_name":          lastName,
			"nickname":           nickname,
			"avatar":             avatar,
			"status":             displayStatus,
			"last_status_change": lastStatusChange.Format(time.RFC3339),
			"is_online":          status != "offline",
		}

		onlineUsers = append(onlineUsers, user)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"online_users": onlineUsers,
		"count":        len(onlineUsers),
	})
}
