package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"social/services"
	"social/websocket"
)

type BookmarkHandler struct {
	bookmarkService *services.BookmarkService
}

func NewBookmarkHandler(db *sql.DB, hub *websocket.Hub) *BookmarkHandler {
	return &BookmarkHandler{
		bookmarkService: services.NewBookmarkService(db, hub),
	}
}

func (h *BookmarkHandler) BookmarkPost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.bookmarkService.BookmarkPost(userID.(uint), uint(postID)); err != nil {
		log.Printf("Failed to bookmark post %d for user %v: %v", postID, userID, err)
		if err.Error() == "post already bookmarked" {
			writeError(w, http.StatusConflict, "Post already bookmarked")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to bookmark post")
		return
	}

	log.Printf("Post %d bookmarked successfully by user %v", postID, userID)
	writeJSON(w, http.StatusCreated, map[string]string{"message": "Post bookmarked successfully"})
}

func (h *BookmarkHandler) UnbookmarkPost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.bookmarkService.UnbookmarkPost(userID.(uint), uint(postID)); err != nil {
		log.Printf("Failed to unbookmark post %d for user %v: %v", postID, userID, err)
		if err.Error() == "bookmark not found" {
			writeError(w, http.StatusNotFound, "Bookmark not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to unbookmark post")
		return
	}

	log.Printf("Post %d unbookmarked successfully by user %v", postID, userID)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Post unbookmarked successfully"})
}

func (h *BookmarkHandler) GetUserBookmarks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
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

	bookmarks, err := h.bookmarkService.GetUserBookmarks(userID.(uint), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get bookmarks")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"bookmarks": bookmarks,
		"count":     len(bookmarks),
		"limit":     limit,
		"offset":    offset,
	})
}

func (h *BookmarkHandler) CheckBookmarkStatus(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	isBookmarked, err := h.bookmarkService.IsPostBookmarked(userID.(uint), uint(postID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check bookmark status")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"is_bookmarked": isBookmarked,
	})
}
