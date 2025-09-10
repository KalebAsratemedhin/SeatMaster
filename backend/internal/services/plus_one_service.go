package services

import (
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"
)

// PlusOneService handles business logic for plus-ones
type PlusOneService struct {
	db *database.DB
}

// NewPlusOneService creates a new plus-one service
func NewPlusOneService(db *database.DB) *PlusOneService {
	return &PlusOneService{db: db}
}

// CreatePlusOne creates a plus-one for a guest
func (s *PlusOneService) CreatePlusOne(guestID, ownerID uuid.UUID, req *models.CreatePlusOneRequest) (*models.PlusOne, error) {
	// Verify guest exists and user owns the event
	_, err := s.verifyGuestOwnership(guestID, ownerID)
	if err != nil {
		return nil, err
	}

	// Check plus-one limit (assuming max 2 plus-ones per guest)
	var plusOneCount int64
	if err := s.db.DB.Model(&models.PlusOne{}).Where("guest_id = ?", guestID).Count(&plusOneCount).Error; err != nil {
		return nil, err
	}

	if plusOneCount >= 2 {
		return nil, customerrors.ErrPlusOneLimitExceeded
	}

	plusOne := &models.PlusOne{
		GuestID: guestID,
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Notes:   req.Notes,
		Status:  models.PlusOneStatusPending,
	}

	if err := s.db.DB.Create(plusOne).Error; err != nil {
		return nil, err
	}

	// Load the created plus-one with guest information
	if err := s.db.DB.Preload("Guest").Preload("Guest.Event").First(plusOne, plusOne.ID).Error; err != nil {
		return nil, err
	}

	return plusOne, nil
}

// GetPlusOnesByGuest retrieves all plus-ones for a guest
func (s *PlusOneService) GetPlusOnesByGuest(guestID, ownerID uuid.UUID) ([]models.PlusOne, error) {
	// Verify guest exists and user owns the event
	if _, err := s.verifyGuestOwnership(guestID, ownerID); err != nil {
		return nil, err
	}

	var plusOnes []models.PlusOne
	if err := s.db.DB.Where("guest_id = ?", guestID).
		Preload("Guest").
		Preload("Guest.Event").
		Find(&plusOnes).Error; err != nil {
		return nil, err
	}

	return plusOnes, nil
}

// UpdatePlusOne updates a plus-one
func (s *PlusOneService) UpdatePlusOne(plusOneID, ownerID uuid.UUID, req *models.UpdatePlusOneRequest) (*models.PlusOne, error) {
	var plusOne models.PlusOne
	if err := s.db.DB.Preload("Guest").Preload("Guest.Event").First(&plusOne, plusOneID).Error; err != nil {
		return nil, customerrors.ErrPlusOneNotFound
	}

	// Verify user owns the event
	if _, err := s.verifyGuestOwnership(plusOne.GuestID, ownerID); err != nil {
		return nil, err
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Phone != nil {
		updates["phone"] = *req.Phone
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	if err := s.db.DB.Model(&plusOne).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &plusOne, nil
}

// ApprovePlusOne approves a plus-one
func (s *PlusOneService) ApprovePlusOne(plusOneID, ownerID uuid.UUID, notes *string) (*models.PlusOne, error) {
	var plusOne models.PlusOne
	if err := s.db.DB.Preload("Guest").Preload("Guest.Event").First(&plusOne, plusOneID).Error; err != nil {
		return nil, customerrors.ErrPlusOneNotFound
	}

	// Verify user owns the event
	if _, err := s.verifyGuestOwnership(plusOne.GuestID, ownerID); err != nil {
		return nil, err
	}

	// Check if plus-one is already approved
	if plusOne.Status == models.PlusOneStatusApproved {
		return &plusOne, nil
	}

	// Update status
	updates := make(map[string]interface{})
	updates["status"] = models.PlusOneStatusApproved
	updates["approved_at"] = time.Now()
	updates["approved_by"] = ownerID

	if notes != nil {
		updates["notes"] = notes
	}

	if err := s.db.DB.Model(&plusOne).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &plusOne, nil
}

// RejectPlusOne rejects a plus-one
func (s *PlusOneService) RejectPlusOne(plusOneID, ownerID uuid.UUID, reason string) (*models.PlusOne, error) {
	var plusOne models.PlusOne
	if err := s.db.DB.Preload("Guest").Preload("Guest.Event").First(&plusOne, plusOneID).Error; err != nil {
		return nil, customerrors.ErrPlusOneNotFound
	}

	// Verify user owns the event
	if _, err := s.verifyGuestOwnership(plusOne.GuestID, ownerID); err != nil {
		return nil, err
	}

	// Update status
	updates := make(map[string]interface{})
	updates["status"] = models.PlusOneStatusRejected
	updates["notes"] = reason

	if err := s.db.DB.Model(&plusOne).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &plusOne, nil
}

// DeletePlusOne deletes a plus-one
func (s *PlusOneService) DeletePlusOne(plusOneID, ownerID uuid.UUID) error {
	var plusOne models.PlusOne
	if err := s.db.DB.Preload("Guest").Preload("Guest.Event").First(&plusOne, plusOneID).Error; err != nil {
		return customerrors.ErrPlusOneNotFound
	}

	// Verify user owns the event
	if _, err := s.verifyGuestOwnership(plusOne.GuestID, ownerID); err != nil {
		return err
	}

	return s.db.DB.Delete(&plusOne).Error
}

// verifyGuestOwnership verifies that the user owns the event that the guest belongs to
func (s *PlusOneService) verifyGuestOwnership(guestID, userID uuid.UUID) (*models.Guest, error) {
	var guest models.Guest
	if err := s.db.DB.Preload("Event").First(&guest, guestID).Error; err != nil {
		return nil, customerrors.ErrGuestNotFound
	}

	// Verify user owns the event
	if guest.Event.OwnerID != userID {
		return nil, customerrors.ErrAccessDenied
	}

	return &guest, nil
}
