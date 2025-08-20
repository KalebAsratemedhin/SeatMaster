package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
// @Description User account information
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey" example:"1"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null" example:"john.doe@example.com"`
	Password  string         `json:"-" gorm:"not null"`
	FirstName string         `json:"first_name" gorm:"not null" example:"John"`
	LastName  string         `json:"last_name" gorm:"not null" example:"Doe"`
	CreatedAt time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateUserRequest represents the request body for user registration
// @Description User registration request data
type CreateUserRequest struct {
	Email     string `json:"email" validate:"required,email" example:"john.doe@example.com"`
	Password  string `json:"password" validate:"required,min=6" example:"password123"`
	FirstName string `json:"first_name" validate:"required" example:"John"`
	LastName  string `json:"last_name" validate:"required" example:"Doe"`
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
