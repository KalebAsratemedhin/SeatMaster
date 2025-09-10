package services

import (
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"
)

// GuestCommunicationService handles business logic for guest communications
type GuestCommunicationService struct {
	db *database.DB
}

// NewGuestCommunicationService creates a new guest communication service
func NewGuestCommunicationService(db *database.DB) *GuestCommunicationService {
	return &GuestCommunicationService{db: db}
}

// CreateCommunication creates a new communication
func (s *GuestCommunicationService) CreateCommunication(eventID, ownerID uuid.UUID, req *models.CreateCommunicationRequest) (*models.GuestCommunication, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	// Validate recipient criteria
	if err := s.validateRecipientCriteria(eventID, req); err != nil {
		return nil, err
	}

	communication := &models.GuestCommunication{
		EventID:     eventID,
		Type:        req.Type,
		Subject:     req.Subject,
		Message:     req.Message,
		Recipients:  req.Recipients,
		Categories:  req.Categories,
		Tags:        req.Tags,
		Status:      models.CommunicationStatusDraft,
		ScheduledAt: req.ScheduledAt,
		SentBy:      ownerID,
	}

	if err := s.db.DB.Create(communication).Error; err != nil {
		return nil, err
	}

	// Load the created communication with event information
	if err := s.db.DB.Preload("Event").Preload("SentByUser").First(communication, communication.ID).Error; err != nil {
		return nil, err
	}

	return communication, nil
}

