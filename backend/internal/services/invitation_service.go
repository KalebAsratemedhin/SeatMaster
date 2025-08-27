package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"
	"gorm.io/gorm"
)

type InvitationService struct {
	db *database.DB
}

// NewInvitationService creates a new invitation service
func NewInvitationService(db *database.DB) *InvitationService {
	return &InvitationService{db: db}
}

// generateSecureToken generates a cryptographically secure random token
func (s *InvitationService) generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// verifyEventOwnership verifies that a user owns the specified event
func (s *InvitationService) verifyEventOwnership(eventID, ownerID uuid.UUID) (*models.Event, error) {
	var event models.Event
	result := s.db.DB.First(&event, eventID)
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

// CreateInvitation creates a new invitation for an event
func (s *InvitationService) CreateInvitation(eventID, ownerID uuid.UUID, req *models.CreateInvitationRequest) (*models.Invitation, error) {
	// Verify event ownership
	if _, err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	// Check if email already has an invitation for this event
	var existingInvitation models.Invitation
	if err := s.db.DB.Where("event_id = ? AND email = ?", eventID, req.Email).First(&existingInvitation).Error; err == nil {
		return nil, customerrors.ErrInvitationAlreadyExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing invitation: %w", err)
	}

	// Generate secure token
	token, err := s.generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate invitation token: %w", err)
	}

	// Calculate expiration date
	expiresAt := time.Now().AddDate(0, 0, req.ExpiresInDays)

	// Create invitation
	invitation := &models.Invitation{
		EventID:        eventID,
		Email:          req.Email,
		Token:          token,
		Status:         models.InviteStatusSent,
		ExpiresAt:      expiresAt,
		PrefilledName:  req.PrefilledName,
		PrefilledPhone: req.PrefilledPhone,
		PrefilledNotes: req.PrefilledNotes,
		SentAt:         time.Now(),
	}

	result := s.db.DB.Create(invitation)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create invitation: %w", result.Error)
	}

	// Load the created invitation with event information
	if err := s.db.DB.Preload("Event").First(invitation, invitation.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load created invitation: %w", err)
	}

	return invitation, nil
}

// GetInvitationsByEvent retrieves all invitations for an event
func (s *InvitationService) GetInvitationsByEvent(eventID, ownerID uuid.UUID) ([]models.Invitation, error) {
	// Verify event ownership
	if _, err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	var invitations []models.Invitation
	result := s.db.DB.Where("event_id = ?", eventID).
		Order("created_at DESC").
		Find(&invitations)
	if result.Error != nil {
		return nil, fmt.Errorf("error finding invitations: %w", result.Error)
	}

	return invitations, nil
}

// GetInvitationByID retrieves a specific invitation
func (s *InvitationService) GetInvitationByID(invitationID, ownerID uuid.UUID) (*models.Invitation, error) {
	var invitation models.Invitation
	result := s.db.DB.Preload("Event").First(&invitation, invitationID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrInvitationNotFound
		}
		return nil, fmt.Errorf("error finding invitation: %w", result.Error)
	}

	// Verify event ownership
	if invitation.Event.OwnerID != ownerID {
		return nil, customerrors.ErrAccessDenied
	}

	return &invitation, nil
}

// GetInvitationByToken retrieves an invitation by its token (public endpoint)
func (s *InvitationService) GetInvitationByToken(token string) (*models.Invitation, error) {
	var invitation models.Invitation
	result := s.db.DB.Preload("Event").Where("token = ?", token).First(&invitation)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrInvitationNotFound
		}
		return nil, fmt.Errorf("error finding invitation: %w", result.Error)
	}

	return &invitation, nil
}

// UpdateInvitation updates an existing invitation
func (s *InvitationService) UpdateInvitation(invitationID, ownerID uuid.UUID, req *models.UpdateInvitationRequest) (*models.Invitation, error) {
	// Get invitation and verify ownership
	invitation, err := s.GetInvitationByID(invitationID, ownerID)
	if err != nil {
		return nil, err
	}

	// Only allow updates for sent invitations
	if invitation.Status != models.InviteStatusSent {
		return nil, customerrors.ErrInvitationCannotBeUpdated
	}

	// Update only provided fields (partial update)
	if req.PrefilledName != nil {
		invitation.PrefilledName = req.PrefilledName
	}
	if req.PrefilledPhone != nil {
		invitation.PrefilledPhone = req.PrefilledPhone
	}
	if req.PrefilledNotes != nil {
		invitation.PrefilledNotes = req.PrefilledNotes
	}
	if req.ExpiresInDays != nil {
		invitation.ExpiresAt = time.Now().AddDate(0, 0, *req.ExpiresInDays)
	}

	result := s.db.DB.Save(invitation)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update invitation: %w", result.Error)
	}

	// Load the updated invitation with event information
	if err := s.db.DB.Preload("Event").First(invitation, invitation.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated invitation: %w", err)
	}

	return invitation, nil
}

