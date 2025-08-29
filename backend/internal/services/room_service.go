package services

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/errors"
	"gorm.io/gorm"
)

// RoomService handles business logic for room operations
type RoomService struct {
	db *database.DB
}

// NewRoomService creates a new room service
func NewRoomService(db *database.DB) *RoomService {
	return &RoomService{db: db}
}

// CreateRoom creates a new room in a venue
func (s *RoomService) CreateRoom(venueID, ownerID uuid.UUID, req *models.CreateRoomRequest) (*models.Room, error) {
	// Verify venue ownership
	var venue models.Venue
	err := s.db.DB.Where("id = ? AND owner_id = ?", venueID, ownerID).First(&venue).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrVenueNotFound
		}
		return nil, fmt.Errorf("failed to verify venue ownership: %w", err)
	}

	// Check if room name is unique within this venue
	var existingRoom models.Room
	err = s.db.DB.Where("venue_id = ? AND name = ?", venueID, req.Name).First(&existingRoom).Error
	if err == nil {
		return nil, fmt.Errorf("room with name '%s' already exists in this venue", req.Name)
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check room name uniqueness: %w", err)
	}

	room := &models.Room{
		VenueID:     venueID,
		Name:        req.Name,
		Description: req.Description,
		Capacity:    req.Capacity,
		Floor:       req.Floor,
		RoomType:    req.RoomType,
	}

	if err := s.db.DB.Create(room).Error; err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	// Load the venue information
	if err := s.db.DB.Preload("Venue").First(room, room.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load room with venue: %w", err)
	}

	return room, nil
}

// GetRoomsByVenue retrieves all rooms in a venue
func (s *RoomService) GetRoomsByVenue(venueID, ownerID uuid.UUID) ([]models.Room, error) {
	// Verify venue ownership
	var venue models.Venue
	err := s.db.DB.Where("id = ? AND owner_id = ?", venueID, ownerID).First(&venue).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrVenueNotFound
		}
		return nil, fmt.Errorf("failed to verify venue ownership: %w", err)
	}

	var rooms []models.Room
	err = s.db.DB.Where("venue_id = ?", venueID).
		Preload("Venue").
		Preload("Seats").
		Order("floor ASC, name ASC").
		Find(&rooms).Error

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve rooms: %w", err)
	}

	return rooms, nil
}

// GetRoomByID retrieves a specific room
func (s *RoomService) GetRoomByID(roomID, ownerID uuid.UUID) (*models.Room, error) {
	var room models.Room
	err := s.db.DB.Where("id = ?", roomID).
		Preload("Venue").
		Preload("Seats").
		First(&room).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrRoomNotFound
		}
		return nil, fmt.Errorf("failed to retrieve room: %w", err)
	}

	// Verify venue ownership
	if room.Venue.OwnerID != ownerID {
		return nil, errors.ErrRoomAccess
	}

	return &room, nil
}

// UpdateRoom updates an existing room
func (s *RoomService) UpdateRoom(roomID, ownerID uuid.UUID, req *models.UpdateRoomRequest) (*models.Room, error) {
	// Verify room ownership
	room, err := s.GetRoomByID(roomID, ownerID)
	if err != nil {
		return nil, err
	}

	// Check if name is being changed and if it conflicts with existing rooms in the same venue
	if req.Name != nil && *req.Name != room.Name {
		var existingRoom models.Room
		err := s.db.DB.Where("venue_id = ? AND name = ? AND id != ?", room.VenueID, *req.Name, roomID).First(&existingRoom).Error
		if err == nil {
			return nil, fmt.Errorf("room with name '%s' already exists in this venue", *req.Name)
		} else if err != gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("failed to check room name uniqueness: %w", err)
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
	if req.Capacity != nil {
		updates["capacity"] = *req.Capacity
	}
	if req.Floor != nil {
		updates["floor"] = *req.Floor
	}
	if req.RoomType != nil {
		updates["room_type"] = *req.RoomType
	}

	if err := s.db.DB.Model(room).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update room: %w", err)
	}

	// Reload room with updated data
	if err := s.db.DB.Preload("Venue").Preload("Seats").First(room, roomID).Error; err != nil {
		return nil, fmt.Errorf("failed to reload room: %w", err)
	}

	return room, nil
}

// DeleteRoom deletes a room
func (s *RoomService) DeleteRoom(roomID, ownerID uuid.UUID) error {
	// Verify room ownership
	_, err := s.GetRoomByID(roomID, ownerID)
	if err != nil {
		return err
	}

	// Check if room has seats
	var seatCount int64
	if err := s.db.DB.Model(&models.Seat{}).Where("room_id = ?", roomID).Count(&seatCount).Error; err != nil {
		return fmt.Errorf("failed to check room seats: %w", err)
	}

	if seatCount > 0 {
		return fmt.Errorf("cannot delete room with existing seats")
	}

	if err := s.db.DB.Delete(&models.Room{}, roomID).Error; err != nil {
		return fmt.Errorf("failed to delete room: %w", err)
	}

	return nil
}
