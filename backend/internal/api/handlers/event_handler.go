package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type EventHandler struct {
	eventService *services.EventService
	validate     *validator.Validate
}

func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{
		eventService: eventService,
		validate:     validator.New(),
	}
}

// CreateEvent handles event creation
// @Summary Create event
// @Description Create a new event
// @Tags events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param event body models.CreateEventRequest true "Event creation data"
// @Success 201 {object} models.EventResponse "Event created successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Router /events [post]
func (h *EventHandler) CreateEvent(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Create event
	event, err := h.eventService.CreateEvent(userCtx.UserID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.EventResponse{Event: event})
}

// GetEvent handles retrieving a single event
// @Summary Get event
// @Description Get event details by ID
// @Tags events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Success 200 {object} models.EventResponse "Event details"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id} [get]
func (h *EventHandler) GetEvent(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse event ID
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID format"})
		return
	}

	// Get event
	event, err := h.eventService.GetEventByID(eventID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Check if user owns the event (for now, only owners can view their events)
	if event.OwnerID != userCtx.UserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to this event"})
		return
	}

	c.JSON(http.StatusOK, models.EventResponse{Event: event})
}

// GetEvents handles retrieving all events for the current user
// @Summary Get user events
// @Description Get all events owned by the current user
// @Tags events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.EventsResponse "User events"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Router /events [get]
func (h *EventHandler) GetEvents(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get events for user
	events, err := h.eventService.GetEventsByOwner(userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total count
	total, err := h.eventService.GetEventCount(userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.EventsResponse{
		Events: events,
		Total:  int(total),
	})
}

// UpdateEvent handles event updates (partial update)
// @Summary Update event
// @Description Update an existing event (partial update)
// @Tags events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param event body models.UpdateEventRequest true "Event update data"
// @Success 200 {object} models.EventResponse "Event updated successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id} [patch]
func (h *EventHandler) UpdateEvent(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse event ID
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID format"})
		return
	}

	var req models.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Update event
	event, err := h.eventService.UpdateEvent(eventID, userCtx.UserID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.EventResponse{Event: event})
}

// DeleteEvent handles event deletion
// @Summary Delete event
// @Description Delete an existing event
// @Tags events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Success 200 {object} map[string]interface{} "Event deleted successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id} [delete]
func (h *EventHandler) DeleteEvent(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse event ID
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID format"})
		return
	}

	// Delete event
	err = h.eventService.DeleteEvent(eventID, userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// GetPublicEvents handles retrieving all public events
// @Summary Get public events
// @Description Get all public events for discovery
// @Tags events
// @Accept json
// @Produce json
// @Success 200 {object} models.EventsResponse "Public events"
// @Router /events/public [get]
func (h *EventHandler) GetPublicEvents(c *gin.Context) {
	// Get public events
	events, err := h.eventService.GetPublicEvents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve public events"})
		return
	}

	// Get total count
	total := len(events)

	c.JSON(http.StatusOK, models.EventsResponse{
		Events: events,
		Total:  total,
	})
}
