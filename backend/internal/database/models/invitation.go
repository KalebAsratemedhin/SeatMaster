package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// InviteStatus represents the current status of an invitation
type InviteStatus string

const (
	InviteStatusSent      InviteStatus = "sent"
	InviteStatusAccepted  InviteStatus = "accepted"
	InviteStatusExpired   InviteStatus = "expired"
	InviteStatusCancelled InviteStatus = "cancelled"
)

// Invitation represents an invitation to an event
type Invitation struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EventID uuid.UUID `json:"event_id" gorm:"type:uuid;not null"`
	Event   Event     `json:"event" gorm:"foreignKey:EventID"`

	// Invitation Details
	Email     string       `json:"email" gorm:"not null;index"`
	Token     string       `json:"token" gorm:"uniqueIndex;not null"`
	Status    InviteStatus `json:"status" gorm:"not null;default:'sent'"`
	ExpiresAt time.Time    `json:"expires_at" gorm:"not null"`

	// Pre-filled Information (optional)
	PrefilledName  *string `json:"prefilled_name"`
	PrefilledPhone *string `json:"prefilled_phone"`
	PrefilledNotes *string `json:"prefilled_notes"`

	// Tracking
	SentAt     time.Time  `json:"sent_at"`
	AcceptedAt *time.Time `json:"accepted_at"`
	ExpiredAt  *time.Time `json:"expired_at"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateInvitationRequest represents the request to create an invitation
type CreateInvitationRequest struct {
	Email          string  `json:"email" binding:"required,email" example:"guest@example.com"`
	PrefilledName  *string `json:"prefilled_name" example:"John Doe"`
	PrefilledPhone *string `json:"prefilled_phone" example:"+1234567890"`
	PrefilledNotes *string `json:"prefilled_notes" example:"Vegetarian"`
	ExpiresInDays  int     `json:"expires_in_days" binding:"required,min=1,max=90" example:"30"`
}

// UpdateInvitationRequest represents the request to update an invitation
type UpdateInvitationRequest struct {
	PrefilledName  *string `json:"prefilled_name" example:"John Doe"`
	PrefilledPhone *string `json:"prefilled_phone" example:"+1234567890"`
	PrefilledNotes *string `json:"prefilled_notes" example:"Vegetarian"`
	ExpiresInDays  *int    `json:"expires_in_days" binding:"omitempty,min=1,max=90" example:"30"`
}

// InvitationResponse represents the invitation data in API responses
type InvitationResponse struct {
	ID             uuid.UUID    `json:"id"`
	EventID        uuid.UUID    `json:"event_id"`
	Email          string       `json:"email"`
	Status         InviteStatus `json:"status"`
	ExpiresAt      time.Time    `json:"expires_at"`
	PrefilledName  *string      `json:"prefilled_name"`
	PrefilledPhone *string      `json:"prefilled_phone"`
	PrefilledNotes *string      `json:"prefilled_notes"`
	SentAt         time.Time    `json:"sent_at"`
	AcceptedAt     *time.Time   `json:"accepted_at"`
	ExpiredAt      *time.Time   `json:"expired_at"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

// InvitationListItem represents invitation data in list responses
type InvitationListItem struct {
	ID            uuid.UUID    `json:"id"`
	Email         string       `json:"email"`
	Token         string       `json:"token"`
	Status        InviteStatus `json:"status"`
	ExpiresAt     time.Time    `json:"expires_at"`
	PrefilledName *string      `json:"prefilled_name"`
	SentAt        time.Time    `json:"sent_at"`
	AcceptedAt    *time.Time   `json:"accepted_at"`
	CreatedAt     time.Time    `json:"created_at"`
}

// AcceptInvitationRequest represents the request to accept an invitation
type AcceptInvitationRequest struct {
	RSVPStatus RSVPStatus `json:"rsvp_status" binding:"required,oneof=pending accept decline maybe" example:"accept"`
	Notes      *string    `json:"notes" example:"Vegetarian, allergic to nuts"`
}

// AcceptInvitationResponse represents the response after accepting an invitation
type AcceptInvitationResponse struct {
	Guest   Guest  `json:"guest"`
	Message string `json:"message" example:"Successfully accepted invitation"`
}
