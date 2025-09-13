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

// SeatingAssignmentService handles business logic for seating assignments
type SeatingAssignmentService struct {
	db *database.DB
}

// NewSeatingAssignmentService creates a new seating assignment service
func NewSeatingAssignmentService(db *database.DB) *SeatingAssignmentService {
	return &SeatingAssignmentService{db: db}
}

// AssignGuestToSeat assigns a guest to a specific seat for an event
func (s *SeatingAssignmentService) AssignGuestToSeat(eventID, guestID, seatID, ownerID uuid.UUID, notes *string) (*models.SeatingAssignment, error) {
	// Verify event ownership
	_, err := s.verifyEventOwnership(eventID, ownerID)
	if err != nil {
		return nil, err
	}

	// Verify guest belongs to this event
	var guest models.Guest
	if err := s.db.Where("id = ? AND event_id = ?", guestID, eventID).First(&guest).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, customerrors.ErrGuestNotFound
		}
		return nil, fmt.Errorf("failed to verify guest: %w", err)
	}

	// Verify seat exists and get venue/room info
	var seat models.Seat
	if err := s.db.Preload("Room.Venue").Where("id = ?", seatID).First(&seat).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, customerrors.ErrSeatNotFound
		}
		return nil, fmt.Errorf("failed to verify seat: %w", err)
	}

	// Verify seat belongs to the same venue as the event (if event has venue)
	// Note: This assumes events have venue information - adjust based on your event model

	// Check if seat is already assigned for this event
	var existingAssignment models.SeatingAssignment
	if err := s.db.Where("event_id = ? AND seat_id = ?", eventID, seatID).First(&existingAssignment).Error; err == nil {
		return nil, fmt.Errorf("seat is already assigned to another guest for this event")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check seat availability: %w", err)
	}

	// Check if guest already has a seat assignment for this event
	var existingGuestAssignment models.SeatingAssignment
	if err := s.db.Where("event_id = ? AND guest_id = ?", eventID, guestID).First(&existingGuestAssignment).Error; err == nil {
		return nil, fmt.Errorf("guest already has a seat assignment for this event")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check guest assignment: %w", err)
	}

	// Create seating assignment
	assignment := &models.SeatingAssignment{
		EventID:    eventID,
		GuestID:    guestID,
		SeatID:     seatID,
		AssignedBy: ownerID,
		AssignedAt: time.Now(),
		Notes:      notes,
	}

	if err := s.db.Create(assignment).Error; err != nil {
		return nil, fmt.Errorf("failed to create seating assignment: %w", err)
	}

	// Load the created assignment with all relationships
	if err := s.db.Preload("Event").Preload("Guest").Preload("Seat.Room.Venue").Preload("AssignedByUser").First(assignment, assignment.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load seating assignment: %w", err)
	}

	// Update seat status to occupied
	if err := s.db.Model(&seat).Update("status", models.SeatStatusOccupied).Error; err != nil {
		return nil, fmt.Errorf("failed to update seat status: %w", err)
	}

	return assignment, nil
}

// UnassignGuestFromSeat removes a guest from their seat assignment
func (s *SeatingAssignmentService) UnassignGuestFromSeat(eventID, seatID, ownerID uuid.UUID) error {
	// Verify event ownership
	_, err := s.verifyEventOwnership(eventID, ownerID)
	if err != nil {
		return err
	}

	// Find the assignment
	var assignment models.SeatingAssignment
	if err := s.db.Where("event_id = ? AND seat_id = ?", eventID, seatID).First(&assignment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return customerrors.ErrSeatingAssignmentNotFound
		}
		return fmt.Errorf("failed to find seating assignment: %w", err)
	}

	// Delete the assignment
	if err := s.db.Delete(&assignment).Error; err != nil {
		return fmt.Errorf("failed to delete seating assignment: %w", err)
	}

	// Update seat status to available
	if err := s.db.Model(&models.Seat{}).Where("id = ?", seatID).Update("status", models.SeatStatusAvailable).Error; err != nil {
		return fmt.Errorf("failed to update seat status: %w", err)
	}

	return nil
}

// GetSeatingAssignments retrieves all seat assignments for an event
func (s *SeatingAssignmentService) GetSeatingAssignments(eventID, ownerID uuid.UUID) ([]models.SeatingAssignment, error) {
	// Verify event ownership
	_, err := s.verifyEventOwnership(eventID, ownerID)
	if err != nil {
		return nil, err
	}

	var assignments []models.SeatingAssignment
	if err := s.db.Preload("Event").Preload("Guest").Preload("Seat.Room.Venue").Preload("AssignedByUser").
		Where("event_id = ?", eventID).Find(&assignments).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve seating assignments: %w", err)
	}

	return assignments, nil
}

