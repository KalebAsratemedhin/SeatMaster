package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CommunicationType represents the type of communication
type CommunicationType string

const (
	CommunicationTypeEmail CommunicationType = "email"
	CommunicationTypeSMS   CommunicationType = "sms"
	CommunicationTypePush  CommunicationType = "push"
	CommunicationTypeInApp CommunicationType = "in_app"
)

// CommunicationStatus represents the status of a communication
type CommunicationStatus string

const (
	CommunicationStatusDraft     CommunicationStatus = "draft"
	CommunicationStatusScheduled CommunicationStatus = "scheduled"
	CommunicationStatusSending   CommunicationStatus = "sending"
	CommunicationStatusSent      CommunicationStatus = "sent"
	CommunicationStatusFailed    CommunicationStatus = "failed"
)

// GuestCommunication represents a communication sent to guests
type GuestCommunication struct {
	ID          uuid.UUID           `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EventID     uuid.UUID           `json:"event_id" gorm:"type:uuid;not null"`
	Event       Event               `json:"event" gorm:"foreignKey:EventID"`
	Type        CommunicationType   `json:"type" gorm:"not null"`
	Subject     string              `json:"subject" gorm:"not null"`
	Message     string              `json:"message" gorm:"not null"`
	Recipients  []uuid.UUID         `json:"recipients" gorm:"type:uuid[]" swaggertype:"array,string"` // Guest IDs
	Categories  []uuid.UUID         `json:"categories" gorm:"type:uuid[]" swaggertype:"array,string"` // Category IDs
	Tags        []uuid.UUID         `json:"tags" gorm:"type:uuid[]" swaggertype:"array,string"`       // Tag IDs
	Status      CommunicationStatus `json:"status" gorm:"not null;default:'draft'"`
	ScheduledAt *time.Time          `json:"scheduled_at"`
	SentAt      *time.Time          `json:"sent_at"`
	SentBy      uuid.UUID           `json:"sent_by" gorm:"type:uuid;not null"`
	SentByUser  User                `json:"sent_by_user" gorm:"foreignKey:SentBy"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
	DeletedAt   gorm.DeletedAt      `json:"-" gorm:"index"`
}

// Request/Response Models

type CreateCommunicationRequest struct {
	Type        CommunicationType `json:"type" binding:"required"`
	Subject     string            `json:"subject" binding:"required"`
	Message     string            `json:"message" binding:"required"`
	Recipients  []uuid.UUID       `json:"recipients"`
	Categories  []uuid.UUID       `json:"categories"`
	Tags        []uuid.UUID       `json:"tags"`
	ScheduledAt *time.Time        `json:"scheduled_at"`
}

type UpdateCommunicationRequest struct {
	Type        *CommunicationType `json:"type"`
	Subject     *string            `json:"subject"`
	Message     *string            `json:"message"`
	Recipients  *[]uuid.UUID       `json:"recipients"`
	Categories  *[]uuid.UUID       `json:"categories"`
	Tags        *[]uuid.UUID       `json:"tags"`
	ScheduledAt *time.Time         `json:"scheduled_at"`
}

type CommunicationResponse struct {
	ID             uuid.UUID           `json:"id"`
	EventID        uuid.UUID           `json:"event_id"`
	Type           CommunicationType   `json:"type"`
	Subject        string              `json:"subject"`
	Message        string              `json:"message"`
	Recipients     []uuid.UUID         `json:"recipients"`
	Categories     []uuid.UUID         `json:"categories"`
	Tags           []uuid.UUID         `json:"tags"`
	Status         CommunicationStatus `json:"status"`
	ScheduledAt    *time.Time          `json:"scheduled_at"`
	SentAt         *time.Time          `json:"sent_at"`
	SentBy         uuid.UUID           `json:"sent_by"`
	SentByUser     User                `json:"sent_by_user"`
	RecipientCount int64               `json:"recipient_count"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}

type CommunicationsResponse struct {
	Communications []CommunicationResponse `json:"communications"`
	Total          int64                   `json:"total"`
}

type ScheduleCommunicationRequest struct {
	ScheduledAt time.Time `json:"scheduled_at" binding:"required"`
}

type CommunicationStats struct {
	ID              uuid.UUID `json:"id"`
	TotalRecipients int64     `json:"total_recipients"`
	SentCount       int64     `json:"sent_count"`
	FailedCount     int64     `json:"failed_count"`
	PendingCount    int64     `json:"pending_count"`
	OpenRate        float64   `json:"open_rate"`
	ClickRate       float64   `json:"click_rate"`
	ResponseRate    float64   `json:"response_rate"`
}
