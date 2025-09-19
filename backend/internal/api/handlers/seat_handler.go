package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// SeatHandler handles HTTP requests for seat operations
type SeatHandler struct {
	seatService *services.SeatService
}

// NewSeatHandler creates a new seat handler
func NewSeatHandler(seatService *services.SeatService) *SeatHandler {
	return &SeatHandler{seatService: seatService}
}

// CreateSeat handles seat creation
// @Summary Create a new seat
// @Description Create a new seat in a room
// @Tags seats
// @Accept json
// @Produce json
// @Param id path string true "Venue ID"
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Param seat body models.CreateSeatRequest true "Seat creation data"
// @Success 201 {object} models.SeatResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId}/seats [post]
// @Security BearerAuth
func (h *SeatHandler) CreateSeat(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	roomIDStr := c.Param("roomId")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room ID"})
		return
	}

	var req models.CreateSeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	seat, err := h.seatService.CreateSeat(roomID, userID, &req)
	if err != nil {
		if err.Error() == "room not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		if err.Error() == "access denied to room" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to room"})
			return
		}
		// Check for seat already exists error
		if strings.Contains(err.Error(), "seat with row") && strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create seat: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.SeatResponse{Seat: seat})
}

// CreateSeatGrid handles seat grid creation
// @Summary Create a grid of seats
// @Description Create multiple seats in a grid layout
// @Tags seats
// @Accept json
// @Produce json
// @Param id path string true "Venue ID"
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Param grid body models.CreateSeatGridRequest true "Seat grid creation data"
// @Success 201 {object} models.SeatsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId}/seats/grid [post]
// @Security BearerAuth
func (h *SeatHandler) CreateSeatGrid(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	roomIDStr := c.Param("roomId")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room ID"})
		return
	}

	var req models.CreateSeatGridRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	seats, err := h.seatService.CreateSeatGrid(roomID, userID, &req)
	if err != nil {
		if err.Error() == "room not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		if err.Error() == "access denied to room" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to room"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create seat grid: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.SeatsResponse{
		Seats: seats,
		Total: len(seats),
	})
}

// GetSeats handles seat retrieval for a room
// @Summary Get seats in room
// @Description Retrieve all seats in a specific room
// @Tags seats
// @Produce json
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Success 200 {object} models.SeatsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId}/seats [get]
// @Security BearerAuth
func (h *SeatHandler) GetSeats(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	roomIDStr := c.Param("roomId")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room ID"})
		return
	}

	seats, err := h.seatService.GetSeatsByRoom(roomID, userID)
	if err != nil {
		if err.Error() == "room not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		if err.Error() == "access denied to room" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to room"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve seats: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SeatsResponse{
		Seats: seats,
		Total: len(seats),
	})
}

// UpdateSeat handles seat updates
// @Summary Update seat
// @Description Update an existing seat
// @Tags seats
// @Accept json
// @Produce json
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Param seatId path string true "Seat ID"
// @Param seat body models.UpdateSeatRequest true "Seat update data"
// @Success 200 {object} models.SeatResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId}/seats/{seatId} [patch]
// @Security BearerAuth
func (h *SeatHandler) UpdateSeat(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	seatIDStr := c.Param("seatId")
	seatID, err := uuid.Parse(seatIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seat ID"})
		return
	}

	var req models.UpdateSeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	seat, err := h.seatService.UpdateSeat(seatID, userID, &req)
	if err != nil {
		if err.Error() == "seat not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "seat not found"})
			return
		}
		if err.Error() == "access denied to seat" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to seat"})
			return
		}
		// Check for seat already exists error
		if strings.Contains(err.Error(), "seat with row") && strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update seat: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SeatResponse{Seat: seat})
}

// DeleteSeat handles seat deletion
// @Summary Delete seat
// @Description Delete an existing seat
// @Tags seats
// @Produce json
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Param seatId path string true "Seat ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId}/seats/{seatId} [delete]
// @Security BearerAuth
func (h *SeatHandler) DeleteSeat(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	seatIDStr := c.Param("seatId")
	seatID, err := uuid.Parse(seatIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seat ID"})
		return
	}

	err = h.seatService.DeleteSeat(seatID, userID)
	if err != nil {
		if err.Error() == "seat not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "seat not found"})
			return
		}
		if err.Error() == "access denied to seat" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to seat"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete seat: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// AssignGuestToSeat handles guest-to-seat assignment
// @Summary Assign guest to seat
// @Description Assign a guest to a specific seat for an event
// @Tags seating
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param seatId path string true "Seat ID"
// @Param assignment body models.CreateSeatingAssignmentRequest true "Seating assignment data"
// @Success 201 {object} models.SeatingAssignmentResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating/assign [post]
// @Security BearerAuth
func (h *SeatHandler) AssignGuestToSeat(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	var req models.CreateSeatingAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	assignment, err := h.seatService.AssignGuestToSeat(eventID, req.SeatID, req.GuestID, userID)
	if err != nil {
		if err.Error() == "seat not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "seat not found"})
			return
		}
		if err.Error() == "guest not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "guest not found"})
			return
		}
		if err.Error() == "seat is already occupied" {
			c.JSON(http.StatusConflict, gin.H{"error": "seat is already occupied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign guest to seat: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.SeatingAssignmentResponse{SeatingAssignment: assignment})
}

// UnassignGuestFromSeat handles guest removal from seat
// @Summary Unassign guest from seat
// @Description Remove a guest from a specific seat
// @Tags seating
// @Produce json
// @Param id path string true "Event ID"
// @Param seatId path string true "Seat ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating/assign/{seatId} [delete]
// @Security BearerAuth
func (h *SeatHandler) UnassignGuestFromSeat(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	seatIDStr := c.Param("seatId")
	seatID, err := uuid.Parse(seatIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seat ID"})
		return
	}

	err = h.seatService.UnassignGuestFromSeat(eventID, seatID, userID)
	if err != nil {
		if err.Error() == "seat not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "seat not found"})
			return
		}
		if err.Error() == "access denied to seat" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to seat"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unassign guest from seat: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetSeatAssignments handles seating assignment retrieval
// @Summary Get seat assignments
// @Description Retrieve all seat assignments for an event
// @Tags seating
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} models.SeatingAssignmentsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating [get]
// @Security BearerAuth
func (h *SeatHandler) GetSeatAssignments(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	assignments, err := h.seatService.GetSeatAssignments(eventID, userID)
	if err != nil {
		if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve seat assignments: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SeatingAssignmentsResponse{
		SeatingAssignments: assignments,
		Total:              len(assignments),
	})
}
