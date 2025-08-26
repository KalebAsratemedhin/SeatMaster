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

type GuestHandler struct {
	guestService *services.GuestService
	validate     *validator.Validate
}

func NewGuestHandler(guestService *services.GuestService) *GuestHandler {
	return &GuestHandler{
		guestService: guestService,
		validate:     validator.New(),
	}
}

// CreateGuest handles guest creation
// @Summary Create guest
// @Description Create a new guest for an event
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param guest body models.CreateGuestRequest true "Guest creation data"
// @Success 201 {object} models.GuestResponse "Guest created successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id}/guests [post]
func (h *GuestHandler) CreateGuest(c *gin.Context) {
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

	var req models.CreateGuestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Create guest
	guest, err := h.guestService.CreateGuest(eventID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "event not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "event has reached maximum guest capacity":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case "guest already exists for this event":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create guest"})
		}
		return
	}

	c.JSON(http.StatusCreated, models.GuestResponse{Guest: guest})
}

// GetGuest handles retrieving a single guest
// @Summary Get guest
// @Description Get guest details by ID
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param guestId path string true "Guest ID (UUID)"
// @Success 200 {object} models.GuestResponse "Guest details"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /events/{id}/guests/{guestId} [get]
func (h *GuestHandler) GetGuest(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse guest ID
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guest ID format"})
		return
	}

	// Get guest
	guest, err := h.guestService.GetGuestByID(guestID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve guest"})
		}
		return
	}

	c.JSON(http.StatusOK, models.GuestResponse{Guest: guest})
}

// GetGuests handles retrieving all guests for an event
// @Summary Get event guests
// @Description Get all guests for a specific event
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Success 200 {object} models.GuestsResponse "Event guests"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id}/guests [get]
func (h *GuestHandler) GetGuests(c *gin.Context) {
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

	// Get guests for event
	guests, err := h.guestService.GetGuestsByEvent(eventID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "event not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve guests"})
		}
		return
	}

	// Get total count
	total, err := h.guestService.GetGuestCount(eventID, userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get guest count"})
		return
	}

	c.JSON(http.StatusOK, models.GuestsResponse{
		Guests: guests,
		Total:  int(total),
	})
}

// UpdateGuest handles guest updates
// @Summary Update guest
// @Description Update an existing guest (partial update)
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param guestId path string true "Guest ID (UUID)"
// @Param guest body models.UpdateGuestRequest true "Guest update data"
// @Success 200 {object} models.GuestResponse "Guest updated successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /events/{id}/guests/{guestId} [patch]
func (h *GuestHandler) UpdateGuest(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse guest ID
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guest ID format"})
		return
	}

	var req models.UpdateGuestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Update guest
	guest, err := h.guestService.UpdateGuest(guestID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "guest already exists for this event":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update guest"})
		}
		return
	}

	c.JSON(http.StatusOK, models.GuestResponse{Guest: guest})
}

// UpdateGuestRSVP handles guest RSVP updates
// @Summary Update guest RSVP
// @Description Update a guest's RSVP status
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param guestId path string true "Guest ID (UUID)"
// @Param rsvp body models.UpdateGuestRSVPRequest true "RSVP update data"
// @Success 200 {object} models.GuestRSVPResponse "RSVP updated successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /events/{id}/guests/{guestId}/rsvp [patch]
func (h *GuestHandler) UpdateGuestRSVP(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse guest ID
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guest ID format"})
		return
	}

	var req models.UpdateGuestRSVPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Update guest RSVP
	guest, err := h.guestService.UpdateGuestRSVP(guestID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update RSVP"})
		}
		return
	}

	c.JSON(http.StatusOK, models.GuestRSVPResponse{
		Guest:   guest,
		Message: "RSVP updated successfully",
	})
}

// DeleteGuest handles guest deletion
// @Summary Delete guest
// @Description Remove a guest from an event
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param guestId path string true "Guest ID (UUID)"
// @Success 200 {object} map[string]interface{} "Guest deleted successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /events/{id}/guests/{guestId} [delete]
func (h *GuestHandler) DeleteGuest(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse guest ID
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guest ID format"})
		return
	}

	// Delete guest
	err = h.guestService.DeleteGuest(guestID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete guest"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Guest deleted successfully"})
}

// ApproveGuest handles guest approval
// @Summary Approve guest
// @Description Approve a pending guest for an event
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param guestId path string true "Guest ID (UUID)"
// @Success 200 {object} models.GuestResponse "Guest approved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /events/{id}/guests/{guestId}/approve [post]
func (h *GuestHandler) ApproveGuest(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse guest ID
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guest ID format"})
		return
	}

	// Approve guest
	guest, err := h.guestService.ApproveGuest(guestID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "event has reached maximum guest capacity":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve guest"})
		}
		return
	}

	c.JSON(http.StatusOK, models.GuestResponse{Guest: guest})
}

// GetGuestSummary handles retrieving guest summary statistics
// @Summary Get guest summary
// @Description Get summary statistics of guest RSVP statuses for an event
// @Tags guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Success 200 {object} models.GuestSummary "Guest summary statistics"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id}/guests/summary [get]
func (h *GuestHandler) GetGuestSummary(c *gin.Context) {
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

	// Get guest summary
	summary, err := h.guestService.GetGuestSummary(eventID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "event not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get guest summary"})
		}
		return
	}

	c.JSON(http.StatusOK, summary)
}

func (h *GuestHandler) RegisterForEvent(c *gin.Context) {
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

	var req models.UserEventRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Register user for event
	response, err := h.guestService.RegisterUserForEvent(eventID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "event not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": "Event is not public"})
		case "guest already exists for this event":
			c.JSON(http.StatusBadRequest, gin.H{"error": "You are already registered for this event"})
		case "event has reached maximum guest capacity":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register for event"})
		}
		return
	}

	c.JSON(http.StatusCreated, response)
}

func (h *GuestHandler) GetUserRegistrations(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user registrations
	registrations, err := h.guestService.GetUserRegistrations(userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve registrations"})
		return
	}

	// Get total count
	total, err := h.guestService.GetUserRegistrationCount(userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get registration count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"registrations": registrations,
		"total":         total,
	})
}

func (h *GuestHandler) UpdateUserRegistration(c *gin.Context) {
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

	var req models.UpdateGuestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Get all guests for the event to find the user's registration
	guests, err := h.guestService.GetGuestsByEvent(eventID, userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve event guests"})
		return
	}

	// Find the guest registration for this user
	var userGuest *models.Guest
	for _, guest := range guests {
		if guest.UserID != nil && *guest.UserID == userCtx.UserID {
			userGuest = &guest
			break
		}
	}

	if userGuest == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		return
	}

	// Update registration
	updatedGuest, err := h.guestService.UpdateUserRegistration(userGuest.ID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "guest already exists for this event":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update registration"})
		}
		return
	}

	c.JSON(http.StatusOK, models.GuestResponse{Guest: updatedGuest})
}

func (h *GuestHandler) CancelUserRegistration(c *gin.Context) {
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

	// Get all guests for the event to find the user's registration
	guests, err := h.guestService.GetGuestsByEvent(eventID, userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve event guests"})
		return
	}

	// Find the guest registration for this user
	var userGuest *models.Guest
	for _, guest := range guests {
		if guest.UserID != nil && *guest.UserID == userCtx.UserID {
			userGuest = &guest
			break
		}
	}

	if userGuest == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		return
	}

	// Cancel registration
	err = h.guestService.CancelUserRegistration(userGuest.ID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "guest not found":
			c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel registration"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration cancelled successfully"})
}
