package services

import (
	"time"

	"github.com/google/uuid"

	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/errors"
	customerrors "github.com/seatmaster/backend/internal/errors"
)

// GuestCategoryService handles business logic for guest categories
type GuestCategoryService struct {
	db *database.DB
}

// NewGuestCategoryService creates a new guest category service
func NewGuestCategoryService(db *database.DB) *GuestCategoryService {
	return &GuestCategoryService{db: db}
}

// CreateCategory creates a new guest category
func (s *GuestCategoryService) CreateCategory(eventID, ownerID uuid.UUID, req *models.CreateGuestCategoryRequest) (*models.GuestCategory, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	// Check if category name already exists for this event
	var existingCategory models.GuestCategory
	if err := s.db.DB.Where("event_id = ? AND name = ?", eventID, req.Name).First(&existingCategory).Error; err == nil {
		return nil, customerrors.ErrCategoryAlreadyExists
	}

	category := &models.GuestCategory{
		EventID:     eventID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Icon:        req.Icon,
	}

	if err := s.db.DB.Create(category).Error; err != nil {
		return nil, err
	}

	return category, nil
}

// GetCategoriesByEvent retrieves all categories for an event
func (s *GuestCategoryService) GetCategoriesByEvent(eventID, ownerID uuid.UUID) ([]models.GuestCategory, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	var categories []models.GuestCategory
	if err := s.db.DB.Where("event_id = ?", eventID).Find(&categories).Error; err != nil {
		return nil, err
	}

	return categories, nil
}

// UpdateCategory updates an existing category
func (s *GuestCategoryService) UpdateCategory(categoryID, ownerID uuid.UUID, req *models.UpdateGuestCategoryRequest) (*models.GuestCategory, error) {
	var category models.GuestCategory
	if err := s.db.DB.Preload("Event").First(&category, categoryID).Error; err != nil {
		return nil, customerrors.ErrCategoryNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(category.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if category name already exists for this event (if name is being updated)
	if req.Name != nil && *req.Name != category.Name {
		var existingCategory models.GuestCategory
		if err := s.db.DB.Where("event_id = ? AND name = ? AND id != ?", category.EventID, *req.Name, categoryID).First(&existingCategory).Error; err == nil {
			return nil, customerrors.ErrCategoryAlreadyExists
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
	if req.Icon != nil {
		updates["icon"] = *req.Icon
	}

	if err := s.db.DB.Model(&category).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &category, nil
}

// DeleteCategory deletes a category
func (s *GuestCategoryService) DeleteCategory(categoryID, ownerID uuid.UUID) error {
	var category models.GuestCategory
	if err := s.db.DB.Preload("Event").First(&category, categoryID).Error; err != nil {
		return errors.ErrCategoryNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(category.EventID, ownerID); err != nil {
		return err
	}

	// Prevent deletion of default categories
	if category.IsDefault {
		return customerrors.ErrCategoryAccess
	}

	// Delete category assignments first
	if err := s.db.DB.Where("category_id = ?", categoryID).Delete(&models.GuestCategoryAssignment{}).Error; err != nil {
		return err
	}

	// Delete the category
	return s.db.DB.Delete(&category).Error
}

// AssignGuestToCategory assigns a guest to a category
func (s *GuestCategoryService) AssignGuestToCategory(guestID, categoryID, ownerID uuid.UUID, notes *string) (*models.GuestCategoryAssignment, error) {
	// Verify event ownership through category
	var category models.GuestCategory
	if err := s.db.DB.Preload("Event").First(&category, categoryID).Error; err != nil {
		return nil, customerrors.ErrCategoryNotFound
	}

	if err := s.verifyEventOwnership(category.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if guest exists and belongs to the event
	var guest models.Guest
	if err := s.db.DB.Where("id = ? AND event_id = ?", guestID, category.EventID).First(&guest).Error; err != nil {
		return nil, customerrors.ErrGuestNotFound
	}

	// Check if assignment already exists
	var existingAssignment models.GuestCategoryAssignment
	if err := s.db.DB.Where("guest_id = ? AND category_id = ?", guestID, categoryID).First(&existingAssignment).Error; err == nil {
		// Update existing assignment
		updates := make(map[string]interface{})
		if notes != nil {
			updates["notes"] = notes
		}
		updates["assigned_at"] = time.Now()

		if err := s.db.DB.Model(&existingAssignment).Updates(updates).Error; err != nil {
			return nil, err
		}

		return &existingAssignment, nil
	}

	// Create new assignment
	assignment := &models.GuestCategoryAssignment{
		GuestID:    guestID,
		CategoryID: categoryID,
		AssignedBy: ownerID,
		AssignedAt: time.Now(),
		Notes:      notes,
	}

	if err := s.db.DB.Create(assignment).Error; err != nil {
		return nil, err
	}

	return assignment, nil
}

// RemoveGuestFromCategory removes a guest from a category
func (s *GuestCategoryService) RemoveGuestFromCategory(guestID, categoryID, ownerID uuid.UUID) error {
	// Verify event ownership through category
	var category models.GuestCategory
	if err := s.db.DB.Preload("Event").First(&category, categoryID).Error; err != nil {
		return customerrors.ErrCategoryNotFound
	}

	if err := s.verifyEventOwnership(category.EventID, ownerID); err != nil {
		return err
	}

	// Delete the assignment
	return s.db.DB.Where("guest_id = ? AND category_id = ?", guestID, categoryID).Delete(&models.GuestCategoryAssignment{}).Error
}

// GetGuestsByCategory retrieves all guests in a category
func (s *GuestCategoryService) GetGuestsByCategory(categoryID, ownerID uuid.UUID) ([]models.Guest, error) {
	// Verify event ownership through category
	var category models.GuestCategory
	if err := s.db.DB.Preload("Event").First(&category, categoryID).Error; err != nil {
		return nil, customerrors.ErrCategoryNotFound
	}

	if err := s.verifyEventOwnership(category.EventID, ownerID); err != nil {
		return nil, err
	}

	var guests []models.Guest
	if err := s.db.DB.Joins("JOIN guest_category_assignments ON guests.id = guest_category_assignments.guest_id").
		Where("guest_category_assignments.category_id = ?", categoryID).
		Preload("User").
		Find(&guests).Error; err != nil {
		return nil, err
	}

	return guests, nil
}

// verifyEventOwnership verifies that the user owns the event
func (s *GuestCategoryService) verifyEventOwnership(eventID, userID uuid.UUID) error {
	var event models.Event
	if err := s.db.DB.Where("id = ? AND owner_id = ?", eventID, userID).First(&event).Error; err != nil {
		return customerrors.ErrEventAccess
	}
	return nil
}
