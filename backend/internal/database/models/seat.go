package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SeatCategory represents the category of a seat
type SeatCategory string

const (
	SeatCategoryStandard   SeatCategory = "standard"
	SeatCategoryVIP        SeatCategory = "vip"
	SeatCategoryAccessible SeatCategory = "accessible"
	SeatCategoryPremium    SeatCategory = "premium"
	SeatCategoryEconomy    SeatCategory = "economy"
	SeatCategoryStanding   SeatCategory = "standing"
)

// SeatStatus represents the current status of a seat
type SeatStatus string

const (
	SeatStatusAvailable   SeatStatus = "available"
	SeatStatusOccupied    SeatStatus = "occupied"
	SeatStatusReserved    SeatStatus = "reserved"
	SeatStatusBlocked     SeatStatus = "blocked"
	SeatStatusMaintenance SeatStatus = "maintenance"
)

// Seat represents a seat within a room
// @Description Seat information and details
type Seat struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	EventID   uuid.UUID      `json:"event_id" gorm:"type:uuid;not null"`
	Event     Event          `json:"event" gorm:"foreignKey:EventID"`
	RoomID    uuid.UUID      `json:"room_id" gorm:"type:uuid;not null"`
	Room      Room           `json:"room" gorm:"foreignKey:RoomID"`
	Row       string         `json:"row" gorm:"column:row_number;not null" example:"A"`
	Number    string         `json:"number" gorm:"column:seat_number;not null" example:"1"`
	Column    string         `json:"column" gorm:"column:column_number;not null" example:"1"`
	Category  SeatCategory   `json:"category" gorm:"not null;default:'standard'"`
	Status    SeatStatus     `json:"status" gorm:"not null;default:'available'"`
	GuestID   *uuid.UUID     `json:"guest_id" gorm:"type:uuid"`
	Guest     *Guest         `json:"guest" gorm:"foreignKey:GuestID"`
	X         float64        `json:"x" gorm:"type:decimal(10,2)" example:"10.5"` // Position X coordinate
	Y         float64        `json:"y" gorm:"type:decimal(10,2)" example:"15.2"` // Position Y coordinate
	Width     float64        `json:"width" gorm:"type:decimal(10,2);default:1.0" example:"1.0"`
	Height    float64        `json:"height" gorm:"type:decimal(10,2);default:1.0" example:"1.0"`
	Rotation  float64        `json:"rotation" gorm:"type:decimal(5,2);default:0.0" example:"0.0"`
	CreatedAt time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateSeatRequest represents the request body for seat creation
// @Description Seat creation request data
type CreateSeatRequest struct {
	EventID  uuid.UUID    `json:"event_id" validate:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	Row      string       `json:"row" validate:"required,min=1,max=10" example:"A"`
	Number   string       `json:"number" validate:"required,min=1,max=10" example:"1"`
	Column   string       `json:"column" validate:"required,min=1,max=10" example:"1"`
	Category SeatCategory `json:"category" validate:"required,oneof=standard vip accessible premium economy standing" example:"standard"`
	Status   SeatStatus   `json:"status" validate:"required,oneof=available occupied reserved blocked maintenance" example:"available"`
	X        float64      `json:"x" validate:"required" example:"10.5"`
	Y        float64      `json:"y" validate:"required" example:"15.2"`
	Width    float64      `json:"width" validate:"min=0.1" example:"1.0"`
	Height   float64      `json:"height" validate:"min=0.1" example:"1.0"`
	Rotation float64      `json:"rotation" example:"0.0"`
}

// CreateSeatGridRequest represents the request body for creating a grid of seats
// @Description Seat grid creation request data
type CreateSeatGridRequest struct {
	EventID     uuid.UUID    `json:"event_id" validate:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	StartRow    string       `json:"start_row" validate:"required,min=1,max=10" example:"A"`
	EndRow      string       `json:"end_row" validate:"required,min=1,max=10" example:"Z"`
	StartNumber int          `json:"start_number" validate:"required,min=1" example:"1"`
	EndNumber   int          `json:"end_number" validate:"required,min=1" example:"20"`
	StartColumn int          `json:"start_column" validate:"required,min=1" example:"1"`
	EndColumn   int          `json:"end_column" validate:"required,min=1" example:"10"`
	Category    SeatCategory `json:"category" validate:"required,oneof=standard vip accessible premium economy standing" example:"standard"`
	SpacingX    float64      `json:"spacing_x" validate:"required,min=0.1" example:"1.2"`
	SpacingY    float64      `json:"spacing_y" validate:"required,min=0.1" example:"1.2"`
	StartX      float64      `json:"start_x" validate:"required" example:"0.0"`
	StartY      float64      `json:"start_y" validate:"required" example:"0.0"`
}

// UpdateSeatRequest represents the request body for seat updates
// @Description Seat update request data
type UpdateSeatRequest struct {
	Row      *string       `json:"row" validate:"omitempty,min=1,max=10" example:"B"`
	Number   *string       `json:"number" validate:"omitempty,min=1,max=10" example:"2"`
	Column   *string       `json:"column" validate:"omitempty,min=1,max=10" example:"2"`
	Category *SeatCategory `json:"category" validate:"omitempty,oneof=standard vip accessible premium economy standing" example:"vip"`
	Status   *SeatStatus   `json:"status" validate:"omitempty,oneof=available occupied reserved blocked maintenance" example:"reserved"`
	X        *float64      `json:"x" example:"12.0"`
	Y        *float64      `json:"y" example:"18.0"`
	Width    *float64      `json:"width" validate:"omitempty,min=0.1" example:"1.2"`
	Height   *float64      `json:"height" validate:"omitempty,min=0.1" example:"1.2"`
	Rotation *float64      `json:"rotation" example:"45.0"`
}

// SeatResponse represents the response for seat operations
// @Description Seat response data
type SeatResponse struct {
	Seat *Seat `json:"seat"`
}

// SeatsResponse represents the response for multiple seats
// @Description Multiple seats response data
type SeatsResponse struct {
	Seats []Seat `json:"seats"`
	Total int    `json:"total"`
}
