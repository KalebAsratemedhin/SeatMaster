package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// EventVisibility represents the visibility level of an event
type EventVisibility string

const (
	EventVisibilityPrivate EventVisibility = "private"
	EventVisibilityPublic  EventVisibility = "public"
)

// Event represents an event in the system
// @Description Event information and details
type Event struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()" example:"550e8400-e29b-41d4-a716-446655440000"`
	Slug        string    `json:"slug" gorm:"uniqueIndex;not null" example:"john-jane-wedding-2024"`
	Name        string    `json:"name" gorm:"not null" example:"John & Jane's Wedding"`
	Description string    `json:"description" example:"A beautiful celebration of love"`
	Date        time.Time `json:"date" gorm:"not null" example:"2024-06-15T18:00:00Z"`
	Location    string    `json:"location" example:"Grand Hotel Ballroom"`
	OwnerID     uuid.UUID `json:"owner_id" gorm:"type:uuid;not null"`
	Owner       User      `json:"owner" gorm:"foreignKey:OwnerID"`

	// Visibility and Access Control
	Visibility EventVisibility `json:"visibility" gorm:"not null;default:'private'"`

	// Guest Management Options
	AllowSelfRSVP   bool `json:"allow_self_rsvp" gorm:"default:false"`
	RequireApproval bool `json:"require_approval" gorm:"default:false"`
	MaxGuests       *int `json:"max_guests"`

	// Discovery and Organization (for public events)
	Categories pq.StringArray `json:"categories" gorm:"type:text[]" swaggertype:"array,string"`
	Tags       pq.StringArray `json:"tags" gorm:"type:text[]" swaggertype:"array,string"`

	// Guest Management
	GuestList []Guest `json:"guests" gorm:"foreignKey:EventID"`

	CreatedAt time.Time      `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt time.Time      `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateEventRequest represents the request body for event creation
// @Description Event creation request data
type CreateEventRequest struct {
	Name            string          `json:"name" validate:"required,min=1,max=255" example:"John & Jane's Wedding"`
	Description     string          `json:"description" validate:"max=1000" example:"A beautiful celebration of love"`
	Date            time.Time       `json:"date" validate:"required" example:"2024-06-15T18:00:00Z"`
	Location        string          `json:"location" validate:"required,max=255" example:"Grand Hotel Ballroom"`
	Visibility      EventVisibility `json:"visibility" validate:"required,oneof=private public" example:"private"`
	AllowSelfRSVP   bool            `json:"allow_self_rsvp" example:"false"`
	RequireApproval bool            `json:"require_approval" example:"false"`
	MaxGuests       *int            `json:"max_guests" validate:"omitempty,min=1" example:"100"`
	Categories      []string        `json:"categories" validate:"omitempty,dive,max=50" example:"wedding,celebration"`
	Tags            []string        `json:"tags" validate:"omitempty,max=50" example:"formal,outdoor"`
}

// UpdateEventRequest represents the request body for event updates
// @Description Event update request data
type UpdateEventRequest struct {
	Name            *string          `json:"name" validate:"omitempty,min=1,max=255" example:"John & Jane's Wedding"`
	Description     *string          `json:"description" validate:"omitempty,max=1000" example:"A beautiful celebration of love"`
	Date            *time.Time       `json:"date" validate:"omitempty" example:"2024-06-15T18:00:00Z"`
	Location        *string          `json:"location" validate:"omitempty,max=255" example:"Grand Hotel Ballroom"`
	Visibility      *EventVisibility `json:"visibility" validate:"omitempty,oneof=private public" example:"public"`
	AllowSelfRSVP   *bool            `json:"allow_self_rsvp" example:"true"`
	RequireApproval *bool            `json:"require_approval" example:"false"`
	MaxGuests       *int             `json:"max_guests" validate:"omitempty,min=1" example:"150"`
	Categories      *[]string        `json:"categories" validate:"omitempty,dive,max=50" example:"wedding,celebration"`
	Tags            *[]string        `json:"tags" validate:"omitempty,max=50" example:"formal,outdoor"`
}

// EventResponse represents the response for event operations
// @Description Event response data
type EventResponse struct {
	Event *Event `json:"event"`
}

// EventsResponse represents the response for multiple events
// @Description Multiple events response data
type EventsResponse struct {
	Events []Event `json:"events"`
	Total  int     `json:"total"`
}
