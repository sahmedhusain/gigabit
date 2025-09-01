package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"social/services"
	"social/utils"
	"strings"
	"time"
	//"log"
)

func AuthMiddleware(db *sql.DB) func(http.Handler) http.Handler {
	sessionService := services.NewSessionService(db)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			var tokenString string
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				// Try to get token from query param (for WebSocket)
				tokenString = r.URL.Query().Get("token")
				if tokenString == "" {
					writeError(w, http.StatusUnauthorized, "Authorization token required")
					return
				}
			}

			//log.Printf("AuthMiddleware - token: %s", tokenString)

			// Validate the token
			//log.Printf("AuthMiddleware - token present=%t len=%d", tokenString != "", len(tokenString))
			claims, err := utils.ValidateToken(tokenString)
			if err != nil {
				if err.Error() == "token expired" {
					//log.Printf("AuthMiddleware - token validation failed: expired")
					writeErrorWithCode(w, http.StatusUnauthorized, "Token expired", "TOKEN_EXPIRED")
				} else {
					//log.Printf("AuthMiddleware - token validation failed: %v", err)
					writeErrorWithCode(w, http.StatusUnauthorized, "Invalid token", "INVALID_TOKEN")
				}
				return
			}
			//log.Printf("AuthMiddleware - token validated, session=%v user=%v", claims.SessionID, claims.UserID)

			// Verify session exists and is valid
			session, err := sessionService.GetSessionByIDAndToken(claims.SessionID, tokenString)
			if err != nil {
				//log.Printf("AuthMiddleware - session lookup failed for session=%v err=%v", claims.SessionID, err)
				writeErrorWithCode(w, http.StatusUnauthorized, "Invalid session", "INVALID_SESSION")
				return
			}
			//log.Printf("AuthMiddleware - session lookup succeeded id=%v expires_at=%v", session.ID, session.ExpiresAt)
			//log.Printf("AuthMiddleware - session: %+v", session)

			// Check if session is expired
			if session.ExpiresAt.Before(time.Now()) {
				//log.Printf("AuthMiddleware - session expired id=%v expires_at=%v", session.ID, session.ExpiresAt)
				// Delete expired session
				sessionService.DeleteSession(session.ID)
				writeErrorWithCode(w, http.StatusUnauthorized, "Session expired", "SESSION_EXPIRED")
				return
			}

			// Set user information in context
			ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
			ctx = context.WithValue(ctx, "user_email", claims.Email)
			ctx = context.WithValue(ctx, "session_id", claims.SessionID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserID(r *http.Request) (uint, bool) {
	userID := r.Context().Value("user_id")
	if userID == nil {
		return 0, false
	}

	id, ok := userID.(uint)
	return id, ok
}

// Helper functions for JSON responses
func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func writeErrorWithCode(w http.ResponseWriter, status int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
		"code":  code,
	})
}
