package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"gigabit/models"
	"gigabit/services"
	"gigabit/websocket"
)

type EventHandler struct {
	eventService        *services.EventService
	groupService        *services.GroupService
	notificationService *services.NotificationService
}

func NewEventHandler(db *sql.DB, hub *websocket.Hub) *EventHandler {
	return &EventHandler{
		eventService:        services.NewEventService(db, hub),
		groupService:        services.NewGroupService(db),
		notificationService: services.NewNotificationService(db, hub),
	}
}

func (h *EventHandler) CreateEvent(w http.ResponseWriter, r *http.Request, groupIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	isMember, err := h.groupService.IsUserMember(uint(groupID), userID)
	if err != nil || !isMember {
		writeError(w, http.StatusForbidden, "Must be a group member to create events")
		return
	}

	userRole, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if userRole == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	group, err := h.groupService.GetGroupByID(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get group information")
		return
	}

	isAdminOrCreator, err := h.groupService.IsUserAdminOrCreator(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check user permissions")
		return
	}
	canCreateEvents := group.CreateEvents == "all_members" || isAdminOrCreator
	if !canCreateEvents {
		writeError(w, http.StatusForbidden, "You don't have permission to create events in this group")
		return
	}

	var req models.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	event := &models.Event{
		GroupID:     uint(groupID),
		CreatorID:   userID,
		Title:       req.Title,
		Description: req.Description,
		EventTime:   req.EventTime,
		Location:    req.Location,
	}

	if err := h.eventService.CreateEvent(event); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create event")
		return
	}

	go h.notificationService.NotifyEventCreated(userID, uint(groupID), event.ID)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Event created successfully",
		"event":   event,
	})
}

func (h *EventHandler) GetEvent(w http.ResponseWriter, r *http.Request, eventIDStr string) {
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	event, err := h.eventService.GetEventByID(uint(eventID), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Event not found")
		return
	}

	writeJSON(w, http.StatusOK, event)
}

func (h *EventHandler) GetGroupEvents(w http.ResponseWriter, r *http.Request, groupIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	events, err := h.eventService.GetGroupEvents(uint(groupID), userID, limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view group events")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get group events")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"events": events,
		"count":  len(events),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *EventHandler) GetUserEvents(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	events, err := h.eventService.GetUserEvents(userID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get user events")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"events": events,
		"count":  len(events),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *EventHandler) UpdateEvent(w http.ResponseWriter, r *http.Request, eventIDStr string) {
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.UpdateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.eventService.UpdateEvent(uint(eventID), userID, &req); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot update this event")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update event")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Event updated successfully"})
}

func (h *EventHandler) DeleteEvent(w http.ResponseWriter, r *http.Request, eventIDStr string) {
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.eventService.DeleteEvent(uint(eventID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this event")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete event")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Event deleted successfully"})
}

func (h *EventHandler) CancelEvent(w http.ResponseWriter, r *http.Request, eventIDStr string) {
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CancelEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.eventService.CancelEvent(uint(eventID), userID, req.CancelReason); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot cancel this event")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to cancel event")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Event cancelled successfully"})
}

func (h *EventHandler) RespondToEvent(w http.ResponseWriter, r *http.Request, eventIDStr string) {
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.EventResponseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	currentResponse, _ := h.eventService.GetUserEventResponse(uint(eventID), userID)
	wasRemoved := currentResponse == req.Option

	if err := h.eventService.RespondToEvent(uint(eventID), userID, req.Option); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot respond to this event")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to respond to event")
		}
		return
	}

	responseValue := req.Option
	message := "Response recorded successfully"
	if wasRemoved {
		responseValue = ""
		message = "Response removed successfully"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":  message,
		"response": responseValue,
		"removed":  wasRemoved,
	})
}

func (h *EventHandler) GetEventResponses(w http.ResponseWriter, r *http.Request, eventIDStr string) {
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	responses, err := h.eventService.GetEventResponses(uint(eventID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view event responses")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get event responses")
		}
		return
	}

	going := make([]models.EventResponseDetail, 0)
	notGoing := make([]models.EventResponseDetail, 0)

	for _, response := range responses {
		if response.Option == "going" {
			going = append(going, response)
		} else {
			notGoing = append(notGoing, response)
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"responses": map[string]interface{}{
			"going":     going,
			"not_going": notGoing,
		},
		"counts": map[string]int{
			"going":     len(going),
			"not_going": len(notGoing),
			"total":     len(responses),
		},
	})
}
