package handlers

import (
"database/sql"
"encoding/json"
"net/http"
"social/middleware"
"social/models"
"social/services"
"strconv"
)

type UserHandler struct {
userService *services.UserService
db          *sql.DB
}

func NewUserHandler(db *sql.DB) *UserHandler {
return &UserHandler{
userService: services.NewUserService(db),
db:          db,
}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request, userIDParam string) {
if r.Method != http.MethodGet {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

userID, err := strconv.ParseUint(userIDParam, 10, 32)
if err != nil {
writeError(w, http.StatusBadRequest, "Invalid user ID")
return
}

user, err := h.userService.GetUserByID(uint(userID))
if err != nil {
writeError(w, http.StatusNotFound, "User not found")
return
}

writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPut {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

userID, exists := middleware.GetUserID(r)
if !exists {
writeError(w, http.StatusUnauthorized, "User not authenticated")
return
}

var req models.UpdateProfileRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeError(w, http.StatusBadRequest, err.Error())
return
}

user, err := h.userService.GetUserByID(userID)
if err != nil {
writeError(w, http.StatusNotFound, "User not found")
return
}

// Update fields if provided
if req.FirstName != "" {
user.FirstName = req.FirstName
}
if req.LastName != "" {
user.LastName = req.LastName
}
if req.Bio != "" {
user.AboutMe = &req.Bio
}
if req.AvatarURL != "" {
user.Avatar = &req.AvatarURL
}

if err := h.userService.UpdateUser(user); err != nil {
writeError(w, http.StatusInternalServerError, "Failed to update profile")
return
}

writeJSON(w, http.StatusOK, user.ToResponse())
}

func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodGet {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

query := r.URL.Query().Get("q")
if query == "" {
writeError(w, http.StatusBadRequest, "Search query is required")
return
}

users, err := h.userService.SearchUsers(query, 20)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to search users")
return
}

var responses []models.UserResponse
for _, user := range users {
responses = append(responses, user.ToResponse())
}

writeJSON(w, http.StatusOK, map[string]interface{}{"users": responses})
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodGet {
writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
return
}

userID, exists := middleware.GetUserID(r)
if !exists {
writeError(w, http.StatusUnauthorized, "User not authenticated")
return
}

// Get all users except the current user
query := `
SELECT id, email, first_name, last_name, avatar, nickname
FROM users 
WHERE id != ? 
ORDER BY first_name, last_name
LIMIT 50
`

rows, err := h.db.Query(query, userID)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to get users")
return
}
defer rows.Close()

var users []map[string]interface{}
for rows.Next() {
var user struct {
ID        uint    `json:"id"`
Email     string  `json:"email"`
FirstName string  `json:"first_name"`
LastName  string  `json:"last_name"`
Avatar    *string `json:"avatar"`
Nickname  *string `json:"nickname"`
}

err := rows.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname)
if err != nil {
continue
}

displayName := user.FirstName + " " + user.LastName
if user.Nickname != nil && *user.Nickname != "" {
displayName = *user.Nickname + " (" + displayName + ")"
}

users = append(users, map[string]interface{}{
"id":           user.ID,
"first_name":   user.FirstName,
"last_name":    user.LastName,
"email":        user.Email,
"avatar":       user.Avatar,
"nickname":     user.Nickname,
"display_name": displayName,
})
}

writeJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}
