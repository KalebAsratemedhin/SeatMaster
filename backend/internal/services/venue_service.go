package services

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/errors"
	"gorm.io/gorm"
)

// VenueService handles business logic for venue operations
type VenueService struct {
	db *database.DB
}

// NewVenueService creates a new venue service
func NewVenueService(db *database.DB) *VenueService {
	return &VenueService{db: db}
}

// CreateVenue creates a new venue
func (s *VenueService) CreateVenue(ownerID uuid.UUID, req *models.CreateVenueRequest) (*models.Venue, error) {
	// Check if venue name is unique for this owner
	var existingVenue models.Venue
	err := s.db.DB.Where("owner_id = ? AND name = ?", ownerID, req.Name).First(&existingVenue).Error
	if err == nil {
		return nil, fmt.Errorf("venue with name '%s' already exists", req.Name)
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check venue name uniqueness: %w", err)
	}

	venue := &models.Venue{
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
		City:        req.City,
		State:       req.State,
		Country:     req.Country,
		PostalCode:  req.PostalCode,
		Phone:       req.Phone,
		Website:     req.Website,
		OwnerID:     ownerID,
		IsPublic:    req.IsPublic,
	}

	if err := s.db.DB.Create(venue).Error; err != nil {
		return nil, fmt.Errorf("failed to create venue: %w", err)
	}

	// Load the owner information
	if err := s.db.DB.Preload("Owner").First(venue, venue.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load venue with owner: %w", err)
	}

	return venue, nil
}

// GetVenuesByOwner retrieves all venues owned by a user
func (s *VenueService) GetVenuesByOwner(ownerID uuid.UUID) ([]models.Venue, error) {
	var venues []models.Venue
	err := s.db.DB.Where("owner_id = ?", ownerID).
		Preload("Owner").
		Preload("Rooms").
		Order("created_at DESC").
		Find(&venues).Error

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve venues: %w", err)
	}

	return venues, nil
}

// GetVenueByID retrieves a specific venue
func (s *VenueService) GetVenueByID(venueID, ownerID uuid.UUID) (*models.Venue, error) {
	var venue models.Venue
	err := s.db.DB.Where("id = ? AND owner_id = ?", venueID, ownerID).
		Preload("Owner").
		Preload("Rooms").
		First(&venue).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrVenueNotFound
		}
		return nil, fmt.Errorf("failed to retrieve venue: %w", err)
	}

	return &venue, nil
}

// UpdateVenue updates an existing venue
func (s *VenueService) UpdateVenue(venueID, ownerID uuid.UUID, req *models.UpdateVenueRequest) (*models.Venue, error) {
	// Verify venue ownership
	venue, err := s.GetVenueByID(venueID, ownerID)
	if err != nil {
		return nil, err
	}

	// Check if name is being changed and if it conflicts with existing venues
	if req.Name != nil && *req.Name != venue.Name {
		var existingVenue models.Venue
		err := s.db.DB.Where("owner_id = ? AND name = ? AND id != ?", ownerID, *req.Name, venueID).First(&existingVenue).Error
		if err == nil {
			return nil, fmt.Errorf("venue with name '%s' already exists", *req.Name)
		} else if err != gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("failed to check venue name uniqueness: %w", err)
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
	if req.Address != nil {
		updates["address"] = *req.Address
	}
	if req.City != nil {
		updates["city"] = *req.City
	}
	if req.State != nil {
		updates["state"] = *req.State
	}
	if req.Country != nil {
		updates["country"] = *req.Country
	}
	if req.PostalCode != nil {
		updates["postal_code"] = *req.PostalCode
	}
	if req.Phone != nil {
		updates["phone"] = *req.Phone
	}
	if req.Website != nil {
		updates["website"] = *req.Website
	}
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}

	if err := s.db.DB.Model(venue).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update venue: %w", err)
	}

	// Reload venue with updated data
	if err := s.db.DB.Preload("Owner").Preload("Rooms").First(venue, venueID).Error; err != nil {
		return nil, fmt.Errorf("failed to reload venue: %w", err)
	}

	return venue, nil
}

// DeleteVenue deletes a venue
func (s *VenueService) DeleteVenue(venueID, ownerID uuid.UUID) error {
	// Verify venue ownership
	_, err := s.GetVenueByID(venueID, ownerID)
	if err != nil {
		return err
	}

	// Check if venue has rooms
	var roomCount int64
	if err := s.db.DB.Model(&models.Room{}).Where("venue_id = ?", venueID).Count(&roomCount).Error; err != nil {
		return fmt.Errorf("failed to check venue rooms: %w", err)
	}

	if roomCount > 0 {
		return fmt.Errorf("cannot delete venue with existing rooms")
	}

	if err := s.db.DB.Delete(&models.Venue{}, venueID).Error; err != nil {
		return fmt.Errorf("failed to delete venue: %w", err)
	}

	return nil
}

// GetPublicVenues retrieves all public venues
func (s *VenueService) GetPublicVenues() ([]models.Venue, error) {
	var venues []models.Venue
	err := s.db.DB.Where("is_public = ?", true).
		Preload("Owner").
		Preload("Rooms").
		Order("created_at DESC").
		Find(&venues).Error

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve public venues: %w", err)
	}

	return venues, nil
}
