package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Venue represents a venue where events can be held
// @Description Venue information and details
type Venue struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string         `json:"name" gorm:"not null" example:"Grand Hotel Ballroom"`
	Description string         `json:"description" example:"Elegant ballroom with modern amenities"`
	Address     string         `json:"address" gorm:"not null" example:"123 Main Street"`
	City        string         `json:"city" gorm:"not null" example:"New York"`
	State       string         `json:"state" gorm:"not null" example:"NY"`
	Country     string         `json:"country" gorm:"not null" example:"USA"`
	PostalCode  string         `json:"postal_code" gorm:"not null" example:"10001"`
	Phone       *string        `json:"phone" example:"+1-555-123-4567"`
	Website     *string        `json:"website" example:"https://grandhotel.com"`
	OwnerID     uuid.UUID      `json:"owner_id" gorm:"type:uuid;not null"`
	Owner       User           `json:"owner" gorm:"foreignKey:OwnerID"`
	IsPublic    bool           `json:"is_public" gorm:"default:false"`
	Rooms       []Room         `json:"rooms" gorm:"foreignKey:VenueID"`
	CreatedAt   time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt   time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateVenueRequest represents the request body for venue creation
// @Description Venue creation request data
type CreateVenueRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=255" example:"Grand Hotel Ballroom"`
	Description string  `json:"description" validate:"max=1000" example:"Elegant ballroom with modern amenities"`
	Address     string  `json:"address" validate:"required,max=255" example:"123 Main Street"`
	City        string  `json:"city" validate:"required,max=100" example:"New York"`
	State       string  `json:"state" validate:"required,max=100" example:"NY"`
	Country     string  `json:"country" validate:"required,max=100" example:"USA"`
	PostalCode  string  `json:"postal_code" validate:"required,max=20" example:"10001"`
	Phone       *string `json:"phone" validate:"omitempty,max=20" example:"+1-555-123-4567"`
	Website     *string `json:"website" validate:"omitempty,url,max=255" example:"https://grandhotel.com"`
	IsPublic    bool    `json:"is_public" example:"false"`
}

// UpdateVenueRequest represents the request body for venue updates
// @Description Venue update request data
type UpdateVenueRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=1,max=255" example:"Grand Hotel Ballroom"`
	Description *string `json:"description" validate:"omitempty,max=1000" example:"Elegant ballroom with modern amenities"`
	Address     *string `json:"address" validate:"omitempty,max=255" example:"123 Main Street"`
	City        *string `json:"city" validate:"omitempty,max=100" example:"New York"`
	State       *string `json:"state" validate:"omitempty,max=100" example:"NY"`
	Country     *string `json:"country" validate:"omitempty,max=100" example:"USA"`
	PostalCode  *string `json:"postal_code" validate:"omitempty,max=20" example:"10001"`
	Phone       *string `json:"phone" validate:"omitempty,max=20" example:"+1-555-123-4567"`
	Website     *string `json:"website" validate:"omitempty,url,max=255" example:"https://grandhotel.com"`
	IsPublic    *bool   `json:"is_public" example:"true"`
}

// VenueResponse represents the response for venue operations
// @Description Venue response data
type VenueResponse struct {
	Venue *Venue `json:"venue"`
}

// VenuesResponse represents the response for multiple venues
// @Description Multiple venues response data
type VenuesResponse struct {
	Venues []Venue `json:"venues"`
	Total  int     `json:"total"`
}
