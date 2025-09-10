package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// GuestCommunicationHandler handles HTTP requests for guest communication management
type GuestCommunicationHandler struct {
	communicationService *services.GuestCommunicationService
}

// NewGuestCommunicationHandler creates a new guest communication handler
func NewGuestCommunicationHandler(communicationService *services.GuestCommunicationService) *GuestCommunicationHandler {
	return &GuestCommunicationHandler{
		communicationService: communicationService,
	}
}

// CreateCommunication creates a new communication
// @Summary Create a new communication
// @Description Create a new communication message for guests
// @Tags Guest Communications
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param communication body models.CreateCommunicationRequest true "Communication details"
// @Success 201 {object} models.GuestCommunication
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications [post]
// @Security BearerAuth
func (h *GuestCommunicationHandler) CreateCommunication(c *gin.Context) {
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

	var req models.CreateCommunicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	communication, err := h.communicationService.CreateCommunication(eventID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, communication)
}

// GetCommunications retrieves all communications for an event
// @Summary Get event communications
// @Description Retrieve all communications for a specific event
// @Tags Guest Communications
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} models.CommunicationsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications [get]
// @Security BearerAuth
func (h *GuestCommunicationHandler) GetCommunications(c *gin.Context) {
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

	communications, err := h.communicationService.GetCommunicationsByEvent(eventID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format
	var responses []models.CommunicationResponse
	for _, comm := range communications {
		response := models.CommunicationResponse{
			ID:             comm.ID,
			EventID:        comm.EventID,
			Type:           comm.Type,
			Subject:        comm.Subject,
			Message:        comm.Message,
			Recipients:     comm.Recipients,
			Categories:     comm.Categories,
			Tags:           comm.Tags,
			Status:         comm.Status,
			ScheduledAt:    comm.ScheduledAt,
			SentAt:         comm.SentAt,
			SentBy:         comm.SentBy,
			SentByUser:     comm.SentByUser,
			RecipientCount: int64(len(comm.Recipients)),
			CreatedAt:      comm.CreatedAt,
			UpdatedAt:      comm.UpdatedAt,
		}
		responses = append(responses, response)
	}

	result := models.CommunicationsResponse{
		Communications: responses,
		Total:          int64(len(responses)),
	}

	c.JSON(http.StatusOK, result)
}

// GetCommunication retrieves a specific communication
// @Summary Get communication details
// @Description Retrieve details of a specific communication
// @Tags Guest Communications
// @Produce json
// @Param id path string true "Event ID"
// @Param communicationId path string true "Communication ID"
// @Success 200 {object} models.CommunicationResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications/{communicationId} [get]
// @Security BearerAuth
func (h *GuestCommunicationHandler) GetCommunication(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	communicationID, err := uuid.Parse(c.Param("communicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid communication ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get communications for the event and find the specific one
	communications, err := h.communicationService.GetCommunicationsByEvent(eventID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var targetCommunication *models.GuestCommunication
	for _, comm := range communications {
		if comm.ID == communicationID {
			targetCommunication = &comm
			break
		}
	}

	if targetCommunication == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "communication not found"})
		return
	}

	response := models.CommunicationResponse{
		ID:             targetCommunication.ID,
		EventID:        targetCommunication.EventID,
		Type:           targetCommunication.Type,
		Subject:        targetCommunication.Subject,
		Message:        targetCommunication.Message,
		Recipients:     targetCommunication.Recipients,
		Categories:     targetCommunication.Categories,
		Tags:           targetCommunication.Tags,
		Status:         targetCommunication.Status,
		ScheduledAt:    targetCommunication.ScheduledAt,
		SentAt:         targetCommunication.SentAt,
		SentBy:         targetCommunication.SentBy,
		SentByUser:     targetCommunication.SentByUser,
		RecipientCount: int64(len(targetCommunication.Recipients)),
		CreatedAt:      targetCommunication.CreatedAt,
		UpdatedAt:      targetCommunication.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateCommunication updates an existing communication
// @Summary Update communication
// @Description Update an existing communication
// @Tags Guest Communications
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param communicationId path string true "Communication ID"
// @Param communication body models.UpdateCommunicationRequest true "Updated communication details"
// @Success 200 {object} models.GuestCommunication
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications/{communicationId} [patch]
// @Security BearerAuth
func (h *GuestCommunicationHandler) UpdateCommunication(c *gin.Context) {
	communicationID, err := uuid.Parse(c.Param("communicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid communication ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.UpdateCommunicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	communication, err := h.communicationService.UpdateCommunication(communicationID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, communication)
}

// SendCommunication sends a communication to guests
// @Summary Send communication
// @Description Send a communication to guests immediately
// @Tags Guest Communications
// @Produce json
// @Param id path string true "Event ID"
// @Param communicationId path string true "Communication ID"
// @Success 200 {object} models.GuestCommunication
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications/{communicationId}/send [post]
// @Security BearerAuth
func (h *GuestCommunicationHandler) SendCommunication(c *gin.Context) {
	communicationID, err := uuid.Parse(c.Param("communicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid communication ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	communication, err := h.communicationService.SendCommunication(communicationID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, communication)
}

// ScheduleCommunication schedules a communication for later
// @Summary Schedule communication
// @Description Schedule a communication to be sent at a specific time
// @Tags Guest Communications
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param communicationId path string true "Communication ID"
// @Param schedule body models.ScheduleCommunicationRequest true "Schedule details"
// @Success 200 {object} models.GuestCommunication
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications/{communicationId}/schedule [post]
// @Security BearerAuth
func (h *GuestCommunicationHandler) ScheduleCommunication(c *gin.Context) {
	communicationID, err := uuid.Parse(c.Param("communicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid communication ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.ScheduleCommunicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	communication, err := h.communicationService.ScheduleCommunication(communicationID, user.UserID, req.ScheduledAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, communication)
}

// DeleteCommunication deletes a communication
// @Summary Delete communication
// @Description Delete an existing communication
// @Tags Guest Communications
// @Produce json
// @Param id path string true "Event ID"
// @Param communicationId path string true "Communication ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications/{communicationId} [delete]
// @Security BearerAuth
func (h *GuestCommunicationHandler) DeleteCommunication(c *gin.Context) {
	communicationID, err := uuid.Parse(c.Param("communicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid communication ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.communicationService.DeleteCommunication(communicationID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetCommunicationStats retrieves statistics for a communication
// @Summary Get communication statistics
// @Description Retrieve statistics and analytics for a specific communication
// @Tags Guest Communications
// @Produce json
// @Param id path string true "Event ID"
// @Param communicationId path string true "Communication ID"
// @Success 200 {object} models.CommunicationStats
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/communications/{communicationId}/stats [get]
// @Security BearerAuth
func (h *GuestCommunicationHandler) GetCommunicationStats(c *gin.Context) {
	communicationID, err := uuid.Parse(c.Param("communicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid communication ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	stats, err := h.communicationService.GetCommunicationStats(communicationID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
