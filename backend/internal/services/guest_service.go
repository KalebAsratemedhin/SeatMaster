package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"

	"gorm.io/gorm"
)

type GuestService struct {
	db *database.DB
}

func NewGuestService(db *database.DB) *GuestService {
	return &GuestService{
		db: db,
	}
}

// CreateGuest creates a new guest for an event
func (s *GuestService) CreateGuest(eventID, ownerID uuid.UUID, req *models.CreateGuestRequest) (*models.Guest, error) {
	// Verify event exists and user owns it
	event, err := s.verifyEventOwnership(eventID, ownerID)
	if err != nil {
		return nil, err
	}

	// Check if guest limit is reached
	if event.MaxGuests != nil {
		var guestCount int64
		if err := s.db.Model(&models.Guest{}).Where("event_id = ?", eventID).Count(&guestCount).Error; err != nil {
			return nil, fmt.Errorf("failed to count guests: %w", err)
		}
		if guestCount >= int64(*event.MaxGuests) {
			return nil, customerrors.ErrEventFull
		}
	}

	// Check if guest with same email already exists for this event
	var existingGuest models.Guest
	if err := s.db.Where("event_id = ? AND email = ?", eventID, req.Email).First(&existingGuest).Error; err == nil {
		return nil, customerrors.ErrGuestAlreadyExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing guest: %w", err)
	}

	guest := &models.Guest{
		EventID:    eventID,
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		Notes:      req.Notes,
		RSVPStatus: models.RSVPStatusPending,
		Source:     models.GuestSourceOwnerAdded,
		Approved:   true, // Owner-added guests are automatically approved
	}

	result := s.db.Create(guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create guest: %w", result.Error)
	}

	// Load the guest with event information
	if err := s.db.Preload("Event").First(guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load created guest: %w", err)
	}

	return guest, nil
}

// GetGuestByID retrieves a guest by ID
func (s *GuestService) GetGuestByID(guestID, ownerID uuid.UUID) (*models.Guest, error) {
	var guest models.Guest
	result := s.db.Preload("Event").First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns the event
	if guest.Event.OwnerID != ownerID {
		return nil, customerrors.ErrAccessDenied
	}

	return &guest, nil
}

// GetGuestsByEvent retrieves all guests for an event
func (s *GuestService) GetGuestsByEvent(eventID, ownerID uuid.UUID) ([]models.Guest, error) {
	// Verify event exists and user owns it
	if _, err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	var guests []models.Guest
	result := s.db.Where("event_id = ?", eventID).
		Order("name ASC").
		Find(&guests)
	if result.Error != nil {
		return nil, fmt.Errorf("error finding guests: %w", result.Error)
	}

	return guests, nil
}

// UpdateGuest updates an existing guest
func (s *GuestService) UpdateGuest(guestID, ownerID uuid.UUID, req *models.UpdateGuestRequest) (*models.Guest, error) {
	var guest models.Guest
	result := s.db.Preload("Event").First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns the event
	if guest.Event.OwnerID != ownerID {
		return nil, customerrors.ErrAccessDenied
	}

	// Update only provided fields (partial update)
	if req.Name != nil {
		guest.Name = *req.Name
	}
	if req.Email != nil {
		// Check if new email conflicts with existing guest
		var existingGuest models.Guest
		if err := s.db.Where("event_id = ? AND email = ? AND id != ?", guest.EventID, *req.Email, guestID).First(&existingGuest).Error; err == nil {
			return nil, customerrors.ErrGuestAlreadyExists
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check email conflict: %w", err)
		}
		guest.Email = *req.Email
	}
	if req.Phone != nil {
		guest.Phone = req.Phone
	}
	if req.Notes != nil {
		guest.Notes = req.Notes
	}
	if req.RSVPStatus != nil {
		guest.RSVPStatus = *req.RSVPStatus
		if *req.RSVPStatus != models.RSVPStatusPending {
			now := time.Now()
			guest.RSVPDate = &now
		}
	}

	result = s.db.Save(&guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update guest: %w", result.Error)
	}

	// Load the updated guest with event information
	if err := s.db.Preload("Event").First(&guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated guest: %w", err)
	}

	return &guest, nil
}

