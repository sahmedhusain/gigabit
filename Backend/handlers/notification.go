package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"social/models"
	"social/services"
	"social/websocket"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
}

func NewNotificationHandler(db *sql.DB, hub *websocket.Hub) *NotificationHandler {
	return &NotificationHandler{
		notificationService: services.NewNotificationService(db, hub),
	}
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
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

	notifications, err := h.notificationService.GetUserNotifications(userID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get notifications")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data": notifications,
	})
}

func (h *NotificationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	count, err := h.notificationService.GetUnreadCount(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get unread count")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"unread_count": count,
	})
}

func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.MarkNotificationsReadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var err error
	if req.MarkAll {
		err = h.notificationService.MarkAllAsRead(userID)
	} else {
		err = h.notificationService.MarkAsRead(userID, req.NotificationIDs)
	}

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to mark notifications as read")
		return
	}

	message := "Notifications marked as read"
	if req.MarkAll {
		message = "All notifications marked as read"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": message,
		"count":   len(req.NotificationIDs),
	})
}

func (h *NotificationHandler) DeleteNotification(w http.ResponseWriter, r *http.Request, notificationIDStr string) {
	notificationID, err := strconv.ParseUint(notificationIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid notification ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.notificationService.DeleteNotification(uint(notificationID), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete notification")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Notification deleted successfully"})
}

func (h *NotificationHandler) DeleteAllRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.notificationService.DeleteAllRead(userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete notifications")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "All read notifications deleted successfully"})
}

func (h *NotificationHandler) CreateNotification(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	notification := &models.Notification{
		UserID:     req.UserID,
		ActorID:    userID,
		Type:       req.Type,
		EntityType: req.EntityType,
		EntityID:   req.EntityID,
		Title:      req.Title,
		Message:    req.Message,
	}

	if err := h.notificationService.CreateNotification(notification); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create notification")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":      "Notification created successfully",
		"notification": notification,
	})
}

func (h *NotificationHandler) GetNotificationSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	settings, err := h.notificationService.GetNotificationSettings(userID)
	if err != nil {
		defaultSettings := &models.NotificationSettings{
			UserID:             userID,
			SoundEnabled:       true,
			SoundTheme:         "classic",
			BrowserPushEnabled: true,
			QuietHoursEnabled:  false,
			QuietHoursStart:    "22:00",
			QuietHoursEnd:      "08:00",
			MutedConversations: []models.MutedConversation{},
		}
		writeJSON(w, http.StatusOK, defaultSettings)
		return
	}

	writeJSON(w, http.StatusOK, settings)
}

func (h *NotificationHandler) UpdateNotificationSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.NotificationSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	settings, err := h.notificationService.UpdateNotificationSettings(userID, &req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update notification settings")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":  "Notification settings updated successfully",
		"settings": settings,
	})
}
