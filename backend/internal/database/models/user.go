package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user in the system
// @Description User account information
type User struct {
	ID         uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	Email      string         `json:"email" gorm:"uniqueIndex;not null" example:"john.doe@example.com"`
	Password   string         `json:"-" gorm:"not null"`
	FirstName  string         `json:"first_name" gorm:"not null" example:"John"`
	LastName   string         `json:"last_name" gorm:"not null" example:"Doe"`
	Phone      *string        `json:"phone" gorm:"index" example:"+1234567890"`
	ProfilePic *string        `json:"profile_pic" example:"https://example.com/profile.jpg"`
	CreatedAt  time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt  time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateUserRequest represents the request body for user registration
// @Description User registration request data
type CreateUserRequest struct {
	Email     string `json:"email" validate:"required,email" example:"john.doe@example.com"`
	Password  string `json:"password" validate:"required,min=6" example:"password123"`
	FirstName string `json:"first_name" validate:"required" example:"John"`
	LastName  string `json:"last_name" validate:"required" example:"Doe"`
	Phone     string `json:"phone" validate:"omitempty" example:"+1234567890"`
}

// SignInRequest represents the request body for user authentication
// @Description User login request data
type SignInRequest struct {
	Email    string `json:"email" validate:"required,email" example:"john.doe@example.com"`
	Password string `json:"password" validate:"required" example:"password123"`
}

// AuthResponse represents the response after successful authentication
// @Description Authentication response with user data and JWT token
type AuthResponse struct {
	User  *User  `json:"user"`
	Token string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// UpdateProfileRequest represents the request body for profile updates
// @Description Profile update request data
type UpdateProfileRequest struct {
	FirstName  string `json:"first_name" validate:"required" example:"John"`
	LastName   string `json:"last_name" validate:"required" example:"Doe"`
	Phone      string `json:"phone" validate:"omitempty" example:"+1234567890"`
	ProfilePic string `json:"profile_pic" validate:"omitempty,url" example:"https://example.com/profile.jpg"`
}

// ChangePasswordRequest represents the request body for password changes
// @Description Password change request data
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required" example:"oldpassword123"`
	NewPassword     string `json:"new_password" validate:"required,min=6" example:"newpassword123"`
}
