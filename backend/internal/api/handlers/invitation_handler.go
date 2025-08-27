package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

type InvitationHandler struct {
	invitationService *services.InvitationService
	validate          *validator.Validate
}

// NewInvitationHandler creates a new invitation handler
func NewInvitationHandler(invitationService *services.InvitationService) *InvitationHandler {
	return &InvitationHandler{
		invitationService: invitationService,
		validate:          validator.New(),
	}
}

// CreateInvitation handles creating a new invitation
// @Summary Create invitation
// @Description Create a new invitation for an event
// @Tags invitations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param invitation body models.CreateInvitationRequest true "Invitation data"
// @Success 201 {object} models.InvitationResponse "Invitation created successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id}/invitations [post]
func (h *InvitationHandler) CreateInvitation(c *gin.Context) {
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

	var req models.CreateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Create invitation
	invitation, err := h.invitationService.CreateInvitation(eventID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "event not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "invitation already exists for this email and event":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invitation"})
		}
		return
	}

	c.JSON(http.StatusCreated, invitation)
}

// GetInvitations handles retrieving all invitations for an event
// @Summary Get event invitations
// @Description Get all invitations for a specific event
// @Tags invitations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Success 200 {array} models.InvitationListItem "List of invitations"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Event not found"
// @Router /events/{id}/invitations [get]
func (h *InvitationHandler) GetInvitations(c *gin.Context) {
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

	// Get invitations
	invitations, err := h.invitationService.GetInvitationsByEvent(eventID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "event not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invitations"})
		}
		return
	}

	c.JSON(http.StatusOK, invitations)
}

// GetInvitation handles retrieving a specific invitation
// @Summary Get invitation details
// @Description Get details of a specific invitation
// @Tags invitations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param invitationId path string true "Invitation ID (UUID)"
// @Success 200 {object} models.InvitationResponse "Invitation details"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Invitation not found"
// @Router /events/{id}/invitations/{invitationId} [get]
func (h *InvitationHandler) GetInvitation(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse invitation ID
	invitationID, err := uuid.Parse(c.Param("invitationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID format"})
		return
	}

	// Get invitation
	invitation, err := h.invitationService.GetInvitationByID(invitationID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "invitation not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// UpdateInvitation handles updating an invitation
// @Summary Update invitation
// @Description Update an existing invitation
// @Tags invitations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param invitationId path string true "Invitation ID (UUID)"
// @Param invitation body models.UpdateInvitationRequest true "Invitation update data"
// @Success 200 {object} models.InvitationResponse "Invitation updated successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Invitation not found"
// @Router /events/{id}/invitations/{invitationId} [patch]
func (h *InvitationHandler) UpdateInvitation(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse invitation ID
	invitationID, err := uuid.Parse(c.Param("invitationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID format"})
		return
	}

	var req models.UpdateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Update invitation
	invitation, err := h.invitationService.UpdateInvitation(invitationID, userCtx.UserID, &req)
	if err != nil {
		switch err.Error() {
		case "invitation not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "invitation cannot be updated in its current status":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// CancelInvitation handles cancelling an invitation
// @Summary Cancel invitation
// @Description Cancel an existing invitation
// @Tags invitations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param invitationId path string true "Invitation ID (UUID)"
// @Success 200 {object} map[string]interface{} "Invitation cancelled successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Invitation not found"
// @Router /events/{id}/invitations/{invitationId} [delete]
func (h *InvitationHandler) CancelInvitation(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse invitation ID
	invitationID, err := uuid.Parse(c.Param("invitationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID format"})
		return
	}

	// Cancel invitation
	err = h.invitationService.CancelInvitation(invitationID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "invitation not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "invitation cannot be cancelled in its current status":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation cancelled successfully"})
}

// ResendInvitation handles resending an invitation
// @Summary Resend invitation
// @Description Resend an invitation with a new token
// @Tags invitations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Event ID (UUID)"
// @Param invitationId path string true "Invitation ID (UUID)"
// @Success 200 {object} models.InvitationResponse "Invitation resent successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Invitation not found"
// @Router /events/{id}/invitations/{invitationId}/resend [post]
func (h *InvitationHandler) ResendInvitation(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse invitation ID
	invitationID, err := uuid.Parse(c.Param("invitationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID format"})
		return
	}

	// Resend invitation
	invitation, err := h.invitationService.ResendInvitation(invitationID, userCtx.UserID)
	if err != nil {
		switch err.Error() {
		case "invitation not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "access denied to this resource":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case "invitation cannot be resent in its current status":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resend invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// GetInvitationByToken handles retrieving invitation details by token (public endpoint)
// @Summary Get invitation by token
// @Description Get invitation details using the invitation token (public)
// @Tags invitations
// @Accept json
// @Produce json
// @Param token path string true "Invitation token"
// @Success 200 {object} models.InvitationResponse "Invitation details"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 404 {object} map[string]interface{} "Invitation not found"
// @Router /invitations/{token} [get]
func (h *InvitationHandler) GetInvitationByToken(c *gin.Context) {
	// Get token from path
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation token is required"})
		return
	}

	// Find invitation by token
	invitation, err := h.invitationService.GetInvitationByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// AcceptInvitation handles accepting an invitation (public endpoint)
// @Summary Accept invitation
// @Description Accept an invitation using the invitation token (public)
// @Tags invitations
// @Accept json
// @Produce json
// @Param token path string true "Invitation token"
// @Param acceptance body models.AcceptInvitationRequest true "Acceptance data (RSVP status required, notes optional)"
// @Success 200 {object} models.AcceptInvitationResponse "Invitation accepted successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 404 {object} map[string]interface{} "Invitation not found"
// @Router /invitations/{token}/accept [post]
func (h *InvitationHandler) AcceptInvitation(c *gin.Context) {
	// Get token from path
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation token is required"})
		return
	}

	var req models.AcceptInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Accept invitation
	response, err := h.invitationService.AcceptInvitation(token, &req)
	if err != nil {
		switch err.Error() {
		case "invitation not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "invitation cannot be accepted in its current status":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case "invitation has expired":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case "guest already exists for this event":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, response)
}
