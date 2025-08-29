package services

import (
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/errors"
	"gorm.io/gorm"
)

// SeatService handles business logic for seat operations
type SeatService struct {
	db *database.DB
}

// NewSeatService creates a new seat service
func NewSeatService(db *database.DB) *SeatService {
	return &SeatService{db: db}
}

// CreateSeat creates a new seat in a room
func (s *SeatService) CreateSeat(roomID, ownerID uuid.UUID, req *models.CreateSeatRequest) (*models.Seat, error) {
	// Verify room ownership
	var room models.Room
	err := s.db.DB.Where("id = ?", roomID).Preload("Venue").First(&room).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrRoomNotFound
		}
		return nil, fmt.Errorf("failed to retrieve room: %w", err)
	}

	if room.Venue.OwnerID != ownerID {
		return nil, errors.ErrRoomAccess
	}

	// Check if seat row/number combination is unique within this room
	var existingSeat models.Seat
	err = s.db.DB.Where("room_id = ? AND row = ? AND number = ?", roomID, req.Row, req.Number).First(&existingSeat).Error
	if err == nil {
		return nil, fmt.Errorf("seat with row '%s' and number '%s' already exists in this room", req.Row, req.Number)
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check seat uniqueness: %w", err)
	}

	seat := &models.Seat{
		RoomID:   roomID,
		Row:      req.Row,
		Number:   req.Number,
		Category: req.Category,
		Status:   req.Status,
		X:        req.X,
		Y:        req.Y,
		Width:    req.Width,
		Height:   req.Height,
		Rotation: req.Rotation,
	}

	if err := s.db.DB.Create(seat).Error; err != nil {
		return nil, fmt.Errorf("failed to create seat: %w", err)
	}

	// Load the room and venue information
	if err := s.db.DB.Preload("Room.Venue").First(seat, seat.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load seat with room and venue: %w", err)
	}

	return seat, nil
}

// CreateSeatGrid creates a grid of seats in a room
func (s *SeatService) CreateSeatGrid(roomID, ownerID uuid.UUID, req *models.CreateSeatGridRequest) ([]models.Seat, error) {
	// Verify room ownership
	var room models.Room
	err := s.db.DB.Where("id = ?", roomID).Preload("Venue").First(&room).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrRoomNotFound
		}
		return nil, fmt.Errorf("failed to retrieve room: %w", err)
	}

	if room.Venue.OwnerID != ownerID {
		return nil, errors.ErrRoomAccess
	}

	// Generate seats for each row and number combination
	var seats []models.Seat
	currentX := req.StartX
	currentY := req.StartY

	// Convert row letters to numbers for iteration
	startRowNum := int(req.StartRow[0])
	endRowNum := int(req.EndRow[0])

	for rowNum := startRowNum; rowNum <= endRowNum; rowNum++ {
		row := string(rune(rowNum))
		for number := req.StartNumber; number <= req.EndNumber; number++ {
			seat := models.Seat{
				RoomID:   roomID,
				Row:      row,
				Number:   strconv.Itoa(number),
				Category: req.Category,
				Status:   models.SeatStatusAvailable,
				X:        currentX,
				Y:        currentY,
				Width:    1.0,
				Height:   1.0,
				Rotation: 0.0,
			}
			seats = append(seats, seat)
			currentX += req.SpacingX
		}
		currentX = req.StartX
		currentY += req.SpacingY
	}

	// Create all seats in a transaction
	tx := s.db.DB.Begin()
	if err := tx.Error; err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&seats).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create seat grid: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return seats, nil
}

// GetSeatsByRoom retrieves all seats in a room
func (s *SeatService) GetSeatsByRoom(roomID, ownerID uuid.UUID) ([]models.Seat, error) {
	// Verify room ownership
	var room models.Room
	err := s.db.DB.Where("id = ?", roomID).Preload("Venue").First(&room).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrRoomNotFound
		}
		return nil, fmt.Errorf("failed to retrieve room: %w", err)
	}

	if room.Venue.OwnerID != ownerID {
		return nil, errors.ErrRoomAccess
	}

	var seats []models.Seat
	err = s.db.DB.Where("room_id = ?", roomID).
		Preload("Room").
		Preload("Guest").
		Order("row ASC, number ASC").
		Find(&seats).Error

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve seats: %w", err)
	}

	return seats, nil
}

// UpdateSeat updates an existing seat
func (s *SeatService) UpdateSeat(seatID, ownerID uuid.UUID, req *models.UpdateSeatRequest) (*models.Seat, error) {
	// Verify seat ownership
	seat, err := s.GetSeatByID(seatID, ownerID)
	if err != nil {
		return nil, err
	}

	// Check if row/number is being changed and if it conflicts with existing seats
	if (req.Row != nil && *req.Row != seat.Row) || (req.Number != nil && *req.Number != seat.Number) {
		newRow := seat.Row
		newNumber := seat.Number
		if req.Row != nil {
			newRow = *req.Row
		}
		if req.Number != nil {
			newNumber = *req.Number
		}

		var existingSeat models.Seat
		err := s.db.DB.Where("room_id = ? AND row = ? AND number = ? AND id != ?", seat.RoomID, newRow, newNumber, seatID).First(&existingSeat).Error
		if err == nil {
			return nil, fmt.Errorf("seat with row '%s' and number '%s' already exists in this room", newRow, newNumber)
		} else if err != gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("failed to check seat uniqueness: %w", err)
		}
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Row != nil {
		updates["row"] = *req.Row
	}
	if req.Number != nil {
		updates["number"] = *req.Number
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.X != nil {
		updates["x"] = *req.X
	}
	if req.Y != nil {
		updates["y"] = *req.Y
	}
	if req.Width != nil {
		updates["width"] = *req.Width
	}
	if req.Height != nil {
		updates["height"] = *req.Height
	}
	if req.Rotation != nil {
		updates["rotation"] = *req.Rotation
	}

	if err := s.db.DB.Model(seat).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update seat: %w", err)
	}

	// Reload seat with updated data
	if err := s.db.DB.Preload("Room").Preload("Guest").First(seat, seatID).Error; err != nil {
		return nil, fmt.Errorf("failed to reload seat: %w", err)
	}

	return seat, nil
}

