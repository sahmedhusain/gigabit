package services

import (
	"database/sql"
	"fmt"
	"social/models"
	"social/websocket"
	"strings"
	"time"
)

type CategoryService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewCategoryService(db *sql.DB, hub *websocket.Hub) *CategoryService {
	return &CategoryService{
		db:  db,
		hub: hub,
	}
}

// GetAllCategories retrieves all active categories
func (s *CategoryService) GetAllCategories() ([]models.CategoryResponse, error) {
	query := `
		SELECT id, name, description, color, icon, is_active, post_count, created_at, updated_at
		FROM categories 
		WHERE is_active = true
		ORDER BY name ASC
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.CategoryResponse
	for rows.Next() {
		var category models.Category
		err := rows.Scan(
			&category.ID, &category.Name, &category.Description, &category.Color,
			&category.Icon, &category.IsActive, &category.PostCount,
			&category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		categories = append(categories, models.CategoryResponse{
			ID:          category.ID,
			Name:        category.Name,
			Description: category.Description,
			Color:       category.Color,
			Icon:        category.Icon,
			IsActive:    category.IsActive,
			PostCount:   category.PostCount,
			CreatedAt:   category.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   category.UpdatedAt.Format(time.RFC3339),
		})
	}

	return categories, nil
}

// GetCategoryByID retrieves a specific category
func (s *CategoryService) GetCategoryByID(categoryID uint) (*models.CategoryResponse, error) {
	query := `
		SELECT id, name, description, color, icon, is_active, post_count, created_at, updated_at
		FROM categories 
		WHERE id = ? AND is_active = true
	`
	
	var category models.Category
	err := s.db.QueryRow(query, categoryID).Scan(
		&category.ID, &category.Name, &category.Description, &category.Color,
		&category.Icon, &category.IsActive, &category.PostCount,
		&category.CreatedAt, &category.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &models.CategoryResponse{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
		Color:       category.Color,
		Icon:        category.Icon,
		IsActive:    category.IsActive,
		PostCount:   category.PostCount,
		CreatedAt:   category.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   category.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// CreateCategory creates a new category
func (s *CategoryService) CreateCategory(category *models.Category) error {
	query := `
		INSERT INTO categories (name, description, color, icon, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, category.Name, category.Description, category.Color, category.Icon, now, now)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return fmt.Errorf("category name already exists")
		}
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	category.ID = uint(id)
	category.CreatedAt = now
	category.UpdatedAt = now

	// Broadcast real-time category creation
	if s.hub != nil {
		categoryData := map[string]interface{}{
			"id":          category.ID,
			"name":        category.Name,
			"description": category.Description,
			"color":       category.Color,
			"icon":        category.Icon,
			"is_active":   category.IsActive,
			"post_count":  category.PostCount,
			"created_at":  category.CreatedAt,
		}
		s.hub.BroadcastToAll("category_update", "create", categoryData)
	}

	return nil
}

// UpdateCategory updates an existing category
func (s *CategoryService) UpdateCategory(categoryID uint, updateReq *models.UpdateCategoryRequest) error {
	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}

	if updateReq.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *updateReq.Name)
	}
	if updateReq.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *updateReq.Description)
	}
	if updateReq.Color != nil {
		setParts = append(setParts, "color = ?")
		args = append(args, *updateReq.Color)
	}
	if updateReq.Icon != nil {
		setParts = append(setParts, "icon = ?")
		args = append(args, *updateReq.Icon)
	}
	if updateReq.IsActive != nil {
		setParts = append(setParts, "is_active = ?")
		args = append(args, *updateReq.IsActive)
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no fields to update")
	}

	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now())
	args = append(args, categoryID)

	query := fmt.Sprintf(`
		UPDATE categories 
		SET %s
		WHERE id = ?
	`, strings.Join(setParts, ", "))

	result, err := s.db.Exec(query, args...)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return fmt.Errorf("category name already exists")
		}
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	// Broadcast real-time category update
	if s.hub != nil {
		updateData := map[string]interface{}{
			"category_id": categoryID,
		}
		if updateReq.Name != nil {
			updateData["name"] = *updateReq.Name
		}
		if updateReq.Description != nil {
			updateData["description"] = *updateReq.Description
		}
		if updateReq.Color != nil {
			updateData["color"] = *updateReq.Color
		}
		if updateReq.Icon != nil {
			updateData["icon"] = *updateReq.Icon
		}
		if updateReq.IsActive != nil {
			updateData["is_active"] = *updateReq.IsActive
		}
		
		s.hub.BroadcastToAll("category_update", "update", updateData)
	}

	return nil
}

