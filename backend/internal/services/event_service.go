package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"

	"gorm.io/gorm"
)

type EventService struct {
	db *database.DB
}

func NewEventService(db *database.DB) *EventService {
	return &EventService{
		db: db,
	}
}

// generateSlug creates a URL-friendly slug from the event name and date
func (s *EventService) generateSlug(name string, date time.Time) string {
	// Convert name to lowercase and replace spaces with hyphens
	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))

	// Remove special characters, keep only letters, numbers, and hyphens
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, slug)

	// Add year to make it unique
	year := date.Year()
	slug = fmt.Sprintf("%s-%d", slug, year)

	return slug
}

// CreateEvent creates a new event
func (s *EventService) CreateEvent(ownerID uuid.UUID, req *models.CreateEventRequest) (*models.Event, error) {
	// Generate slug from name and date
	slug := s.generateSlug(req.Name, req.Date)

	event := &models.Event{
		Slug:            slug,
		Name:            req.Name,
		Description:     req.Description,
		Date:            req.Date,
		Location:        req.Location,
		OwnerID:         ownerID,
		Visibility:      req.Visibility,
		AllowSelfRSVP:   req.AllowSelfRSVP,
		RequireApproval: req.RequireApproval,
		MaxGuests:       req.MaxGuests,
		Categories:      pq.StringArray(req.Categories),
		Tags:            pq.StringArray(req.Tags),
	}

	result := s.db.Create(event)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create event: %w", result.Error)
	}

	// Load the owner information
	if err := s.db.Preload("Owner").First(event, event.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load event with owner: %w", err)
	}

	return event, nil
}

// GetEventByID retrieves an event by ID
func (s *EventService) GetEventByID(eventID uuid.UUID) (*models.Event, error) {
	var event models.Event
	result := s.db.Preload("Owner").First(&event, eventID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrEventNotFound
		}
		return nil, fmt.Errorf("error finding event: %w", result.Error)
	}

	return &event, nil
}

// GetEventBySlug retrieves an event by slug
func (s *EventService) GetEventBySlug(slug string) (*models.Event, error) {
	var event models.Event
	result := s.db.Preload("Owner").Where("slug = ?", slug).First(&event)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrEventNotFound
		}
		return nil, fmt.Errorf("error finding event: %w", result.Error)
	}

	return &event, nil
}

// GetEventsByOwner retrieves all events owned by a specific user
func (s *EventService) GetEventsByOwner(ownerID uuid.UUID) ([]models.Event, error) {
	var events []models.Event
	result := s.db.Where("owner_id = ?", ownerID).Preload("Owner").Order("date ASC").Find(&events)
	if result.Error != nil {
		return nil, fmt.Errorf("error finding events: %w", result.Error)
	}

	return events, nil
}

// GetPublicEvents retrieves all public events for discovery
func (s *EventService) GetPublicEvents() ([]models.Event, error) {
	var events []models.Event
	result := s.db.Where("visibility = ?", models.EventVisibilityPublic).
		Preload("Owner").
		Order("date ASC").
		Find(&events)
	if result.Error != nil {
		return nil, fmt.Errorf("error finding public events: %w", result.Error)
	}

	return events, nil
}

// UpdateEvent updates an existing event (partial update)
func (s *EventService) UpdateEvent(eventID, ownerID uuid.UUID, req *models.UpdateEventRequest) (*models.Event, error) {
	var event models.Event
	result := s.db.Where("id = ? AND owner_id = ?", eventID, ownerID).First(&event)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrEventNotFound
		}
		return nil, fmt.Errorf("error finding event: %w", result.Error)
	}

	// Update only provided fields (partial update)
	if req.Name != nil {
		event.Name = *req.Name
		// Regenerate slug if name changes
		event.Slug = s.generateSlug(*req.Name, event.Date)
	}
	if req.Description != nil {
		event.Description = *req.Description
	}
	if req.Date != nil {
		event.Date = *req.Date
		// Regenerate slug if date changes
		event.Slug = s.generateSlug(event.Name, *req.Date)
	}
	if req.Location != nil {
		event.Location = *req.Location
	}
	if req.Visibility != nil {
		event.Visibility = *req.Visibility
	}
	if req.AllowSelfRSVP != nil {
		event.AllowSelfRSVP = *req.AllowSelfRSVP
	}
	if req.RequireApproval != nil {
		event.RequireApproval = *req.RequireApproval
	}
	if req.MaxGuests != nil {
		event.MaxGuests = req.MaxGuests
	}
	if req.Categories != nil {
		event.Categories = pq.StringArray(*req.Categories)
	}
	if req.Tags != nil {
		event.Tags = pq.StringArray(*req.Tags)
	}

	result = s.db.Save(&event)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update event: %w", result.Error)
	}

	// Load the updated event with owner information
	if err := s.db.Preload("Owner").First(&event, event.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated event: %w", err)
	}

	return &event, nil
}

// DeleteEvent deletes an event
func (s *EventService) DeleteEvent(eventID, ownerID uuid.UUID) error {
	var event models.Event
	result := s.db.Where("id = ? AND owner_id = ?", eventID, ownerID).First(&event)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return customerrors.ErrEventNotFound
		}
		return fmt.Errorf("error finding event: %w", result.Error)
	}

	result = s.db.Delete(&event)
	if result.Error != nil {
		return fmt.Errorf("failed to delete event: %w", result.Error)
	}

	return nil
}

// GetEventCount returns the total number of events for a user
func (s *EventService) GetEventCount(ownerID uuid.UUID) (int64, error) {
	var count int64
	result := s.db.Model(&models.Event{}).Where("owner_id = ?", ownerID).Count(&count)
	if result.Error != nil {
		return 0, fmt.Errorf("error counting events: %w", result.Error)
	}

	return count, nil
}