// DeleteSeat deletes a seat
func (s *SeatService) DeleteSeat(seatID, ownerID uuid.UUID) error {
	// Verify seat ownership
	seat, err := s.GetSeatByID(seatID, ownerID)
	if err != nil {
		return err
	}

	// Check if seat is assigned to a guest
	if seat.GuestID != nil {
		return fmt.Errorf("cannot delete seat that is assigned to a guest")
	}

	if err := s.db.DB.Delete(&models.Seat{}, seatID).Error; err != nil {
		return fmt.Errorf("failed to delete seat: %w", err)
	}

	return nil
}

// GetSeatByID retrieves a specific seat
func (s *SeatService) GetSeatByID(seatID, ownerID uuid.UUID) (*models.Seat, error) {
	var seat models.Seat
	err := s.db.DB.Where("id = ?", seatID).
		Preload("Room.Venue").
		Preload("Guest").
		First(&seat).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrSeatNotFound
		}
		return nil, fmt.Errorf("failed to retrieve seat: %w", err)
	}

	// Verify room ownership
	if seat.Room.Venue.OwnerID != ownerID {
		return nil, errors.ErrSeatAccess
	}

	return &seat, nil
}

// AssignGuestToSeat assigns a guest to a specific seat
func (s *SeatService) AssignGuestToSeat(eventID, seatID, guestID, ownerID uuid.UUID) (*models.SeatingAssignment, error) {
	// Verify seat ownership
	seat, err := s.GetSeatByID(seatID, ownerID)
	if err != nil {
		return nil, err
	}

	// Check if seat is available
	if seat.Status != models.SeatStatusAvailable {
		return nil, errors.ErrSeatOccupied
	}

	// Check if guest exists and belongs to the event
	var guest models.Guest
	err = s.db.DB.Where("id = ? AND event_id = ?", guestID, eventID).First(&guest).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("failed to retrieve guest: %w", err)
	}

	// Check if guest is already assigned to a seat
	var existingAssignment models.SeatingAssignment
	err = s.db.DB.Where("event_id = ? AND guest_id = ?", eventID, guestID).First(&existingAssignment).Error
	if err == nil {
		return nil, fmt.Errorf("guest is already assigned to a seat")
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check existing assignment: %w", err)
	}

	// Create seating assignment
	assignment := &models.SeatingAssignment{
		EventID:    eventID,
		GuestID:    guestID,
		SeatID:     seatID,
		AssignedBy: ownerID,
		AssignedAt: time.Now(),
	}

	if err := s.db.DB.Create(assignment).Error; err != nil {
		return nil, fmt.Errorf("failed to create seating assignment: %w", err)
	}

	// Update seat status and guest assignment
	updates := map[string]interface{}{
		"status":   models.SeatStatusOccupied,
		"guest_id": guestID,
	}

	if err := s.db.DB.Model(seat).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update seat: %w", err)
	}

	// Load the complete assignment data
	if err := s.db.DB.Preload("Event").Preload("Guest").Preload("Seat").Preload("AssignedByUser").First(assignment, assignment.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load assignment data: %w", err)
	}

	return assignment, nil
}

// UnassignGuestFromSeat removes a guest from a seat
func (s *SeatService) UnassignGuestFromSeat(eventID, seatID, ownerID uuid.UUID) error {
	// Verify seat ownership
	seat, err := s.GetSeatByID(seatID, ownerID)
	if err != nil {
		return err
	}

	// Find and delete the seating assignment
	var assignment models.SeatingAssignment
	err = s.db.DB.Where("event_id = ? AND seat_id = ?", eventID, seatID).First(&assignment).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("no seating assignment found for this seat and event")
		}
		return fmt.Errorf("failed to retrieve seating assignment: %w", err)
	}

	if err := s.db.DB.Delete(&assignment).Error; err != nil {
		return fmt.Errorf("failed to delete seating assignment: %w", err)
	}

	// Update seat status and remove guest assignment
	updates := map[string]interface{}{
		"status":   models.SeatStatusAvailable,
		"guest_id": nil,
	}

	if err := s.db.DB.Model(seat).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update seat: %w", err)
	}

	return nil
}

// GetSeatAssignments retrieves all seat assignments for an event
func (s *SeatService) GetSeatAssignments(eventID, ownerID uuid.UUID) ([]models.SeatingAssignment, error) {
	// Verify event ownership
	var event models.Event
	err := s.db.DB.Where("id = ? AND owner_id = ?", eventID, ownerID).First(&event).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrEventNotFound
		}
		return nil, fmt.Errorf("failed to verify event ownership: %w", err)
	}

	var assignments []models.SeatingAssignment
	err = s.db.DB.Where("event_id = ?", eventID).
		Preload("Event").
		Preload("Guest").
		Preload("Seat").
		Preload("AssignedByUser").
		Order("created_at ASC").
		Find(&assignments).Error

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve seat assignments: %w", err)
	}

	return assignments, nil
}
