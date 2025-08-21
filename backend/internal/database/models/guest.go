package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RSVPStatus represents the RSVP status of a guest
type RSVPStatus string

const (
	RSVPStatusPending RSVPStatus = "pending"
	RSVPStatusAccept  RSVPStatus = "accept"
	RSVPStatusDecline RSVPStatus = "decline"
	RSVPStatusMaybe   RSVPStatus = "maybe"
)

// GuestSource represents how a guest was added to an event
type GuestSource string

const (
	GuestSourceOwnerAdded GuestSource = "owner_added" // Added by owner manually
	GuestSourceInvitation GuestSource = "invitation"  // Registered via invitation
	GuestSourceSelfRSVP   GuestSource = "self_rsvp"   // Self-registered (public events only)
)

// Guest represents a guest at an event
// @Description Guest information and RSVP status
type Guest struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	EventID uuid.UUID `json:"event_id" gorm:"type:uuid;not null"`
	Event   Event     `json:"event" gorm:"foreignKey:EventID"`

	// Guest Information
	Name  string  `json:"name" gorm:"not null" example:"John Doe"`
	Email string  `json:"email" gorm:"index" example:"john.doe@example.com"`
	Phone *string `json:"phone" gorm:"index" example:"+1234567890"`
	Notes *string `json:"notes" example:"Vegetarian, allergic to nuts"`

	// RSVP Status
	RSVPStatus RSVPStatus `json:"rsvp_status" gorm:"not null;default:'pending'"`
	RSVPDate   *time.Time `json:"rsvp_date" example:"2024-01-15T10:30:00Z"`

	// Seating (for future implementation)
	SeatID *uuid.UUID `json:"seat_id" gorm:"type:uuid"`
	Seat   *Seat      `json:"seat" gorm:"foreignKey:SeatID"`

	// Source and Approval
	Source   GuestSource `json:"source" gorm:"not null;default:'owner_added'"`
	Approved bool        `json:"approved" gorm:"default:true"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateGuestRequest represents the request body for guest creation
// @Description Guest creation request data
type CreateGuestRequest struct {
	Name  string  `json:"name" validate:"required,min=1,max=255" example:"John Doe"`
	Email string  `json:"email" validate:"required,email" example:"john.doe@example.com"`
	Phone *string `json:"phone" validate:"omitempty,max=20" example:"+1234567890"`
	Notes *string `json:"notes" validate:"omitempty,max=1000" example:"Vegetarian, allergic to nuts"`
}

// UpdateGuestRequest represents the request body for guest updates
// @Description Guest update request data
type UpdateGuestRequest struct {
	Name       *string     `json:"name" validate:"omitempty,min=1,max=255" example:"John Doe"`
	Email      *string     `json:"email" validate:"omitempty,email" example:"john.doe@example.com"`
	Phone      *string     `json:"phone" validate:"omitempty,max=20" example:"+1234567890"`
	Notes      *string     `json:"notes" validate:"omitempty,max=1000" example:"Vegetarian, allergic to nuts"`
	RSVPStatus *RSVPStatus `json:"rsvp_status" validate:"omitempty,oneof=pending accept decline maybe" example:"accept"`
}

// UpdateGuestRSVPRequest represents the request body for RSVP updates
// @Description Guest RSVP update request data
type UpdateGuestRSVPRequest struct {
	RSVPStatus RSVPStatus `json:"rsvp_status" validate:"required,oneof=pending accept decline maybe" example:"accept"`
	Notes      *string    `json:"notes" validate:"omitempty,max=1000" example:"Looking forward to it!"`
}

// GuestResponse represents the response for guest operations
// @Description Guest response data
type GuestResponse struct {
	Guest *Guest `json:"guest"`
}

// GuestsResponse represents the response for multiple guests
// @Description Multiple guests response data
type GuestsResponse struct {
	Guests []Guest `json:"guests"`
	Total  int     `json:"total"`
}

// GuestRSVPResponse represents the response for RSVP operations
// @Description Guest RSVP response data
type GuestRSVPResponse struct {
	Guest   *Guest `json:"guest"`
	Message string `json:"message" example:"RSVP updated successfully"`
}

// GuestSummary represents a summary of guest RSVP statuses
// @Description Guest RSVP summary data
type GuestSummary struct {
	TotalGuests      int64   `json:"total_guests"`
	Confirmed        int64   `json:"confirmed"`
	Declined         int64   `json:"declined"`
	Pending          int64   `json:"pending"`
	Maybe            int64   `json:"maybe"`
	ConfirmationRate float64 `json:"confirmation_rate"`
}
