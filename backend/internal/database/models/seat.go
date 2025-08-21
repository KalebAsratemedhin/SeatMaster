package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Seat represents a seat at an event
// @Description Seat information for event seating arrangements
type Seat struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	EventID uuid.UUID `json:"event_id" gorm:"type:uuid;not null"`
	Event   Event     `json:"event" gorm:"foreignKey:EventID"`

	// Seat Information
	SeatNumber   string  `json:"seat_number" gorm:"not null" example:"A1"`
	RowNumber    string  `json:"row_number" gorm:"not null" example:"A"`
	ColumnNumber int     `json:"column_number" gorm:"not null" example:"1"`
	Section      *string `json:"section" example:"Main Floor"`

	// Seating Status
	IsAvailable bool `json:"is_available" gorm:"default:true"`
	IsReserved  bool `json:"is_reserved" gorm:"default:false"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
