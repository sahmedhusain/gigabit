package models

type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	FirstName   string `json:"firstName" binding:"required,min=1,max=50"`
	LastName    string `json:"lastName" binding:"required,min=1,max=50"`
	DateOfBirth string `json:"dateOfBirth" binding:"required"`
	Nickname    string `json:"nickname" binding:"max=30"`
	AboutMe     string `json:"aboutMe" binding:"max=500"`
	Avatar      string `json:"avatar" binding:"max=100"`
	Gender      string `json:"gender" binding:"required,oneof=male female"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UpdateProfileRequest struct {
	FirstName   string  `json:"first_name" binding:"max=50"`
	LastName    string  `json:"last_name" binding:"max=50"`
	Email       string  `json:"email" binding:"email"`
	Nickname    string  `json:"nickname" binding:"max=30"`
	DateOfBirth string  `json:"date_of_birth"`
	Bio         string  `json:"bio" binding:"max=500"`
	AvatarURL   *string `json:"avatar_url"`
	Gender      string  `json:"gender" binding:"omitempty,oneof=male female other prefer_not_to_say"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}
