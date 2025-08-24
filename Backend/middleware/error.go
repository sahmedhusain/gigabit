package middleware

import (
"encoding/json"
"log"
"net/http"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
Error   string `json:"error"`
Code    string `json:"code,omitempty"`
Details string `json:"details,omitempty"`
}

// ErrorHandler is a middleware that handles errors in a consistent way
func ErrorHandler() func(http.Handler) http.Handler {
return func(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
defer func() {
if err := recover(); err != nil {
log.Printf("Panic recovered: %v", err)
writeErrorResponse(w, http.StatusInternalServerError, ErrorResponse{
Error: "Internal server error",
Code:  "INTERNAL_ERROR",
})
}
}()

next.ServeHTTP(w, r)
})
}
}

// Helper function to write error responses
func writeErrorResponse(w http.ResponseWriter, status int, errorResponse ErrorResponse) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(status)
json.NewEncoder(w).Encode(errorResponse)
}

// BadRequest sends a 400 error response
func BadRequest(w http.ResponseWriter, message string, code string) {
writeErrorResponse(w, http.StatusBadRequest, ErrorResponse{
Error: message,
Code:  code,
})
}

// Unauthorized sends a 401 error response
func Unauthorized(w http.ResponseWriter, message string, code string) {
writeErrorResponse(w, http.StatusUnauthorized, ErrorResponse{
Error: message,
Code:  code,
})
}

// Forbidden sends a 403 error response
func Forbidden(w http.ResponseWriter, message string, code string) {
writeErrorResponse(w, http.StatusForbidden, ErrorResponse{
Error: message,
Code:  code,
})
}

// NotFound sends a 404 error response
func NotFound(w http.ResponseWriter, message string, code string) {
writeErrorResponse(w, http.StatusNotFound, ErrorResponse{
Error: message,
Code:  code,
})
}

// InternalServerError sends a 500 error response
func InternalServerError(w http.ResponseWriter, message string, code string) {
writeErrorResponse(w, http.StatusInternalServerError, ErrorResponse{
Error: message,
Code:  code,
})
}

// ServiceUnavailable sends a 503 error response
func ServiceUnavailable(w http.ResponseWriter, message string, code string) {
writeErrorResponse(w, http.StatusServiceUnavailable, ErrorResponse{
Error: message,
Code:  code,
})
}

// ValidationError represents a validation error response
type ValidationError struct {
Field   string `json:"field"`
Message string `json:"message"`
}

// HandleValidationErrors processes validation errors
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