// GetSeatingChart retrieves a complete seating chart for an event
func (s *SeatingAssignmentService) GetSeatingChart(eventID, ownerID uuid.UUID) (*models.SeatingChartResponse, error) {
	// Verify event ownership
	event, err := s.verifyEventOwnership(eventID, ownerID)
	if err != nil {
		return nil, err
	}

	// Get all seating assignments for the event
	assignments, err := s.GetSeatingAssignments(eventID, ownerID)
	if err != nil {
		return nil, err
	}

	// Get venue and room information from the first assignment (if any)
	var venueID, venueName, roomID, roomName string
	if len(assignments) > 0 {
		venueID = assignments[0].Seat.Room.Venue.ID.String()
		venueName = assignments[0].Seat.Room.Venue.Name
		roomID = assignments[0].Seat.Room.ID.String()
		roomName = assignments[0].Seat.Room.Name
	}

	// Count total seats in the room (if we have room info)
	var totalSeats int64
	if roomID != "" {
		if err := s.db.Model(&models.Seat{}).Where("room_id = ?", roomID).Count(&totalSeats).Error; err != nil {
			return nil, fmt.Errorf("failed to count total seats: %w", err)
		}
	}

	chart := &models.SeatingChartResponse{
		EventID:            eventID,
		EventName:          event.Name,
		VenueID:            uuid.MustParse(venueID),
		VenueName:          venueName,
		RoomID:             uuid.MustParse(roomID),
		RoomName:           roomName,
		SeatingAssignments: assignments,
		TotalSeats:         int(totalSeats),
		AssignedSeats:      len(assignments),
		AvailableSeats:     int(totalSeats) - len(assignments),
	}

	return chart, nil
}

// UpdateSeatingAssignment updates an existing seating assignment
func (s *SeatingAssignmentService) UpdateSeatingAssignment(eventID, assignmentID, ownerID uuid.UUID, req *models.UpdateSeatingAssignmentRequest) (*models.SeatingAssignment, error) {
	// Verify event ownership
	_, err := s.verifyEventOwnership(eventID, ownerID)
	if err != nil {
		return nil, err
	}

	// Find the assignment
	var assignment models.SeatingAssignment
	if err := s.db.Where("id = ? AND event_id = ?", assignmentID, eventID).First(&assignment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, customerrors.ErrSeatingAssignmentNotFound
		}
		return nil, fmt.Errorf("failed to find seating assignment: %w", err)
	}

	// If changing seat, verify new seat is available
	if req.SeatID != nil && *req.SeatID != assignment.SeatID {
		var existingAssignment models.SeatingAssignment
		if err := s.db.Where("event_id = ? AND seat_id = ?", eventID, *req.SeatID).First(&existingAssignment).Error; err == nil {
			return nil, fmt.Errorf("new seat is already assigned to another guest")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check new seat availability: %w", err)
		}

		// Update old seat status to available
		if err := s.db.Model(&models.Seat{}).Where("id = ?", assignment.SeatID).Update("status", models.SeatStatusAvailable).Error; err != nil {
			return nil, fmt.Errorf("failed to update old seat status: %w", err)
		}

		// Update new seat status to occupied
		if err := s.db.Model(&models.Seat{}).Where("id = ?", *req.SeatID).Update("status", models.SeatStatusOccupied).Error; err != nil {
			return nil, fmt.Errorf("failed to update new seat status: %w", err)
		}

		assignment.SeatID = *req.SeatID
	}

	// Update notes if provided
	if req.Notes != nil {
		assignment.Notes = req.Notes
	}

	// Save the updated assignment
	if err := s.db.Save(&assignment).Error; err != nil {
		return nil, fmt.Errorf("failed to update seating assignment: %w", err)
	}

	// Load the updated assignment with all relationships
	if err := s.db.Preload("Event").Preload("Guest").Preload("Seat.Room.Venue").Preload("AssignedByUser").First(&assignment, assignment.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated seating assignment: %w", err)
	}

	return &assignment, nil
}

// verifyEventOwnership verifies that the user owns the event
func (s *SeatingAssignmentService) verifyEventOwnership(eventID, ownerID uuid.UUID) (*models.Event, error) {
	var event models.Event
	if err := s.db.Where("id = ? AND owner_id = ?", eventID, ownerID).First(&event).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, customerrors.ErrEventNotFound
		}
		return nil, fmt.Errorf("failed to verify event ownership: %w", err)
	}
	return &event, nil
}
