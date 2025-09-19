package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// SeatingAssignmentHandler handles HTTP requests for seating assignment management
type SeatingAssignmentHandler struct {
	seatingAssignmentService *services.SeatingAssignmentService
}

// NewSeatingAssignmentHandler creates a new seating assignment handler
func NewSeatingAssignmentHandler(seatingAssignmentService *services.SeatingAssignmentService) *SeatingAssignmentHandler {
	return &SeatingAssignmentHandler{
		seatingAssignmentService: seatingAssignmentService,
	}
}

// AssignGuestToSeat assigns a guest to a specific seat
// @Summary Assign guest to seat
// @Description Assign a guest to a specific seat for an event
// @Tags Seating Assignments
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param assignment body models.CreateSeatingAssignmentRequest true "Seating assignment details"
// @Success 201 {object} models.SeatingAssignment
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating/assign [post]
// @Security BearerAuth
func (h *SeatingAssignmentHandler) AssignGuestToSeat(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.CreateSeatingAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := h.seatingAssignmentService.AssignGuestToSeat(eventID, req.GuestID, req.SeatID, user.UserID, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, assignment)
}

// UnassignGuestFromSeat removes a guest from their seat assignment
// @Summary Unassign guest from seat
// @Description Remove a guest from their seat assignment
// @Tags Seating Assignments
// @Produce json
// @Param id path string true "Event ID"
// @Param seatId path string true "Seat ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating/assign/{seatId} [delete]
// @Security BearerAuth
func (h *SeatingAssignmentHandler) UnassignGuestFromSeat(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	seatID, err := uuid.Parse(c.Param("seatId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seat ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.seatingAssignmentService.UnassignGuestFromSeat(eventID, seatID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetSeatingAssignments retrieves all seat assignments for an event
// @Summary Get event seating assignments
// @Description Retrieve all seat assignments for a specific event
// @Tags Seating Assignments
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} models.SeatingAssignmentsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating [get]
// @Security BearerAuth
func (h *SeatingAssignmentHandler) GetSeatingAssignments(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	assignments, err := h.seatingAssignmentService.GetSeatingAssignments(eventID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := models.SeatingAssignmentsResponse{
		SeatingAssignments: assignments,
		Total:              len(assignments),
	}

	c.JSON(http.StatusOK, result)
}

// GetSeatingChart retrieves a complete seating chart for an event
// @Summary Get event seating chart
// @Description Retrieve a complete seating chart with assignments for an event
// @Tags Seating Assignments
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} models.SeatingChartResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating/chart [get]
// @Security BearerAuth
func (h *SeatingAssignmentHandler) GetSeatingChart(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chart, err := h.seatingAssignmentService.GetSeatingChart(eventID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chart)
}

// UpdateSeatingAssignment updates an existing seating assignment
// @Summary Update seating assignment
// @Description Update an existing seating assignment
// @Tags Seating Assignments
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param assignmentId path string true "Assignment ID"
// @Param assignment body models.UpdateSeatingAssignmentRequest true "Updated assignment details"
// @Success 200 {object} models.SeatingAssignment
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/seating/assignments/{assignmentId} [patch]
// @Security BearerAuth
func (h *SeatingAssignmentHandler) UpdateSeatingAssignment(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	assignmentID, err := uuid.Parse(c.Param("assignmentId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.UpdateSeatingAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := h.seatingAssignmentService.UpdateSeatingAssignment(eventID, assignmentID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}




