package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GuestCategory represents a category for organizing guests within an event
type GuestCategory struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EventID     uuid.UUID      `json:"event_id" gorm:"type:uuid;not null"`
	Event       Event          `json:"event" gorm:"foreignKey:EventID"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Color       string         `json:"color" gorm:"default:'#3B82F6'"` // Hex color for UI
	Icon        string         `json:"icon" gorm:"default:'user'"`     // Icon identifier
	IsDefault   bool           `json:"is_default" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// GuestTag represents a tag for labeling guests within an event
type GuestTag struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EventID     uuid.UUID      `json:"event_id" gorm:"type:uuid;not null"`
	Event       Event          `json:"event" gorm:"foreignKey:EventID"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Color       string         `json:"color" gorm:"default:'#6B7280'"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// GuestCategoryAssignment represents the assignment of a guest to a category
type GuestCategoryAssignment struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	GuestID        uuid.UUID      `json:"guest_id" gorm:"type:uuid;not null"`
	Guest          Guest          `json:"guest" gorm:"foreignKey:GuestID"`
	CategoryID     uuid.UUID      `json:"category_id" gorm:"type:uuid;not null"`
	Category       GuestCategory  `json:"category" gorm:"foreignKey:CategoryID"`
	AssignedBy     uuid.UUID      `json:"assigned_by" gorm:"type:uuid;not null"`
	AssignedByUser User           `json:"assigned_by_user" gorm:"foreignKey:AssignedBy"`
	AssignedAt     time.Time      `json:"assigned_at"`
	Notes          *string        `json:"notes"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// GuestTagAssignment represents the assignment of a guest to a tag
type GuestTagAssignment struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	GuestID        uuid.UUID      `json:"guest_id" gorm:"type:uuid;not null"`
	Guest          Guest          `json:"guest" gorm:"foreignKey:GuestID"`
	TagID          uuid.UUID      `json:"tag_id" gorm:"type:uuid;not null"`
	Tag            GuestTag       `json:"tag" gorm:"foreignKey:TagID"`
	AssignedBy     uuid.UUID      `json:"assigned_by" gorm:"type:uuid;not null"`
	AssignedByUser User           `json:"assigned_by_user" gorm:"foreignKey:AssignedBy"`
	AssignedAt     time.Time      `json:"assigned_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// Request/Response Models

type CreateGuestCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Color       string `json:"color"`
	Icon        string `json:"icon"`
}

type UpdateGuestCategoryRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
	Icon        *string `json:"icon"`
}

type CreateGuestTagRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

type UpdateGuestTagRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
}

type GuestCategoryResponse struct {
	ID          uuid.UUID `json:"id"`
	EventID     uuid.UUID `json:"event_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Icon        string    `json:"icon"`
	IsDefault   bool      `json:"is_default"`
	GuestCount  int64     `json:"guest_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type GuestTagResponse struct {
	ID          uuid.UUID `json:"id"`
	EventID     uuid.UUID `json:"event_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	GuestCount  int64     `json:"guest_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type GuestCategoriesResponse struct {
	Categories []GuestCategoryResponse `json:"categories"`
	Total      int64                   `json:"total"`
}

type GuestTagsResponse struct {
	Tags  []GuestTagResponse `json:"tags"`
	Total int64              `json:"total"`
}

type AssignGuestToCategoryRequest struct {
	GuestID uuid.UUID `json:"guest_id" binding:"required"`
	Notes   *string   `json:"notes"`
}

type AssignGuestToTagRequest struct {
	GuestID uuid.UUID `json:"guest_id" binding:"required"`
}
