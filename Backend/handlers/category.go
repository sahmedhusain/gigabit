package handlers

import (
	"database/sql"
	"net/http"
	"social/models"
	"social/services"
	"social/websocket"
	"strconv"

	"github.com/gin-gonic/gin"
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
func (h *CategoryHandler) GetAllCategories(c *gin.Context) {
	categories, err := h.categoryService.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"count":      len(categories),
	})
}

// GetCategory retrieves a specific category
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	category, err := h.categoryService.GetCategoryByID(uint(categoryID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get category"})
		}
		return
	}

	c.JSON(http.StatusOK, category)
}

// CreateCategory creates a new category (admin only)
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
			c.JSON(http.StatusConflict, gin.H{"error": "Category name already exists"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Category created successfully",
		"category": category,
	})
}

// UpdateCategory updates an existing category (admin only)
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var req models.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.categoryService.UpdateCategory(uint(categoryID), &req); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		} else if err.Error() == "category name already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "Category name already exists"})
		} else if err.Error() == "no fields to update" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category updated successfully"})
}

// DeleteCategory soft deletes a category (admin only)
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	if err := h.categoryService.DeleteCategory(uint(categoryID)); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		} else if err.Error() == "cannot delete the default General category" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete the default General category"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

// GetCategoryStats retrieves category statistics
func (h *CategoryHandler) GetCategoryStats(c *gin.Context) {
	stats, err := h.categoryService.GetCategoryStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get category stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
		"count": len(stats),
	})
}

// SearchCategories searches categories by name
func (h *CategoryHandler) SearchCategories(c *gin.Context) {
	searchTerm := c.Query("q")
	if searchTerm == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query required"})
		return
	}

	categories, err := h.categoryService.SearchCategories(searchTerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"count":      len(categories),
		"search":     searchTerm,
	})
}