package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"social/models"
	"social/services"
	"social/websocket"
)

type GroupHandler struct {
	groupService        *services.GroupService
	notificationService *services.NotificationService
	likeService         *services.LikeService
	hub                 *websocket.Hub
}

func NewGroupHandler(db *sql.DB, hub *websocket.Hub) *GroupHandler {
	return &GroupHandler{
		groupService:        services.NewGroupService(db),
		notificationService: services.NewNotificationService(db, hub),
		likeService:         services.NewLikeService(db, hub),
		hub:                 hub,
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
	if strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "Group title is required")
		return
	}
	if req.Privacy != "public" && req.Privacy != "private" {
		writeError(w, http.StatusBadRequest, "Invalid privacy option")
		return
	}

	group := &models.Group{
		CreatorID:    userID,
		Title:        req.Title,
		Description:  req.Description,
		Privacy:      req.Privacy,
		CreatePosts:  req.CreatePosts,
		CreatePolls:  req.CreatePolls,
		CreateEvents: req.CreateEvents,
		SendMessages: req.SendMessages,
		Avatar:       req.Avatar,
	}

	if err := h.groupService.CreateGroup(group, req.InviteMembers); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create group")
		return
	}

	if h.hub != nil {
		h.hub.AddUserToGroup(userID, group.ID)
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

func (h *GroupHandler) GetUserInvitations(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	invitations, err := h.groupService.GetUserInvitations(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get invitations")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"invitations": invitations,
		"count":       len(invitations),
	})
}

func (h *GroupHandler) PromoteToAdmin(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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
		UserID uint `json:"user_id" binding:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.groupService.PromoteToAdmin(uint(groupID), userID, req.UserID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "You don't have permission to promote users or invalid user")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to promote user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "User promoted to admin successfully",
	})
}

func (h *GroupHandler) DemoteAdmin(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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
		UserID uint `json:"user_id" binding:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.groupService.DemoteAdmin(uint(groupID), userID, req.UserID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "You don't have permission to demote admins or invalid user")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to demote admin")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Admin demoted to member successfully",
	})
}

func (h *GroupHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request, groupIDStr, userIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	isAdmin, err := h.groupService.IsUserAdminOrCreator(uint(groupID), currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check admin status")
		return
	}
	if !isAdmin {
		writeError(w, http.StatusForbidden, "Only admins can update member roles")
		return
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Role != "admin" && req.Role != "member" {
		writeError(w, http.StatusBadRequest, "Role must be 'admin' or 'member'")
		return
	}

	if req.Role == "admin" {
		adminCount, err := h.groupService.CountAdmins(uint(groupID))
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to count admins")
			return
		}
		if adminCount >= 3 {
			writeError(w, http.StatusBadRequest, "Maximum number of admins reached")
			return
		}
	}

	err = h.groupService.UpdateUserRole(uint(groupID), uint(userID), req.Role)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "User role updated successfully",
	})
}

func (h *GroupHandler) GetNextAdmin(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	nextAdminInfo, err := h.groupService.GetNextAdmin(uint(groupID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "User is not a member of this group")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get next admin info")
		}
		return
	}

	writeJSON(w, http.StatusOK, nextAdminInfo)
}

func (h *GroupHandler) KickMember(w http.ResponseWriter, r *http.Request, groupIDStr, userIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	isAdmin, err := h.groupService.IsUserAdminOrCreator(uint(groupID), currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check admin status")
		return
	}
	if !isAdmin {
		writeError(w, http.StatusForbidden, "Only admins can kick members")
		return
	}

	targetUserRole, err := h.groupService.GetUserRole(uint(groupID), uint(userID))
	if err != nil && err != sql.ErrNoRows {
		writeError(w, http.StatusInternalServerError, "Failed to check target user role")
		return
	}
	if targetUserRole == "admin" {
		writeError(w, http.StatusBadRequest, "Cannot kick another admin")
		return
	}

	err = h.groupService.RemoveMember(uint(groupID), uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to remove member")
		return
	}

	if h.hub != nil {
		h.hub.RemoveUserFromGroup(uint(userID), uint(groupID))
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Member removed successfully",
	})
}

func (h *GroupHandler) UpdateGroupPrivacy(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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
		Privacy string `json:"privacy"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Privacy != "public" && req.Privacy != "private" {
		writeError(w, http.StatusBadRequest, "Privacy must be 'public' or 'private'")
		return
	}

	if err := h.groupService.UpdateGroupPrivacy(uint(groupID), req.Privacy, userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot update group privacy")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update group privacy")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Group privacy updated successfully"})
}

func (h *GroupHandler) UpdateGroupPermissions(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	var req models.UpdateGroupPermissionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.CreatePosts != "all_members" && req.CreatePosts != "admins_only" {
		writeError(w, http.StatusBadRequest, "Create posts must be 'all_members' or 'admins_only'")
		return
	}
	if req.CreatePolls != "all_members" && req.CreatePolls != "admins_only" {
		writeError(w, http.StatusBadRequest, "Create polls must be 'all_members' or 'admins_only'")
		return
	}
	if req.CreateEvents != "all_members" && req.CreateEvents != "admins_only" {
		writeError(w, http.StatusBadRequest, "Create events must be 'all_members' or 'admins_only'")
		return
	}
	if req.SendMessages != "all_members" && req.SendMessages != "admins_only" {
		writeError(w, http.StatusBadRequest, "Send messages must be 'all_members' or 'admins_only'")
		return
	}

	if err := h.groupService.UpdateGroupPermissions(uint(groupID), &req, userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot update group permissions")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update group permissions")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Group permissions updated successfully"})
}

func (h *GroupHandler) DeleteGroupMessage(w http.ResponseWriter, r *http.Request, groupIDStr, messageIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.groupService.DeleteGroupMessage(uint(groupID), uint(messageID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this message")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete message")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Message deleted successfully"})
}

func (h *GroupHandler) GetInvitableUsers(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	searchTerm := r.URL.Query().Get("search")
	if searchTerm == "" {
		searchTerm = ""
	}

	users, err := h.groupService.GetInvitableUsers(uint(groupID), userID, searchTerm)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view invitable users")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get invitable users")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"count": len(users),
	})
}

func (h *GroupHandler) CancelInvitation(w http.ResponseWriter, r *http.Request, groupIDStr string, invitationIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	invitationID, err := strconv.ParseUint(invitationIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid invitation ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.groupService.CancelInvitation(uint(groupID), uint(invitationID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot cancel this invitation")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to cancel invitation")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Invitation cancelled successfully"})
}