// CancelInvitation cancels an invitation
func (s *InvitationService) CancelInvitation(invitationID, ownerID uuid.UUID) error {
	// Get invitation and verify ownership
	invitation, err := s.GetInvitationByID(invitationID, ownerID)
	if err != nil {
		return err
	}

	// Only allow cancellation for sent invitations
	if invitation.Status != models.InviteStatusSent {
		return customerrors.ErrInvitationCannotBeCancelled
	}

	invitation.Status = models.InviteStatusCancelled
	result := s.db.DB.Save(invitation)
	if result.Error != nil {
		return fmt.Errorf("failed to cancel invitation: %w", result.Error)
	}

	return nil
}

// AcceptInvitation accepts an invitation and creates a guest record
func (s *InvitationService) AcceptInvitation(token string, req *models.AcceptInvitationRequest) (*models.AcceptInvitationResponse, error) {
	// Find invitation by token
	var invitation models.Invitation
	result := s.db.DB.Preload("Event").Where("token = ?", token).First(&invitation)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrInvitationNotFound
		}
		return nil, fmt.Errorf("error finding invitation: %w", result.Error)
	}

	// Check invitation status
	if invitation.Status != models.InviteStatusSent {
		return nil, customerrors.ErrInvitationCannotBeAccepted
	}

	// Check if invitation is expired
	if time.Now().After(invitation.ExpiresAt) {
		invitation.Status = models.InviteStatusExpired
		now := time.Now()
		invitation.ExpiredAt = &now
		if err := s.db.DB.Save(invitation).Error; err != nil {
			return nil, fmt.Errorf("failed to mark invitation as expired: %w", err)
		}
		return nil, customerrors.ErrInvitationExpired
	}

	// Check if guest already exists for this event and email
	var existingGuest models.Guest
	if err := s.db.DB.Where("event_id = ? AND email = ?", invitation.EventID, invitation.Email).First(&existingGuest).Error; err == nil {
		return nil, customerrors.ErrGuestAlreadyExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing guest: %w", err)
	}

	// Create guest record using invitation information
	guest := &models.Guest{
		EventID:    invitation.EventID,
		Email:      invitation.Email,
		RSVPStatus: req.RSVPStatus,
		Source:     models.GuestSourceInvitation,
		Approved:   !invitation.Event.RequireApproval, // Auto-approve if approval not required
	}

	// Set name - use pre-filled name if available, otherwise use email
	if invitation.PrefilledName != nil && *invitation.PrefilledName != "" {
		guest.Name = *invitation.PrefilledName
	} else {
		guest.Name = invitation.Email
	}

	// Set phone if pre-filled
	if invitation.PrefilledPhone != nil {
		guest.Phone = invitation.PrefilledPhone
	}

	// Set notes - use provided notes if available, otherwise use pre-filled notes
	if req.Notes != nil {
		guest.Notes = req.Notes
	} else if invitation.PrefilledNotes != nil {
		guest.Notes = invitation.PrefilledNotes
	}

	if req.RSVPStatus != models.RSVPStatusPending {
		now := time.Now()
		guest.RSVPDate = &now
	}

	result = s.db.DB.Create(guest)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create guest: %w", result.Error)
	}

	// Update invitation status using direct database update
	if err := s.db.DB.Model(&models.Invitation{}).
		Where("id = ?", invitation.ID).
		Updates(map[string]interface{}{
			"status":      models.InviteStatusAccepted,
			"accepted_at": time.Now(),
		}).Error; err != nil {
		return nil, fmt.Errorf("failed to update invitation status: %w", err)
	}

	// Load the created guest
	if err := s.db.DB.First(guest, guest.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load created guest: %w", err)
	}

	response := &models.AcceptInvitationResponse{
		Guest:   *guest,
		Message: "Successfully accepted invitation",
	}

	return response, nil
}

// ResendInvitation resends an invitation with a new token
func (s *InvitationService) ResendInvitation(invitationID, ownerID uuid.UUID) (*models.Invitation, error) {
	// Get invitation and verify ownership
	invitation, err := s.GetInvitationByID(invitationID, ownerID)
	if err != nil {
		return nil, err
	}

	// Only allow resending for sent or expired invitations
	if invitation.Status != models.InviteStatusSent && invitation.Status != models.InviteStatusExpired {
		return nil, customerrors.ErrInvitationCannotBeResent
	}

	// Generate new secure token
	newToken, err := s.generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate new invitation token: %w", err)
	}

	// Update invitation
	invitation.Token = newToken
	invitation.Status = models.InviteStatusSent
	invitation.ExpiresAt = time.Now().AddDate(0, 0, 30) // Default to 30 days
	invitation.SentAt = time.Now()
	invitation.ExpiredAt = nil
	invitation.AcceptedAt = nil

	result := s.db.DB.Save(invitation)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to resend invitation: %w", result.Error)
	}

	// Load the updated invitation with event information
	if err := s.db.DB.Preload("Event").First(invitation, invitation.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated invitation: %w", err)
	}

	return invitation, nil
}

// CleanupExpiredInvitations removes expired invitations (scheduled task)
func (s *InvitationService) CleanupExpiredInvitations() error {
	now := time.Now()

	// Mark expired invitations
	result := s.db.DB.Model(&models.Invitation{}).
		Where("status = ? AND expires_at < ?", models.InviteStatusSent, now).
		Updates(map[string]interface{}{
			"status":     models.InviteStatusExpired,
			"expired_at": now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to mark expired invitations: %w", result.Error)
	}

	return nil
}
