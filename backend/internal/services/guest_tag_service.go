package services

import (
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"
)

// GuestTagService handles business logic for guest tags
type GuestTagService struct {
	db *database.DB
}

// NewGuestTagService creates a new guest tag service
func NewGuestTagService(db *database.DB) *GuestTagService {
	return &GuestTagService{db: db}
}

// CreateTag creates a new guest tag
func (s *GuestTagService) CreateTag(eventID, ownerID uuid.UUID, req *models.CreateGuestTagRequest) (*models.GuestTag, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	// Check if tag name already exists for this event
	var existingTag models.GuestTag
	if err := s.db.DB.Where("event_id = ? AND name = ?", eventID, req.Name).First(&existingTag).Error; err == nil {
		return nil, customerrors.ErrTagAlreadyExists
	}

	tag := &models.GuestTag{
		EventID:     eventID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
	}

	if err := s.db.DB.Create(tag).Error; err != nil {
		return nil, err
	}

	return tag, nil
}

// GetTagsByEvent retrieves all tags for an event
func (s *GuestTagService) GetTagsByEvent(eventID, ownerID uuid.UUID) ([]models.GuestTag, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	var tags []models.GuestTag
	if err := s.db.DB.Where("event_id = ?", eventID).Find(&tags).Error; err != nil {
		return nil, err
	}

	return tags, nil
}

// UpdateTag updates an existing tag
func (s *GuestTagService) UpdateTag(tagID, ownerID uuid.UUID, req *models.UpdateGuestTagRequest) (*models.GuestTag, error) {
	var tag models.GuestTag
	if err := s.db.DB.Preload("Event").First(&tag, tagID).Error; err != nil {
		return nil, customerrors.ErrTagNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(tag.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if tag name already exists for this event (if name is being updated)
	if req.Name != nil && *req.Name != tag.Name {
		var existingTag models.GuestTag
		if err := s.db.DB.Where("event_id = ? AND name = ? AND id != ?", tag.EventID, *req.Name, tagID).First(&existingTag).Error; err == nil {
			return nil, customerrors.ErrTagAlreadyExists
		}
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Color != nil {
		updates["color"] = *req.Color
	}

	if err := s.db.DB.Model(&tag).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &tag, nil
}

// DeleteTag deletes a tag
func (s *GuestTagService) DeleteTag(tagID, ownerID uuid.UUID) error {
	var tag models.GuestTag
	if err := s.db.DB.Preload("Event").First(&tag, tagID).Error; err != nil {
		return customerrors.ErrTagNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(tag.EventID, ownerID); err != nil {
		return err
	}

	// Delete tag assignments first
	if err := s.db.DB.Where("tag_id = ?", tagID).Delete(&models.GuestTagAssignment{}).Error; err != nil {
		return err
	}

	// Delete the tag
	return s.db.DB.Delete(&tag).Error
}

// AssignGuestToTag assigns a guest to a tag
func (s *GuestTagService) AssignGuestToTag(guestID, tagID, ownerID uuid.UUID) (*models.GuestTagAssignment, error) {
	// Verify event ownership through tag
	var tag models.GuestTag
	if err := s.db.DB.Preload("Event").First(&tag, tagID).Error; err != nil {
		return nil, customerrors.ErrTagNotFound
	}

	if err := s.verifyEventOwnership(tag.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if guest exists and belongs to the event
	var guest models.Guest
	if err := s.db.DB.Where("id = ? AND event_id = ?", guestID, tag.EventID).First(&guest).Error; err != nil {
		return nil, customerrors.ErrGuestNotFound
	}

	// Check if assignment already exists
	var existingAssignment models.GuestTagAssignment
	if err := s.db.DB.Where("guest_id = ? AND tag_id = ?", guestID, tagID).First(&existingAssignment).Error; err == nil {
		// Assignment already exists, return it
		return &existingAssignment, nil
	}

	// Create new assignment
	assignment := &models.GuestTagAssignment{
		GuestID:    guestID,
		TagID:      tagID,
		AssignedBy: ownerID,
		AssignedAt: time.Now(),
	}

	if err := s.db.DB.Create(assignment).Error; err != nil {
		return nil, err
	}

	return assignment, nil
}

// RemoveGuestFromTag removes a guest from a tag
func (s *GuestTagService) RemoveGuestFromTag(guestID, tagID, ownerID uuid.UUID) error {
	// Verify event ownership through tag
	var tag models.GuestTag
	if err := s.db.DB.Preload("Event").First(&tag, tagID).Error; err != nil {
		return customerrors.ErrTagNotFound
	}

	if err := s.verifyEventOwnership(tag.EventID, ownerID); err != nil {
		return err
	}

	// Delete the assignment
	return s.db.DB.Where("guest_id = ? AND tag_id = ?", guestID, tagID).Delete(&models.GuestTagAssignment{}).Error
}

// GetGuestsByTag retrieves all guests with a specific tag
func (s *GuestTagService) GetGuestsByTag(tagID, ownerID uuid.UUID) ([]models.Guest, error) {
	// Verify event ownership through tag
	var tag models.GuestTag
	if err := s.db.DB.Preload("Event").First(&tag, tagID).Error; err != nil {
		return nil, customerrors.ErrTagNotFound
	}

	if err := s.verifyEventOwnership(tag.EventID, ownerID); err != nil {
		return nil, err
	}

	var guests []models.Guest
	if err := s.db.DB.Joins("JOIN guest_tag_assignments ON guests.id = guest_tag_assignments.guest_id").
		Where("guest_tag_assignments.tag_id = ?", tagID).
		Preload("User").
		Find(&guests).Error; err != nil {
		return nil, err
	}

	return guests, nil
}

// verifyEventOwnership verifies that the user owns the event
func (s *GuestTagService) verifyEventOwnership(eventID, userID uuid.UUID) error {
	var event models.Event
	if err := s.db.DB.Where("id = ? AND owner_id = ?", eventID, userID).First(&event).Error; err != nil {
		return customerrors.ErrEventAccess
	}
	return nil
}