// UpdateGuestRSVP updates a guest's RSVP status
func (s *GuestService) UpdateGuestRSVP(guestID, ownerID uuid.UUID, req *models.UpdateGuestRSVPRequest) (*models.Guest, error) {
	var guest models.Guest
	result := s.db.Preload("Event").First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns the event
	if guest.Event.OwnerID != ownerID {
		return nil, customerrors.ErrAccessDenied
	}

	// Update RSVP status
	guest.RSVPStatus = req.RSVPStatus
	if req.RSVPStatus != models.RSVPStatusPending {
		now := time.Now()
		guest.RSVPDate = &now
	}
	if req.Notes != nil {
		guest.Notes = req.Notes
	}

	result = s.db.Save(&guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update guest RSVP: %w", result.Error)
	}

	// Load the updated guest with event information
	if err := s.db.Preload("Event").First(&guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated guest: %w", err)
	}

	return &guest, nil
}

// DeleteGuest removes a guest from an event
func (s *GuestService) DeleteGuest(guestID, ownerID uuid.UUID) error {
	var guest models.Guest
	result := s.db.Preload("Event").First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return customerrors.ErrGuestNotFound
		}
		return fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns the event
	if guest.Event.OwnerID != ownerID {
		return customerrors.ErrAccessDenied
	}

	result = s.db.Delete(&guest)
	if result.Error != nil {
		return fmt.Errorf("failed to delete guest: %w", result.Error)
	}

	return nil
}

// ApproveGuest approves a pending guest
func (s *GuestService) ApproveGuest(guestID, ownerID uuid.UUID) (*models.Guest, error) {
	var guest models.Guest
	result := s.db.Preload("Event").First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns the event
	if guest.Event.OwnerID != ownerID {
		return nil, customerrors.ErrAccessDenied
	}

	// Check if guest limit is reached
	if guest.Event.MaxGuests != nil {
		var guestCount int64
		if err := s.db.Model(&models.Guest{}).Where("event_id = ? AND approved = ?", guest.EventID, true).Count(&guestCount).Error; err != nil {
			return nil, fmt.Errorf("failed to count approved guests: %w", err)
		}
		if guestCount >= int64(*guest.Event.MaxGuests) {
			return nil, customerrors.ErrEventFull
		}
	}

	guest.Approved = true
	result = s.db.Save(&guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to approve guest: %w", result.Error)
	}

	// Load the updated guest with event information
	if err := s.db.Preload("Event").First(&guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated guest: %w", err)
	}

	return &guest, nil
}

// GetGuestCount returns the total number of guests for an event
func (s *GuestService) GetGuestCount(eventID, ownerID uuid.UUID) (int64, error) {
	// Verify event exists and user owns it
	if _, err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return 0, err
	}

	var count int64
	result := s.db.Model(&models.Guest{}).Where("event_id = ?", eventID).Count(&count)
	if result.Error != nil {
		return 0, fmt.Errorf("error counting guests: %w", result.Error)
	}

	return count, nil
}

