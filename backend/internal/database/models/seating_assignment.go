package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SeatingAssignment represents the assignment of a guest to a specific seat for an event
// @Description Seating assignment information and details
type SeatingAssignment struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	EventID        uuid.UUID      `json:"event_id" gorm:"type:uuid;not null"`
	Event          Event          `json:"event" gorm:"foreignKey:EventID"`
	GuestID        uuid.UUID      `json:"guest_id" gorm:"type:uuid;not null"`
	Guest          Guest          `json:"guest" gorm:"foreignKey:GuestID"`
	SeatID         uuid.UUID      `json:"seat_id" gorm:"type:uuid;not null"`
	Seat           Seat           `json:"seat" gorm:"foreignKey:SeatID"`
	AssignedBy     uuid.UUID      `json:"assigned_by" gorm:"type:uuid;not null"`
	AssignedByUser User           `json:"assigned_by_user" gorm:"foreignKey:AssignedBy"`
	AssignedAt     time.Time      `json:"assigned_at"`
	Notes          *string        `json:"notes" example:"VIP guest - front row preference"`
	CreatedAt      time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt      time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateSeatingAssignmentRequest represents the request body for seating assignment creation
// @Description Seating assignment creation request data
type CreateSeatingAssignmentRequest struct {
	GuestID uuid.UUID `json:"guest_id" validate:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	SeatID  uuid.UUID `json:"seat_id" validate:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	Notes   *string   `json:"notes" validate:"omitempty,max=500" example:"VIP guest - front row preference"`
}

// UpdateSeatingAssignmentRequest represents the request body for seating assignment updates
// @Description Seating assignment update request data
type UpdateSeatingAssignmentRequest struct {
	SeatID *uuid.UUID `json:"seat_id" validate:"omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	Notes  *string    `json:"notes" validate:"omitempty,max=500" example:"Updated seating preference"`
}

// SeatingAssignmentResponse represents the response for seating assignment operations
// @Description Seating assignment response data
type SeatingAssignmentResponse struct {
	SeatingAssignment *SeatingAssignment `json:"seating_assignment"`
}

// SeatingAssignmentsResponse represents the response for multiple seating assignments
// @Description Multiple seating assignments response data
type SeatingAssignmentsResponse struct {
	SeatingAssignments []SeatingAssignment `json:"seating_assignments"`
	Total              int                 `json:"total"`
}

// SeatingChartResponse represents the response for a complete seating chart
// @Description Seating chart response data
type SeatingChartResponse struct {
	EventID            uuid.UUID           `json:"event_id"`
	EventName          string              `json:"event_name"`
	VenueID            uuid.UUID           `json:"venue_id"`
	VenueName          string              `json:"venue_name"`
	RoomID             uuid.UUID           `json:"room_id"`
	RoomName           string              `json:"room_name"`
	SeatingAssignments []SeatingAssignment `json:"seating_assignments"`
	TotalSeats         int                 `json:"total_seats"`
	AssignedSeats      int                 `json:"assigned_seats"`
	AvailableSeats     int                 `json:"available_seats"`
}
