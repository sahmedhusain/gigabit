package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorHandler middleware for handling panics and errors
func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			log.Printf("Panic recovered: %s", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Internal server error",
			})
		}
		c.AbortWithStatus(http.StatusInternalServerError)
	})
}

// ValidationError represents a validation error response
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Error   string            `json:"error"`
	Details []ValidationError `json:"details,omitempty"`
}

// HandleValidationErrors processes Gin validation errors
func HandleValidationErrors(err error) []ValidationError {
	var validationErrors []ValidationError
	
	// This is a simplified version - in production you might want to use
	// github.com/go-playground/validator/v10 to get more detailed error info
	validationErrors = append(validationErrors, ValidationError{
		Field:   "unknown",
		Message: err.Error(),
	})
	
	return validationErrors
}
