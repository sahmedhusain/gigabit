package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"social/models"
	"social/services"
	"social/websocket"
)

type GroupHandler struct {
	groupService *services.GroupService
	hub          *websocket.Hub
}

func NewGroupHandler(db *sql.DB, hub *websocket.Hub) *GroupHandler {
	return &GroupHandler{
		groupService: services.NewGroupService(db),
		hub:          hub,
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

	// Add creator to WebSocket group for real-time messaging
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
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	accept := req.Action == "accept"

	if err := h.groupService.RespondToInvitation(uint(groupID), userID, accept); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "No invitation found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to respond to invitation")
		}
		return
	}

	// If invitation was accepted, add user to WebSocket group for real-time messaging
	if accept && h.hub != nil {
		h.hub.AddUserToGroup(userID, uint(groupID))
	}

	message := "Invitation declined"
	if accept {
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
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	accept := req.Action == "accept"

	if err := h.groupService.RespondToJoinRequest(uint(groupID), uint(requestUserID), userID, accept); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot respond to this request")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to respond to join request")
		}
		return
	}

	// If join request was accepted, add user to WebSocket group for real-time messaging
	if accept && h.hub != nil {
		h.hub.AddUserToGroup(uint(requestUserID), uint(groupID))
	}

	message := "Join request declined"
	if accept {
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
		writeError(w, http.StatusInternalServerError, "Failed to leave group")
		return
	}

	// Remove user from WebSocket group
	if h.hub != nil {
		h.hub.RemoveUserFromGroup(userID, uint(groupID))
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

// CreateGroupPost creates a new post in a group
func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	var req models.CreateGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	// Only members can post (not pending or invited users)
	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	// Check group permissions for creating posts
	group, err := h.groupService.GetGroupByID(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get group information")
		return
	}

	// Check if user has permission to create posts
	isAdminOrCreator, err := h.groupService.IsUserAdminOrCreator(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check user permissions")
		return
	}
	canCreatePosts := group.CreatePosts == "all_members" || isAdminOrCreator
	if !canCreatePosts {
		writeError(w, http.StatusForbidden, "You don't have permission to create posts in this group")
		return
	}

	// Create the group post
	groupPost := &models.GroupPost{
		GroupID:   uint(groupID),
		UserID:    userID,
		Content:   req.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if req.ImageURL != "" {
		groupPost.ImageURL = &req.ImageURL
	}

	if err := h.groupService.CreateGroupPost(groupPost); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create group post")
		return
	}

	// Get the full post response with user details
	postResponse, err := h.groupService.GetGroupPostByID(groupPost.ID, userID)
	if err != nil {
		// Post was created but we couldn't fetch the response, still return success
		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"message": "Group post created successfully",
			"post_id": groupPost.ID,
		})
		return
	}

	// Send real-time update to all group members via WebSocket
	if h.hub != nil {
		message := websocket.Message{
			Type:      "group_post_update",
			From:      userID,
			GroupID:   uint(groupID),
			PostID:    groupPost.ID,
			Action:    "create",
			Data:      postResponse,
			Timestamp: time.Now().Unix(),
		}
		h.hub.SendToGroup(uint(groupID), message, userID)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Group post created successfully",
		"post":    postResponse,
	})
}

// GetGroupPosts retrieves all posts in a group
func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
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

	posts, err := h.groupService.GetGroupPosts(uint(groupID), userID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get group posts")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

// DeleteGroupPost deletes a group post
func (h *GroupHandler) DeleteGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.groupService.DeleteGroupPost(uint(postID), uint(groupID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this post")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete post")
		}
		return
	}

	// Send real-time update to all group members via WebSocket
	if h.hub != nil {
		message := websocket.Message{
			Type:      "group_post_update",
			From:      userID,
			GroupID:   uint(groupID),
			PostID:    uint(postID),
			Action:    "delete",
			Data:      map[string]interface{}{"post_id": postID},
			Timestamp: time.Now().Unix(),
		}
		h.hub.SendToGroup(uint(groupID), message, userID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Group post deleted successfully"})
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

// UpdateMemberRole updates the role of a group member
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

	// Check if current user is admin of the group
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

	// If promoting to admin, check admin limit
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

// KickMember removes a member from the group
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

	// Check if current user is admin of the group
	isAdmin, err := h.groupService.IsUserAdminOrCreator(uint(groupID), currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check admin status")
		return
	}
	if !isAdmin {
		writeError(w, http.StatusForbidden, "Only admins can kick members")
		return
	}

	// Check if the user being kicked is also an admin
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

	// Remove kicked user from WebSocket group
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

func (h *GroupHandler) GetSentJoinRequests(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	requests, err := h.groupService.GetSentJoinRequests(uint(groupID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view sent join requests")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get sent join requests")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"count":    len(requests),
	})
}

func (h *GroupHandler) GetReceivedJoinRequests(w http.ResponseWriter, r *http.Request, groupIDStr string) {
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

	requests, err := h.groupService.GetReceivedJoinRequests(uint(groupID), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot view received join requests")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get received join requests")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"count":    len(requests),
	})
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
