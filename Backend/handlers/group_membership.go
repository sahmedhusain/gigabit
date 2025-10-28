package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"social/models"
)

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

	for _, invitedUserID := range req.UserIDs {
		go h.notificationService.NotifyGroupInvite(userID, invitedUserID, uint(groupID))
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

	group, err := h.groupService.GetGroupByID(uint(groupID), userID)
	if err == nil && group != nil {
		go h.notificationService.NotifyJoinRequest(userID, group.CreatorID, uint(groupID))
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

func (h *GroupHandler) GetOutgoingGroupJoinRequests(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	requests, err := h.groupService.GetOutgoingGroupJoinRequests(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get outgoing group join requests")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"count":    len(requests),
	})
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
