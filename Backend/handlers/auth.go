package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"time"

	"social/models"
	"social/services"
	"social/utils"
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

	// Debug log
	log.Printf("Received registration request - Avatar length: %d", len(req.Avatar))
	if req.Avatar != "" {
		log.Printf("Avatar starts with: %s", req.Avatar[:min(50, len(req.Avatar))])
	}

	// Basic validation
	if len(req.FirstName) < 3 {
		writeError(w, http.StatusBadRequest, "First name must be at least 3 characters long")
		return
	}

	if len(req.FirstName) > 16 {
		writeError(w, http.StatusBadRequest, "First name is too long")
		return
	}

	if len(req.LastName) < 3 {
		writeError(w, http.StatusBadRequest, "Last name must be at least 3 characters long")
		return
	}

	if len(req.LastName) > 16 {
		writeError(w, http.StatusBadRequest, "Last name is too long")
		return
	}

	// Validate email format
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9!#$%&'*+/=?^_` + "`" + `{|}~]+(\.[a-zA-Z0-9!#$%&'*+/=?^_` + "`" + `{|}~]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		writeError(w, http.StatusBadRequest, "Please enter a valid email address")
		return
	}

	// Check if email already exists
	existingUser, err := h.userService.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		writeError(w, http.StatusConflict, "User with this email already exists")
		return
	}

	err = validatePassword(req.Password)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	err = validateDoB(req.DateOfBirth)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if len(req.AboutMe) > 128 {
		writeError(w, http.StatusBadRequest, "Your bio is too long")
		return
	}

	// Generate nickname from email if not provided
	nickname := req.Nickname
	if nickname == "" {
		generatedNickname, err := h.userService.GenerateUniqueNickname(req.Email)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to generate username")
			return
		}
		nickname = generatedNickname
	} else {
		// Validate user-provided nickname length
		if len(nickname) > 16 {
			writeError(w, http.StatusBadRequest, "Nickname is too long")
			return
		}

		// Check if nickname already exists (only if user provided one)
		existingUser, err = h.userService.GetUserByNickname(nickname)
		if err == nil && existingUser != nil {
			writeError(w, http.StatusConflict, "User with this nickname already exists")
			return
		}
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
	if nickname != "" {
		user.Nickname = &nickname
	}
	if req.AboutMe != "" {
		user.AboutMe = &req.AboutMe
	}

	if req.Avatar != "" {
		user.Avatar = &req.Avatar
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

	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	if !emailRegex.MatchString(req.Email) {
		writeError(w, http.StatusBadRequest, "Please enter a valid email address")
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

func validatePassword(password string) error {
	upper := regexp.MustCompile(`[A-Z]`)
	lower := regexp.MustCompile(`[a-z]`)
	number := regexp.MustCompile(`[0-9]`)
	space := regexp.MustCompile(`\s`)
	var errMessages []string

	if len(password) < 8 || len(password) > 32 {
		errMessages = append(errMessages, "be between 8 and 32 characters long")
	}

	if !upper.MatchString(password) {
		errMessages = append(errMessages, "contain at least one uppercase letter")
	}

	if !lower.MatchString(password) {
		errMessages = append(errMessages, "contain at least one lowercase letter")
	}

	if !number.MatchString(password) {
		errMessages = append(errMessages, "contain at least one number")
	}

	if space.MatchString(password) {
		errMessages = append(errMessages, "not contain spaces")
	}

	log.Println("Password validation errors:", errMessages)

	if len(errMessages) > 0 {
		return errors.New("Password must " + joinWithCommas(errMessages))
	}

	return nil
}

func validateDoB(dobStr string) error {
	log.Println("Date of birth format:", dobStr)
	parsedDob, err := time.Parse("2006-01-02", dobStr)
	if err != nil {
		return errors.New("Date of birth must be in YYYY-MM-DD format")
	}
	today := time.Now()
	hundredYearsAgo := today.AddDate(-100, 0, 0)

	if parsedDob.After(today) {
		return errors.New("Date of birth cannot be in the future")
	}

	if parsedDob.Before(hundredYearsAgo) {
		return errors.New("Date of birth is too far in the past")
	}

	return nil
}

func joinWithCommas(messages []string) string {
	if len(messages) == 1 {
		return messages[0]
	}

	result := ""
	for i, msg := range messages {
		if i == len(messages)-1 {
			result += "and " + msg
		} else {
			result += msg + ", "
		}
	}
	return result
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	log.Println("GetMe handler invoked")
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		log.Println("GetMe: user_id not found in context")
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	log.Printf("GetMe: userID from context: %v", userID)

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		log.Printf("GetMe: user not found for ID %v: %v", userID, err)
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