// SendCommunication sends a communication to guests
func (s *GuestCommunicationService) SendCommunication(communicationID, ownerID uuid.UUID) (*models.GuestCommunication, error) {
	var communication models.GuestCommunication
	if err := s.db.DB.Preload("Event").Preload("SentByUser").First(&communication, communicationID).Error; err != nil {
		return nil, customerrors.ErrCommunicationNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(communication.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if communication can be sent
	if communication.Status != models.CommunicationStatusDraft && communication.Status != models.CommunicationStatusScheduled {
		return nil, customerrors.ErrCommunicationInvalid
	}

	// Update status to sending
	updates := make(map[string]interface{})
	updates["status"] = models.CommunicationStatusSending
	updates["sent_at"] = time.Now()

	if err := s.db.DB.Model(&communication).Updates(updates).Error; err != nil {
		return nil, err
	}

	// TODO: Implement actual sending logic (email, SMS, etc.)
	// For now, just mark as sent
	updates = make(map[string]interface{})
	updates["status"] = models.CommunicationStatusSent

	if err := s.db.DB.Model(&communication).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &communication, nil
}

// ScheduleCommunication schedules a communication for later
func (s *GuestCommunicationService) ScheduleCommunication(communicationID, ownerID uuid.UUID, sendAt time.Time) (*models.GuestCommunication, error) {
	var communication models.GuestCommunication
	if err := s.db.DB.Preload("Event").Preload("SentByUser").First(&communication, communicationID).Error; err != nil {
		return nil, customerrors.ErrCommunicationNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(communication.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if communication can be scheduled
	if communication.Status != models.CommunicationStatusDraft {
		return nil, customerrors.ErrCommunicationInvalid
	}

	// Validate send time (must be in the future)
	if sendAt.Before(time.Now()) {
		return nil, customerrors.ErrCommunicationInvalid
	}

	// Update status and scheduled time
	updates := make(map[string]interface{})
	updates["status"] = models.CommunicationStatusScheduled
	updates["scheduled_at"] = sendAt

	if err := s.db.DB.Model(&communication).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &communication, nil
}

// GetCommunicationsByEvent retrieves all communications for an event
func (s *GuestCommunicationService) GetCommunicationsByEvent(eventID, ownerID uuid.UUID) ([]models.GuestCommunication, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	var communications []models.GuestCommunication
	if err := s.db.DB.Where("event_id = ?", eventID).
		Preload("Event").
		Preload("SentByUser").
		Order("created_at DESC").
		Find(&communications).Error; err != nil {
		return nil, err
	}

	return communications, nil
}

// GetCommunicationStats retrieves statistics for a communication
func (s *GuestCommunicationService) GetCommunicationStats(communicationID, ownerID uuid.UUID) (*models.CommunicationStats, error) {
	var communication models.GuestCommunication
	if err := s.db.DB.Preload("Event").First(&communication, communicationID).Error; err != nil {
		return nil, customerrors.ErrCommunicationNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(communication.EventID, ownerID); err != nil {
		return nil, err
	}

	// Calculate recipient count
	var totalRecipients int64
	if err := s.db.DB.Model(&models.Guest{}).Where("event_id = ?", communication.EventID).Count(&totalRecipients).Error; err != nil {
		return nil, err
	}

	// For now, return basic stats
	// TODO: Implement actual tracking and analytics
	stats := &models.CommunicationStats{
		ID:              communicationID,
		TotalRecipients: totalRecipients,
		SentCount:       totalRecipients, // Assuming all were sent successfully
		FailedCount:     0,
		PendingCount:    0,
		OpenRate:        0.0, // Would need tracking implementation
		ClickRate:       0.0, // Would need tracking implementation
		ResponseRate:    0.0, // Would need tracking implementation
	}

	return stats, nil
}

// UpdateCommunication updates an existing communication
func (s *GuestCommunicationService) UpdateCommunication(communicationID, ownerID uuid.UUID, req *models.UpdateCommunicationRequest) (*models.GuestCommunication, error) {
	var communication models.GuestCommunication
	if err := s.db.DB.Preload("Event").Preload("SentByUser").First(&communication, communicationID).Error; err != nil {
		return nil, customerrors.ErrCommunicationNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(communication.EventID, ownerID); err != nil {
		return nil, err
	}

	// Check if communication can be updated
	if communication.Status != models.CommunicationStatusDraft {
		return nil, customerrors.ErrCommunicationInvalid
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Subject != nil {
		updates["subject"] = *req.Subject
	}
	if req.Message != nil {
		updates["message"] = *req.Message
	}
	if req.Recipients != nil {
		updates["recipients"] = *req.Recipients
	}
	if req.Categories != nil {
		updates["categories"] = *req.Categories
	}
	if req.Tags != nil {
		updates["tags"] = *req.Tags
	}
	if req.ScheduledAt != nil {
		updates["scheduled_at"] = *req.ScheduledAt
	}

	if err := s.db.DB.Model(&communication).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &communication, nil
}

// DeleteCommunication deletes a communication
func (s *GuestCommunicationService) DeleteCommunication(communicationID, ownerID uuid.UUID) error {
	var communication models.GuestCommunication
	if err := s.db.DB.Preload("Event").First(&communication, communicationID).Error; err != nil {
		return customerrors.ErrCommunicationNotFound
	}

	// Verify event ownership
	if err := s.verifyEventOwnership(communication.EventID, ownerID); err != nil {
		return err
	}

	// Check if communication can be deleted
	if communication.Status != models.CommunicationStatusDraft {
		return customerrors.ErrCommunicationInvalid
	}

	return s.db.DB.Delete(&communication).Error
}

// Helper methods

func (s *GuestCommunicationService) validateRecipientCriteria(eventID uuid.UUID, req *models.CreateCommunicationRequest) error {
	// If specific recipients are specified, validate they exist
	if len(req.Recipients) > 0 {
		var count int64
		if err := s.db.DB.Model(&models.Guest{}).Where("id IN ? AND event_id = ?", req.Recipients, eventID).Count(&count).Error; err != nil {
			return err
		}
		if int(count) != len(req.Recipients) {
			return customerrors.ErrCommunicationInvalid
		}
	}

	// If categories are specified, validate they exist
	if len(req.Categories) > 0 {
		var count int64
		if err := s.db.DB.Model(&models.GuestCategory{}).Where("id IN ? AND event_id = ?", req.Categories, eventID).Count(&count).Error; err != nil {
			return err
		}
		if int(count) != len(req.Categories) {
			return customerrors.ErrCommunicationInvalid
		}
	}

	// If tags are specified, validate they exist
	if len(req.Tags) > 0 {
		var count int64
		if err := s.db.DB.Model(&models.GuestTag{}).Where("id IN ? AND event_id = ?", req.Tags, eventID).Count(&count).Error; err != nil {
			return err
		}
		if int(count) != len(req.Tags) {
			return customerrors.ErrCommunicationInvalid
		}
	}

	return nil
}

func (s *GuestCommunicationService) verifyEventOwnership(eventID, userID uuid.UUID) error {
	var event models.Event
	if err := s.db.DB.Where("id = ? AND owner_id = ?", eventID, userID).First(&event).Error; err != nil {
		return customerrors.ErrEventAccess
	}
	return nil
}
