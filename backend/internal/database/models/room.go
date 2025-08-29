package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RoomType represents the type of room
type RoomType string

const (
	RoomTypeGeneral    RoomType = "general"
	RoomTypeBallroom   RoomType = "ballroom"
	RoomTypeConference RoomType = "conference"
	RoomTypeTheater    RoomType = "theater"
	RoomTypeBanquet    RoomType = "banquet"
	RoomTypeOutdoor    RoomType = "outdoor"
)

// Room represents a room within a venue
// @Description Room information and details
type Room struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	VenueID     uuid.UUID      `json:"venue_id" gorm:"type:uuid;not null"`
	Venue       Venue          `json:"venue" gorm:"foreignKey:VenueID"`
	Name        string         `json:"name" gorm:"not null" example:"Main Ballroom"`
	Description string         `json:"description" example:"Spacious ballroom with high ceilings"`
	Capacity    int            `json:"capacity" gorm:"not null" example:"200"`
	Floor       int            `json:"floor" gorm:"default:1" example:"1"`
	RoomType    RoomType       `json:"room_type" gorm:"not null;default:'general'"`
	Seats       []Seat         `json:"seats" gorm:"foreignKey:RoomID"`
	CreatedAt   time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt   time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateRoomRequest represents the request body for room creation
// @Description Room creation request data
type CreateRoomRequest struct {
	Name        string   `json:"name" validate:"required,min=1,max=255" example:"Main Ballroom"`
	Description string   `json:"description" validate:"max=1000" example:"Spacious ballroom with high ceilings"`
	Capacity    int      `json:"capacity" validate:"required,min=1" example:"200"`
	Floor       int      `json:"floor" validate:"min=0" example:"1"`
	RoomType    RoomType `json:"room_type" validate:"required,oneof=general ballroom conference theater banquet outdoor" example:"ballroom"`
}

// UpdateRoomRequest represents the request body for room updates
// @Description Room update request data
type UpdateRoomRequest struct {
	Name        *string   `json:"name" validate:"omitempty,min=1,max=255" example:"Main Ballroom"`
	Description *string   `json:"description" validate:"omitempty,max=1000" example:"Spacious ballroom with high ceilings"`
	Capacity    *int      `json:"capacity" validate:"omitempty,min=1" example:"250"`
	Floor       *int      `json:"floor" validate:"omitempty,min=0" example:"1"`
	RoomType    *RoomType `json:"room_type" validate:"omitempty,oneof=general ballroom conference theater banquet outdoor" example:"ballroom"`
}

// RoomResponse represents the response for room operations
// @Description Room response data
type RoomResponse struct {
	Room *Room `json:"room"`
}

// RoomsResponse represents the response for multiple rooms
// @Description Multiple rooms response data
type RoomsResponse struct {
	Rooms []Room `json:"rooms"`
	Total int    `json:"total"`
}
