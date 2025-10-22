package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"social/utils"
	"strings"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with max memory 32MB
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	// Get file from form
	file, header, err := r.FormFile("image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No image file provided")
		return
	}
	defer file.Close()

	// Save the image
	result, err := utils.SaveImageFile(file, header)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":   "Image uploaded successfully",
		"filename":  result.Filename,
		"size":      result.Size,
		"mime_type": result.MimeType,
	})
}

func (h *UploadHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with max memory 32MB
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	// Get file from form
	file, header, err := r.FormFile("avatar")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No avatar file provided")
		return
	}
	defer file.Close()

	// Save the avatar image
	result, err := utils.SaveImageFile(file, header)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Return the full URL for the avatar
	avatarURL := "http://localhost:8080/uploads/" + result.Filename

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Avatar uploaded successfully",
		"filename":   result.Filename,
		"avatar_url": avatarURL,
		"size":       result.Size,
		"mime_type":  result.MimeType,
	})
}

func (h *UploadHandler) ServeImage(w http.ResponseWriter, r *http.Request) {
	// Extract filename from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/uploads/")
	filename := filepath.Base(path)

	if filename == "" || filename == "." {
		writeError(w, http.StatusBadRequest, "Filename required")
		return
	}

	imagePath := utils.GetImagePath(filename)

	// Check if file exists
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		writeError(w, http.StatusNotFound, "Image not found")
		return
	}

	http.ServeFile(w, r, imagePath)
}

func (h *UploadHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	// Extract filename from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/uploads/")
	filename := filepath.Base(path)

	if filename == "" || filename == "." {
		writeError(w, http.StatusBadRequest, "Filename required")
		return
	}

	if err := utils.DeleteImageFile(filename); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete image")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Image deleted successfully",
	})
}
