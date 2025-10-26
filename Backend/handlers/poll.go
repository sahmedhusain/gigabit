package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social/models"
	"social/services"
	"social/websocket"
	"strconv"
	"strings"
)

type PollHandler struct {
	pollService         *services.PollService
	notificationService *services.NotificationService
}

func NewPollHandler(db *sql.DB, hub *websocket.Hub) *PollHandler {
	return &PollHandler{
		pollService:         services.NewPollService(db, hub),
		notificationService: services.NewNotificationService(db, hub),
	}
}

// CreatePoll handles POST /api/polls
func (h *PollHandler) CreatePoll(w http.ResponseWriter, r *http.Request, userID uint) {
	var req models.CreatePollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate
	if strings.TrimSpace(req.Title) == "" {
		http.Error(w, "Poll title is required", http.StatusBadRequest)
		return
	}

	if req.GroupID == nil || *req.GroupID == 0 {
		http.Error(w, "Polls can only be created in groups", http.StatusBadRequest)
		return
	}

	if len(req.Options) < 2 {
		http.Error(w, "Poll must have at least 2 options", http.StatusBadRequest)
		return
	}

	poll, err := h.pollService.CreatePoll(userID, &req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Send notification to group members (same as events)
	h.notificationService.NotifyGroupPollCreated(userID, *req.GroupID, poll.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(poll)
}

// GetPoll handles GET /api/polls/{id}
func (h *PollHandler) GetPoll(w http.ResponseWriter, r *http.Request, userID uint) {
	// Extract poll ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	pollID, err := strconv.ParseUint(pathParts[3], 10, 32)
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	poll, err := h.pollService.GetPollByID(uint(pollID), userID)
	if err != nil {
		if err.Error() == "poll not found" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(poll)
}

// GetGroupPolls handles GET /api/groups/{id}/polls
func (h *PollHandler) GetGroupPolls(w http.ResponseWriter, r *http.Request, userID uint) {
	// Extract group ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.ParseUint(pathParts[3], 10, 32)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Get limit and offset from query params
	limit := 20
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	polls, err := h.pollService.GetGroupPolls(uint(groupID), userID, limit, offset)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(polls)
}

// VotePoll handles POST /api/polls/{id}/vote
func (h *PollHandler) VotePoll(w http.ResponseWriter, r *http.Request, userID uint) {
	// Extract poll ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	pollID, err := strconv.ParseUint(pathParts[3], 10, 32)
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	var req models.VotePollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.OptionIDs) == 0 {
		http.Error(w, "At least one option must be selected", http.StatusBadRequest)
		return
	}

	err = h.pollService.VotePoll(uint(pollID), userID, req.OptionIDs)
	if err != nil {
		if err.Error() == "poll not found" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		if err.Error() == "poll has expired" || err.Error() == "poll does not allow multiple choices" || strings.HasPrefix(err.Error(), "invalid option ID") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Return updated poll
	poll, err := h.pollService.GetPollByID(uint(pollID), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(poll)
}

// UnvotePoll handles DELETE /api/polls/{id}/vote
func (h *PollHandler) UnvotePoll(w http.ResponseWriter, r *http.Request, userID uint) {
	// Extract poll ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	pollID, err := strconv.ParseUint(pathParts[3], 10, 32)
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	err = h.pollService.UnvotePoll(uint(pollID), userID)
	if err != nil {
		if err.Error() == "no votes found to remove" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Return updated poll
	poll, err := h.pollService.GetPollByID(uint(pollID), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(poll)
}

// DeletePoll handles DELETE /api/polls/{id}
func (h *PollHandler) DeletePoll(w http.ResponseWriter, r *http.Request, userID uint) {
	// Extract poll ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	pollID, err := strconv.ParseUint(pathParts[3], 10, 32)
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	err = h.pollService.DeletePoll(uint(pollID), userID)
	if err != nil {
		if err.Error() == "unauthorized" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized to delete this poll"})
			return
		}
		if err.Error() == "poll not found" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Poll deleted successfully"})
}

// ExpirePoll handles PUT /api/polls/{id}/expire
func (h *PollHandler) ExpirePoll(w http.ResponseWriter, r *http.Request, userID uint) {
	// Extract poll ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	pollID, err := strconv.ParseUint(pathParts[3], 10, 32)
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	err = h.pollService.ExpirePoll(uint(pollID), userID)
	if err != nil {
		if err.Error() == "unauthorized" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized to expire this poll"})
			return
		}
		if err.Error() == "poll not found" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		if err.Error() == "poll already expired" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Return updated poll
	poll, err := h.pollService.GetPollByID(uint(pollID), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(poll)
}