// GetGuestSummary returns a summary of guest RSVP statuses for an event
func (s *GuestService) GetGuestSummary(eventID, ownerID uuid.UUID) (*models.GuestSummary, error) {
	// Verify event exists and user owns it
	if _, err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	var summary models.GuestSummary

	// Get total count
	if err := s.db.Model(&models.Guest{}).Where("event_id = ?", eventID).Count(&summary.TotalGuests).Error; err != nil {
		return nil, fmt.Errorf("error counting total guests: %w", err)
	}

	// Get counts by RSVP status
	if err := s.db.Model(&models.Guest{}).Where("event_id = ? AND rsvp_status = ?", eventID, models.RSVPStatusAccept).Count(&summary.Confirmed).Error; err != nil {
		return nil, fmt.Errorf("error counting confirmed guests: %w", err)
	}

	if err := s.db.Model(&models.Guest{}).Where("event_id = ? AND rsvp_status = ?", eventID, models.RSVPStatusDecline).Count(&summary.Declined).Error; err != nil {
		return nil, fmt.Errorf("error counting declined guests: %w", err)
	}

	if err := s.db.Model(&models.Guest{}).Where("event_id = ? AND rsvp_status = ?", eventID, models.RSVPStatusPending).Count(&summary.Pending).Error; err != nil {
		return nil, fmt.Errorf("error counting pending guests: %w", err)
	}

	if err := s.db.Model(&models.Guest{}).Where("event_id = ? AND rsvp_status = ?", eventID, models.RSVPStatusMaybe).Count(&summary.Maybe).Error; err != nil {
		return nil, fmt.Errorf("error counting maybe guests: %w", err)
	}

	// Calculate confirmation rate
	if summary.TotalGuests > 0 {
		summary.ConfirmationRate = float64(summary.Confirmed) / float64(summary.TotalGuests) * 100
	}

	return &summary, nil
}

// verifyEventOwnership verifies that an event exists and is owned by the specified user
func (s *GuestService) verifyEventOwnership(eventID, ownerID uuid.UUID) (*models.Event, error) {
	var event models.Event
	result := s.db.First(&event, eventID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrEventNotFound
		}
		return nil, fmt.Errorf("error finding event: %w", result.Error)
	}

	if event.OwnerID != ownerID {
		return nil, customerrors.ErrAccessDenied
	}

	return &event, nil
}

// RegisterUserForEvent registers an authenticated user for an event
func (s *GuestService) RegisterUserForEvent(eventID, userID uuid.UUID, req *models.UserEventRegistrationRequest) (*models.UserEventRegistrationResponse, error) {
	// Verify event exists and is public
	var event models.Event
	result := s.db.First(&event, eventID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrEventNotFound
		}
		return nil, fmt.Errorf("error finding event: %w", result.Error)
	}

	// Check if event is public
	if event.Visibility != models.EventVisibilityPublic {
		return nil, customerrors.ErrAccessDenied
	}

	// Check if user is already registered for this event
	var existingGuest models.Guest
	if err := s.db.Where("event_id = ? AND user_id = ?", eventID, userID).First(&existingGuest).Error; err == nil {
		return nil, customerrors.ErrGuestAlreadyExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing registration: %w", err)
	}

	// Get user information
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if guest limit is reached
	if event.MaxGuests != nil {
		var guestCount int64
		if err := s.db.Model(&models.Guest{}).Where("event_id = ?", eventID).Count(&guestCount).Error; err != nil {
			return nil, fmt.Errorf("failed to count guests: %w", err)
		}

		// Account for plus-one if provided
		additionalGuests := 1
		if req.PlusOne != nil {
			additionalGuests = 2
		}

		if guestCount+int64(additionalGuests) > int64(*event.MaxGuests) {
			return nil, customerrors.ErrEventFull
		}
	}

	// Create main guest registration
	guest := &models.Guest{
		EventID:    eventID,
		UserID:     &userID,
		Name:       fmt.Sprintf("%s %s", user.FirstName, user.LastName),
		Email:      user.Email,
		Phone:      user.Phone,
		Notes:      req.Notes,
		RSVPStatus: models.RSVPStatusPending,
		Source:     models.GuestSourceUserRegistration,
		Approved:   !event.RequireApproval, // Auto-approve if approval not required
	}

	result = s.db.Create(guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create guest registration: %w", result.Error)
	}

	// Load the created guest
	if err := s.db.Preload("User").First(guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load created guest: %w", err)
	}

	response := &models.UserEventRegistrationResponse{
		Guest:   guest,
		Message: "Successfully registered for event",
	}

	// Handle plus-one registration if provided
	if req.PlusOne != nil {
		plusOne := &models.Guest{
			EventID:    eventID,
			Name:       req.PlusOne.Name,
			Email:      "", // Plus-one doesn't have email
			Phone:      nil,
			Notes:      req.PlusOne.Notes,
			RSVPStatus: models.RSVPStatusPending,
			Source:     models.GuestSourceUserRegistration,
			Approved:   !event.RequireApproval,
		}

		result = s.db.Create(plusOne)
		if result.Error != nil {
			return nil, fmt.Errorf("failed to create plus-one registration: %w", result.Error)
		}

		response.PlusOne = plusOne
		response.Message = "Successfully registered for event with plus-one"
	}

	return response, nil
}

