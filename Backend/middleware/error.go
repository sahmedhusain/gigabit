package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	Details string `json:"details,omitempty"`
}

// ErrorHandler is a middleware that handles errors in a consistent way
func ErrorHandler() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		c.Next()

		// Check if there are any errors to handle
		if len(c.Errors) > 0 {
			err := c.Errors.Last()

			// Default to internal server error
			status := http.StatusInternalServerError
			errorResponse := ErrorResponse{
				Error: "Internal server error",
				Code:  "INTERNAL_ERROR",
			}

			// Handle specific error types
			switch err.Type {
			case gin.ErrorTypeBind:
				status = http.StatusBadRequest
				errorResponse = ErrorResponse{
					Error:   "Invalid request data",
					Code:    "INVALID_REQUEST",
					Details: err.Error(),
				}
			case gin.ErrorTypePublic:
				status = http.StatusBadRequest
				errorResponse = ErrorResponse{
					Error: err.Error(),
					Code:  "BAD_REQUEST",
				}
			default:
				// Log the actual error for debugging
				gin.Logger()(c)
			}

			c.JSON(status, errorResponse)
		}
	})
}

// BadRequest sends a 400 error response
func BadRequest(c *gin.Context, message string, code string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

// Unauthorized sends a 401 error response
func Unauthorized(c *gin.Context, message string, code string) {
	c.JSON(http.StatusUnauthorized, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

// Forbidden sends a 403 error response
func Forbidden(c *gin.Context, message string, code string) {
	c.JSON(http.StatusForbidden, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

// NotFound sends a 404 error response
func NotFound(c *gin.Context, message string, code string) {
	c.JSON(http.StatusNotFound, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

// InternalServerError sends a 500 error response
func InternalServerError(c *gin.Context, message string, code string) {
	c.JSON(http.StatusInternalServerError, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

// ServiceUnavailable sends a 503 error response
func ServiceUnavailable(c *gin.Context, message string, code string) {
	c.JSON(http.StatusServiceUnavailable, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

// ValidationError represents a validation error response
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
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