// DeleteCategory soft deletes a category by setting is_active to false
func (s *CategoryService) DeleteCategory(categoryID uint) error {
	// Don't allow deletion of the "General" category (ID 1)
	if categoryID == 1 {
		return fmt.Errorf("cannot delete the default General category")
	}

	// Check if category exists
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM categories WHERE id = ?)", categoryID).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return sql.ErrNoRows
	}

	// Move all posts from this category to General (category_id = 1)
	_, err = s.db.Exec("UPDATE posts SET category_id = 1 WHERE category_id = ?", categoryID)
	if err != nil {
		return err
	}

	// Soft delete the category
	query := `UPDATE categories SET is_active = false, updated_at = ? WHERE id = ?`
	_, err = s.db.Exec(query, time.Now(), categoryID)
	if err != nil {
		return err
	}

	// Update post counts
	err = s.UpdateCategoryPostCounts()
	if err != nil {
		return err
	}

	// Broadcast real-time category deletion
	if s.hub != nil {
		deleteData := map[string]interface{}{
			"category_id": categoryID,
		}
		s.hub.BroadcastToAll("category_update", "delete", deleteData)
	}

	return nil
}

// GetCategoryStats retrieves category statistics for trending/popular categories
func (s *CategoryService) GetCategoryStats() ([]models.CategoryStats, error) {
	query := `
		SELECT c.id, c.name, c.color, c.icon, c.post_count,
			CASE WHEN recent_posts.recent_count > 5 THEN true ELSE false END as trending
		FROM categories c
		LEFT JOIN (
			SELECT category_id, COUNT(*) as recent_count
			FROM posts 
			WHERE created_at > datetime('now', '-7 days')
			GROUP BY category_id
		) recent_posts ON c.id = recent_posts.category_id
		WHERE c.is_active = true
		ORDER BY c.post_count DESC, c.name ASC
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []models.CategoryStats
	for rows.Next() {
		var stat models.CategoryStats
		err := rows.Scan(
			&stat.ID, &stat.Name, &stat.Color, &stat.Icon, 
			&stat.PostCount, &stat.Trending,
		)
		if err != nil {
			return nil, err
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// UpdateCategoryPostCounts updates the post_count for all categories
func (s *CategoryService) UpdateCategoryPostCounts() error {
	query := `
		UPDATE categories SET post_count = (
			SELECT COUNT(*) FROM posts WHERE posts.category_id = categories.id
		) WHERE categories.is_active = true
	`
	
	_, err := s.db.Exec(query)
	return err
}

// IncrementCategoryPostCount increments the post count for a category
func (s *CategoryService) IncrementCategoryPostCount(categoryID uint) error {
	query := `UPDATE categories SET post_count = post_count + 1, updated_at = ? WHERE id = ?`
	_, err := s.db.Exec(query, time.Now(), categoryID)
	return err
}

// DecrementCategoryPostCount decrements the post count for a category
func (s *CategoryService) DecrementCategoryPostCount(categoryID uint) error {
	query := `UPDATE categories SET post_count = post_count - 1, updated_at = ? WHERE id = ?`
	_, err := s.db.Exec(query, time.Now(), categoryID)
	return err
}

// SearchCategories searches categories by name
func (s *CategoryService) SearchCategories(searchTerm string) ([]models.CategoryResponse, error) {
	query := `
		SELECT id, name, description, color, icon, is_active, post_count, created_at, updated_at
		FROM categories 
		WHERE is_active = true AND (name LIKE ? OR description LIKE ?)
		ORDER BY post_count DESC, name ASC
	`
	
	searchPattern := "%" + searchTerm + "%"
	rows, err := s.db.Query(query, searchPattern, searchPattern)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.CategoryResponse
	for rows.Next() {
		var category models.Category
		err := rows.Scan(
			&category.ID, &category.Name, &category.Description, &category.Color,
			&category.Icon, &category.IsActive, &category.PostCount,
			&category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		categories = append(categories, models.CategoryResponse{
			ID:          category.ID,
			Name:        category.Name,
			Description: category.Description,
			Color:       category.Color,
			Icon:        category.Icon,
			IsActive:    category.IsActive,
			PostCount:   category.PostCount,
			CreatedAt:   category.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   category.UpdatedAt.Format(time.RFC3339),
		})
	}

	return categories, nil
}