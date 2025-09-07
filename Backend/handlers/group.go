package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social/models"
	"social/services"
	"strconv"
)

type GroupHandler struct {
	groupService *services.GroupService
}

func NewGroupHandler(db *sql.DB) *GroupHandler {
	return &GroupHandler{
		groupService: services.NewGroupService(db),
	}
}

func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	group := &models.Group{
		CreatorID:   userID,
		Title:       req.Title,
		Description: req.Description,
	}

	if err := h.groupService.CreateGroup(group); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create group")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Group created successfully",
		"group":   group,
	})
}

func (h *GroupHandler) GetGroup(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	group, err := h.groupService.GetGroupByID(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Group not found")
		return
	}

	writeJSON(w, http.StatusOK, group)
}

func (h *GroupHandler) GetAllGroups(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get pagination parameters
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

	groups, err := h.groupService.GetAllGroups(userID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get groups")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"groups": groups,
		"count":  len(groups),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *GroupHandler) GetUserGroups(w http.ResponseWriter, r *http.Request, userIDStr string) {
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get pagination parameters
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

	groups, err := h.groupService.GetUserGroups(uint(userID), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get user groups")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"groups": groups,
		"count":  len(groups),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *GroupHandler) UpdateGroup(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	var req models.UpdateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.groupService.UpdateGroup(uint(groupID), userID, &req); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot update this group")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update group")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Group updated successfully"})
}

func (h *GroupHandler) DeleteGroup(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	if err := h.groupService.DeleteGroup(uint(groupID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this group")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete group")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Group deleted successfully"})
}

func (h *GroupHandler) InviteUsers(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	var req models.GroupInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.groupService.InviteUsers(uint(groupID), userID, req.UserIDs); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot invite users to this group")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to invite users")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Invitations sent successfully"})
}

func (h *GroupHandler) RequestToJoin(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	if err := h.groupService.RequestToJoin(uint(groupID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusConflict, "Already requested or member of this group")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to request group membership")
		}
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": "Join request sent successfully"})
}

func (h *GroupHandler) RespondToInvitation(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	var req struct {
		Accept bool `json:"accept"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.groupService.RespondToInvitation(uint(groupID), userID, req.Accept); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "No invitation found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to respond to invitation")
		}
		return
	}

	message := "Invitation declined"
	if req.Accept {
		message = "Invitation accepted - you are now a member"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": message})
}

func (h *GroupHandler) RespondToJoinRequest(w http.ResponseWriter, r *http.Request, groupIDStr, requestUserIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	requestUserID, err := strconv.ParseUint(requestUserIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		Accept bool `json:"accept"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.groupService.RespondToJoinRequest(uint(groupID), uint(requestUserID), userID, req.Accept); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot respond to this request")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to respond to join request")
		}
		return
	}

	message := "Join request declined"
	if req.Accept {
		message = "Join request accepted"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": message})
}

func (h *GroupHandler) LeaveGroup(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	if err := h.groupService.LeaveGroup(uint(groupID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot leave this group (creators must delete the group)")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to leave group")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Left group successfully"})
}

func (h *GroupHandler) GetGroupMembers(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	members, err := h.groupService.GetGroupMembers(uint(groupID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view group members")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get group members")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"members": members,
		"count":   len(members),
	})
}

func (h *GroupHandler) GetPendingRequests(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	requests, err := h.groupService.GetPendingRequests(uint(groupID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view pending requests")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get pending requests")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"count":    len(requests),
	})
}

func (h *GroupHandler) GetUserRole(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "User is not a member of this group")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get user role")
		}
		return
	}

	isAdminOrCreator := role == "admin" || role == "creator"

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"role":                role,
		"is_admin_or_creator": isAdminOrCreator,
	})
}
