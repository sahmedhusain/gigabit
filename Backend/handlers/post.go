package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// TODO: Refactor PostHandler to use pure SQL instead of GORM
type PostHandler struct {
	DB *sql.DB
}

func NewPostHandler(db *sql.DB) *PostHandler {
	return &PostHandler{DB: db}
}

// TODO: Implement with pure SQL
func (h *PostHandler) CreatePost(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented - needs pure SQL refactor"})
}

func (h *PostHandler) GetPost(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented - needs pure SQL refactor"})
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented - needs pure SQL refactor"})
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented - needs pure SQL refactor"})
}

func (h *PostHandler) LikePost(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented - needs pure SQL refactor"})
}
