package handlers

import (
"database/sql"
"encoding/json"
"net/http"
"social/models"
"social/services"
"social/utils"
"time"
)

type AuthHandler struct {
userService    *services.UserService
sessionService *services.SessionService
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
return &AuthHandler{
userService:    services.NewUserService(db),
sessionService: services.NewSessionService(db),
}
}


func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

var req models.RegisterRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeError(w, http.StatusBadRequest, err.Error())
return
}

// Check if user already exists
existingUser, err := h.userService.GetUserByEmail(req.Email)
if err == nil && existingUser != nil {
writeError(w, http.StatusConflict, "User with this email already exists")
return
}

// Hash password
hashedPassword, err := utils.HashPassword(req.Password)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to hash password")
return
}

// Create user
user := &models.User{
Email:       req.Email,
Password:    hashedPassword,
FirstName:   req.FirstName,
LastName:    req.LastName,
DateOfBirth: req.DateOfBirth,
}

// Handle optional fields
if req.Nickname != "" {
user.Nickname = &req.Nickname
}
if req.AboutMe != "" {
user.AboutMe = &req.AboutMe
}

if err := h.userService.CreateUser(user); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to create user")
return
}

// Create session with temporary ID to generate token
tempSession := &models.Session{
UserID:    user.ID,
ExpiresAt: time.Now().Add(30 * time.Minute),
}

// Generate token - we'll use 0 as temporary session ID, then update
token, err := utils.GenerateToken(user.ID, user.Email, 0)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to generate token")
return
}

// Set token in session before creating
tempSession.Token = token

if err := h.sessionService.CreateSession(tempSession); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to create session")
return
}

// Now generate the final token with correct session ID
finalToken, err := utils.GenerateToken(user.ID, user.Email, tempSession.ID)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to generate final token")
return
}

// Update session with final token
tempSession.Token = finalToken
if err := h.sessionService.UpdateSessionToken(tempSession); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to save session")
return
}

response := models.AuthResponse{
Token: finalToken,
User:  user.ToResponse(),
}

writeJSON(w, http.StatusCreated, response)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

var req models.LoginRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeError(w, http.StatusBadRequest, err.Error())
return
}

// Find user by email
user, err := h.userService.GetUserByEmail(req.Email)
if err != nil {
writeError(w, http.StatusUnauthorized, "Invalid credentials")
return
}

// Check password
if !utils.CheckPassword(req.Password, user.Password) {
writeError(w, http.StatusUnauthorized, "Invalid credentials")
return
}

// Invalidate existing sessions for this user
h.sessionService.DeleteUserSessions(user.ID)

// Create new session with temporary token
tempSession := &models.Session{
UserID:    user.ID,
ExpiresAt: time.Now().Add(30 * time.Minute),
}

// Generate temporary token
tempToken, err := utils.GenerateToken(user.ID, user.Email, 0)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to generate token")
return
}

tempSession.Token = tempToken

if err := h.sessionService.CreateSession(tempSession); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to create session")
return
}

// Generate final token with correct session ID
finalToken, err := utils.GenerateToken(user.ID, user.Email, tempSession.ID)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to generate final token")
return
}

// Update session with final token
tempSession.Token = finalToken
if err := h.sessionService.UpdateSessionToken(tempSession); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to save session")
return
}

response := models.AuthResponse{
Token: finalToken,
User:  user.ToResponse(),
}

writeJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodGet {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

userID := r.Context().Value("user_id")
if userID == nil {
writeError(w, http.StatusUnauthorized, "User not authenticated")
return
}

user, err := h.userService.GetUserByID(userID.(uint))
if err != nil {
writeError(w, http.StatusNotFound, "User not found")
return
}

writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

sessionID := r.Context().Value("session_id")
if sessionID == nil {
writeError(w, http.StatusUnauthorized, "No active session")
return
}

// Delete the session
if err := h.sessionService.DeleteSession(sessionID.(uint)); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to logout")
return
}

writeJSON(w, http.StatusOK, map[string]string{"message": "Successfully logged out"})
}
