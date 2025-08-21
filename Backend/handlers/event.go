package handlers

import (
	"database/sql"
	"net/http"
	"social/models"
	"social/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type EventHandler struct {
	eventService *services.EventService
	groupService *services.GroupService
}

func NewEventHandler(db *sql.DB) *EventHandler {
	return &EventHandler{
		eventService: services.NewEventService(db),
		groupService: services.NewGroupService(db),
	}
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	groupIDStr := c.Param("id")
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if user is a member of the group
	isMember, err := h.groupService.IsUserMember(uint(groupID), userID.(uint))
	if err != nil || !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Must be a group member to create events"})
		return
	}

	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := &models.Event{
		GroupID:     uint(groupID),
		CreatorID:   userID.(uint),
		Title:       req.Title,
		Description: req.Description,
		EventTime:   req.EventTime,
	}

	if err := h.eventService.CreateEvent(event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Event created successfully",
		"event":   event,
	})
}

func (h *EventHandler) GetEvent(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	event, err := h.eventService.GetEventByID(uint(eventID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) GetGroupEvents(c *gin.Context) {
	groupIDStr := c.Param("id")
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	events, err := h.eventService.GetGroupEvents(uint(groupID), userID.(uint), limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot view group events"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get group events"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"count":  len(events),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *EventHandler) GetUserEvents(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	events, err := h.eventService.GetUserEvents(userID.(uint), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"count":  len(events),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *EventHandler) UpdateEvent(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.eventService.UpdateEvent(uint(eventID), userID.(uint), &req); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot update this event"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event updated successfully"})
}

func (h *EventHandler) DeleteEvent(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.eventService.DeleteEvent(uint(eventID), userID.(uint)); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete this event"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

func (h *EventHandler) RespondToEvent(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.EventResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.eventService.RespondToEvent(uint(eventID), userID.(uint), req.Option); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot respond to this event"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to respond to event"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Response recorded successfully",
		"response": req.Option,
	})
}

func (h *EventHandler) GetEventResponses(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	responses, err := h.eventService.GetEventResponses(uint(eventID), userID.(uint))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot view event responses"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get event responses"})
		}
		return
	}

	// Group responses by option for easier consumption
	going := make([]models.EventResponseDetail, 0)
	notGoing := make([]models.EventResponseDetail, 0)

	for _, response := range responses {
		if response.Option == "going" {
			going = append(going, response)
		} else {
			notGoing = append(notGoing, response)
		}
	}

	c.JSON(http.StatusOK, gin.H{
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
