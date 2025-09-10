package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlusOneStatus represents the status of a plus-one request
type PlusOneStatus string

const (
	PlusOneStatusPending  PlusOneStatus = "pending"
	PlusOneStatusApproved PlusOneStatus = "approved"
	PlusOneStatusRejected PlusOneStatus = "rejected"
)

// PlusOne represents a companion or additional attendee for a guest
type PlusOne struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	GuestID        uuid.UUID      `json:"guest_id" gorm:"type:uuid;not null"`
	Guest          Guest          `json:"guest" gorm:"foreignKey:GuestID"`
	Name           string         `json:"name" gorm:"not null"`
	Email          *string        `json:"email"`
	Phone          *string        `json:"phone"`
	Notes          *string        `json:"notes"`
	Status         PlusOneStatus  `json:"status" gorm:"not null;default:'pending'"`
	ApprovedAt     *time.Time     `json:"approved_at"`
	ApprovedBy     *uuid.UUID     `json:"approved_by" gorm:"type:uuid"`
	ApprovedByUser *User          `json:"approved_by_user" gorm:"foreignKey:ApprovedBy"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// Request/Response Models

type CreatePlusOneRequest struct {
	Name  string  `json:"name" binding:"required"`
	Email *string `json:"email"`
	Phone *string `json:"phone"`
	Notes *string `json:"notes"`
}

type UpdatePlusOneRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
	Phone *string `json:"phone"`
	Notes *string `json:"notes"`
}

type PlusOneResponse struct {
	ID             uuid.UUID     `json:"id"`
	GuestID        uuid.UUID     `json:"guest_id"`
	Name           string        `json:"name"`
	Email          *string       `json:"email"`
	Phone          *string       `json:"phone"`
	Notes          *string       `json:"notes"`
	Status         PlusOneStatus `json:"status"`
	ApprovedAt     *time.Time    `json:"approved_at"`
	ApprovedBy     *uuid.UUID    `json:"approved_by"`
	ApprovedByUser *User         `json:"approved_by_user"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

type PlusOnesResponse struct {
	PlusOnes []PlusOneResponse `json:"plus_ones"`
	Total    int64             `json:"total"`
}

type ApprovePlusOneRequest struct {
	Notes *string `json:"notes"`
}

type RejectPlusOneRequest struct {
	Reason string `json:"reason" binding:"required"`
}
