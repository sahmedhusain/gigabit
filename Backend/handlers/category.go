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

type CategoryHandler struct {
	categoryService *services.CategoryService
}

func NewCategoryHandler(db *sql.DB, hub *websocket.Hub) *CategoryHandler {
	return &CategoryHandler{
		categoryService: services.NewCategoryService(db, hub),
	}
}

// GetAllCategories retrieves all active categories
func (h *CategoryHandler) GetAllCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.categoryService.GetAllCategories()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get categories")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"categories": categories,
		"count":      len(categories),
	})
}

// GetCategory retrieves a specific category
func (h *CategoryHandler) GetCategory(w http.ResponseWriter, r *http.Request, categoryIDStr string) {
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	category, err := h.categoryService.GetCategoryByID(uint(categoryID))
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "Category not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get category")
		}
		return
	}

	writeJSON(w, http.StatusOK, category)
}

// CreateCategory creates a new category (admin only)
func (h *CategoryHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Set default values if not provided
	if req.Color == "" {
		req.Color = "#10B981" // Default emerald color
	}
	if req.Icon == "" {
		req.Icon = "folder" // Default icon
	}

	category := &models.Category{
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Icon:        req.Icon,
		IsActive:    true,
		PostCount:   0,
	}

	if err := h.categoryService.CreateCategory(category); err != nil {
		if err.Error() == "category name already exists" {
			writeError(w, http.StatusConflict, "Category name already exists")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to create category")
		}
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":  "Category created successfully",
		"category": category,
	})
}

// UpdateCategory updates an existing category (admin only)
func (h *CategoryHandler) UpdateCategory(w http.ResponseWriter, r *http.Request, categoryIDStr string) {
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req models.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.categoryService.UpdateCategory(uint(categoryID), &req); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "Category not found")
		} else if err.Error() == "category name already exists" {
			writeError(w, http.StatusConflict, "Category name already exists")
		} else if err.Error() == "no fields to update" {
			writeError(w, http.StatusBadRequest, "No fields to update")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update category")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Category updated successfully"})
}

// DeleteCategory soft deletes a category (admin only)
func (h *CategoryHandler) DeleteCategory(w http.ResponseWriter, r *http.Request, categoryIDStr string) {
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	if err := h.categoryService.DeleteCategory(uint(categoryID)); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "Category not found")
		} else if err.Error() == "cannot delete the default General category" {
			writeError(w, http.StatusForbidden, "Cannot delete the default General category")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete category")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Category deleted successfully"})
}

// GetCategoryStats retrieves category statistics
func (h *CategoryHandler) GetCategoryStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.categoryService.GetCategoryStats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get category stats")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"stats": stats,
		"count": len(stats),
	})
}

// SearchCategories searches categories by name
func (h *CategoryHandler) SearchCategories(w http.ResponseWriter, r *http.Request) {
	searchTerm := r.URL.Query().Get("q")
	if searchTerm == "" {
		writeError(w, http.StatusBadRequest, "Search query required")
		return
	}

	categories, err := h.categoryService.SearchCategories(searchTerm)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to search categories")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"categories": categories,
		"count":      len(categories),
		"search":     searchTerm,
	})
}
