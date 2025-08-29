package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// RoomHandler handles HTTP requests for room operations
type RoomHandler struct {
	roomService *services.RoomService
}

// NewRoomHandler creates a new room handler
func NewRoomHandler(roomService *services.RoomService) *RoomHandler {
	return &RoomHandler{roomService: roomService}
}

// CreateRoom handles room creation
// @Summary Create a new room
// @Description Create a new room in a venue
// @Tags rooms
// @Accept json
// @Produce json
// @Param id path string true "Venue ID"
// @Param room body models.CreateRoomRequest true "Room creation data"
// @Success 201 {object} models.RoomResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms [post]
// @Security BearerAuth
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	venueIDStr := c.Param("id")
	venueID, err := uuid.Parse(venueIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue ID"})
		return
	}

	var req models.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	room, err := h.roomService.CreateRoom(venueID, userID, &req)
	if err != nil {
		if err.Error() == "venue not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create room: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.RoomResponse{Room: room})
}

// GetRooms handles room retrieval for a venue
// @Summary Get rooms in venue
// @Description Retrieve all rooms in a specific venue
// @Tags rooms
// @Produce json
// @Param id path string true "Venue ID"
// @Success 200 {object} models.RoomsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms [get]
// @Security BearerAuth
func (h *RoomHandler) GetRooms(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	venueIDStr := c.Param("id")
	venueID, err := uuid.Parse(venueIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue ID"})
		return
	}

	rooms, err := h.roomService.GetRoomsByVenue(venueID, userID)
	if err != nil {
		if err.Error() == "venue not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve rooms: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.RoomsResponse{
		Rooms: rooms,
		Total: len(rooms),
	})
}

// GetRoom handles specific room retrieval
// @Summary Get room by ID
// @Description Retrieve a specific room by ID
// @Tags rooms
// @Produce json
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Success 200 {object} models.RoomResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId} [get]
// @Security BearerAuth
func (h *RoomHandler) GetRoom(c *gin.Context) {
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

	room, err := h.roomService.GetRoomByID(roomID, userID)
	if err != nil {
		if err.Error() == "room not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		if err.Error() == "access denied to room" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to room"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve room: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.RoomResponse{Room: room})
}

// UpdateRoom handles room updates
// @Summary Update room
// @Description Update an existing room
// @Tags rooms
// @Accept json
// @Produce json
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Param room body models.UpdateRoomRequest true "Room update data"
// @Success 200 {object} models.RoomResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId} [patch]
// @Security BearerAuth
func (h *RoomHandler) UpdateRoom(c *gin.Context) {
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

	var req models.UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	room, err := h.roomService.UpdateRoom(roomID, userID, &req)
	if err != nil {
		if err.Error() == "room not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		if err.Error() == "access denied to room" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to room"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update room: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.RoomResponse{Room: room})
}

// DeleteRoom handles room deletion
// @Summary Delete room
// @Description Delete an existing room
// @Tags rooms
// @Produce json
// @Param id path string true "Venue ID"
// @Param roomId path string true "Room ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /venues/{id}/rooms/{roomId} [delete]
// @Security BearerAuth
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
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

	err = h.roomService.DeleteRoom(roomID, userID)
	if err != nil {
		if err.Error() == "room not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		if err.Error() == "access denied to room" {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to room"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete room: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