// GetUserRegistrations retrieves all event registrations for a specific user
func (s *GuestService) GetUserRegistrations(userID uuid.UUID) ([]models.Guest, error) {
	var guests []models.Guest
	result := s.db.Where("user_id = ?", userID).
		Preload("Event").
		Order("created_at DESC").
		Find(&guests)
	if result.Error != nil {
		return nil, fmt.Errorf("error finding user registrations: %w", result.Error)
	}

	return guests, nil
}

// GetUserRegistrationCount returns the total number of registrations for a user
func (s *GuestService) GetUserRegistrationCount(userID uuid.UUID) (int64, error) {
	var count int64
	result := s.db.Model(&models.Guest{}).Where("user_id = ?", userID).Count(&count)
	if result.Error != nil {
		return 0, fmt.Errorf("error counting user registrations: %w", result.Error)
	}

	return count, nil
}

// UpdateUserRegistration updates a user's event registration
func (s *GuestService) UpdateUserRegistration(guestID, userID uuid.UUID, req *models.UpdateGuestRequest) (*models.Guest, error) {
	var guest models.Guest
	result := s.db.First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns this registration by checking if UserID matches
	if guest.UserID == nil || *guest.UserID != userID {
		return nil, customerrors.ErrAccessDenied
	}

	// Update only provided fields (partial update)
	if req.Name != nil {
		guest.Name = *req.Name
	}
	if req.Email != nil {
		// Check if new email conflicts with existing guest
		var existingGuest models.Guest
		if err := s.db.Where("event_id = ? AND email = ? AND id != ?", guest.EventID, *req.Email, guestID).First(&existingGuest).Error; err == nil {
			return nil, customerrors.ErrGuestAlreadyExists
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check email conflict: %w", err)
		}
		guest.Email = *req.Email
	}
	if req.Phone != nil {
		guest.Phone = req.Phone
	}
	if req.Notes != nil {
		guest.Notes = req.Notes
	}
	if req.RSVPStatus != nil {
		guest.RSVPStatus = *req.RSVPStatus
		if *req.RSVPStatus != models.RSVPStatusPending {
			now := time.Now()
			guest.RSVPDate = &now
		}
	}

	result = s.db.Save(&guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update registration: %w", result.Error)
	}

	// Load the updated guest with user information
	if err := s.db.Preload("User").First(&guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated guest: %w", err)
	}

	return &guest, nil
}

// CancelUserRegistration cancels a user's event registration
func (s *GuestService) CancelUserRegistration(guestID, userID uuid.UUID) error {
	var guest models.Guest
	result := s.db.First(&guest, guestID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return customerrors.ErrGuestNotFound
		}
		return fmt.Errorf("error finding guest: %w", result.Error)
	}

	// Verify user owns this registration by checking if UserID matches
	if guest.UserID == nil || *guest.UserID != userID {
		return customerrors.ErrAccessDenied
	}

	result = s.db.Delete(&guest)
	if result.Error != nil {
		return fmt.Errorf("failed to cancel registration: %w", result.Error)
	}

	return nil
}
