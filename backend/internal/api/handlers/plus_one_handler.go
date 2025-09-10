package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// PlusOneHandler handles HTTP requests for plus-one management
type PlusOneHandler struct {
	plusOneService *services.PlusOneService
}

// NewPlusOneHandler creates a new plus-one handler
func NewPlusOneHandler(plusOneService *services.PlusOneService) *PlusOneHandler {
	return &PlusOneHandler{
		plusOneService: plusOneService,
	}
}

// CreatePlusOne creates a plus-one for a guest
// @Summary Create a plus-one
// @Description Create a plus-one (companion) for a guest
// @Tags Plus Ones
// @Accept json
// @Produce json
// @Param guestId path string true "Guest ID"
// @Param plusOne body models.CreatePlusOneRequest true "Plus-one details"
// @Success 201 {object} models.PlusOne
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /guests/{guestId}/plus-ones [post]
// @Security BearerAuth
func (h *PlusOneHandler) CreatePlusOne(c *gin.Context) {
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid guest ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.CreatePlusOneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plusOne, err := h.plusOneService.CreatePlusOne(guestID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, plusOne)
}

// GetPlusOnes retrieves all plus-ones for a guest
// @Summary Get guest plus-ones
// @Description Retrieve all plus-ones for a specific guest
// @Tags Plus Ones
// @Produce json
// @Param guestId path string true "Guest ID"
// @Success 200 {object} models.PlusOnesResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /guests/{guestId}/plus-ones [get]
// @Security BearerAuth
func (h *PlusOneHandler) GetPlusOnes(c *gin.Context) {
	guestID, err := uuid.Parse(c.Param("guestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid guest ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	plusOnes, err := h.plusOneService.GetPlusOnesByGuest(guestID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format
	var responses []models.PlusOneResponse
	for _, plusOne := range plusOnes {
		response := models.PlusOneResponse{
			ID:             plusOne.ID,
			GuestID:        plusOne.GuestID,
			Name:           plusOne.Name,
			Email:          plusOne.Email,
			Phone:          plusOne.Phone,
			Notes:          plusOne.Notes,
			Status:         plusOne.Status,
			ApprovedAt:     plusOne.ApprovedAt,
			ApprovedBy:     plusOne.ApprovedBy,
			ApprovedByUser: plusOne.ApprovedByUser,
			CreatedAt:      plusOne.CreatedAt,
			UpdatedAt:      plusOne.UpdatedAt,
		}
		responses = append(responses, response)
	}

	result := models.PlusOnesResponse{
		PlusOnes: responses,
		Total:    int64(len(responses)),
	}

	c.JSON(http.StatusOK, result)
}

// UpdatePlusOne updates a plus-one
// @Summary Update plus-one
// @Description Update an existing plus-one
// @Tags Plus Ones
// @Accept json
// @Produce json
// @Param guestId path string true "Guest ID"
// @Param plusOneId path string true "Plus-one ID"
// @Param plusOne body models.UpdatePlusOneRequest true "Updated plus-one details"
// @Success 200 {object} models.PlusOne
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /guests/{guestId}/plus-ones/{plusOneId} [patch]
// @Security BearerAuth
func (h *PlusOneHandler) UpdatePlusOne(c *gin.Context) {
	plusOneID, err := uuid.Parse(c.Param("plusOneId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plus-one ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.UpdatePlusOneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plusOne, err := h.plusOneService.UpdatePlusOne(plusOneID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plusOne)
}

// ApprovePlusOne approves a plus-one
// @Summary Approve plus-one
// @Description Approve a plus-one request
// @Tags Plus Ones
// @Accept json
// @Produce json
// @Param guestId path string true "Guest ID"
// @Param plusOneId path string true "Plus-one ID"
// @Param approval body models.ApprovePlusOneRequest true "Approval details"
// @Success 200 {object} models.PlusOne
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /guests/{guestId}/plus-ones/{plusOneId}/approve [post]
// @Security BearerAuth
func (h *PlusOneHandler) ApprovePlusOne(c *gin.Context) {
	plusOneID, err := uuid.Parse(c.Param("plusOneId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plus-one ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.ApprovePlusOneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plusOne, err := h.plusOneService.ApprovePlusOne(plusOneID, user.UserID, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plusOne)
}

// RejectPlusOne rejects a plus-one
// @Summary Reject plus-one
// @Description Reject a plus-one request
// @Tags Plus Ones
// @Accept json
// @Produce json
// @Param guestId path string true "Guest ID"
// @Param plusOneId path string true "Plus-one ID"
// @Param rejection body models.RejectPlusOneRequest true "Rejection details"
// @Success 200 {object} models.PlusOne
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /guests/{guestId}/plus-ones/{plusOneId}/reject [post]
// @Security BearerAuth
func (h *PlusOneHandler) RejectPlusOne(c *gin.Context) {
	plusOneID, err := uuid.Parse(c.Param("plusOneId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plus-one ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.RejectPlusOneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plusOne, err := h.plusOneService.RejectPlusOne(plusOneID, user.UserID, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plusOne)
}

// DeletePlusOne deletes a plus-one
// @Summary Delete plus-one
// @Description Delete an existing plus-one
// @Tags Plus Ones
// @Produce json
// @Param guestId path string true "Guest ID"
// @Param plusOneId path string true "Plus-one ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /guests/{guestId}/plus-ones/{plusOneId} [delete]
// @Security BearerAuth
func (h *PlusOneHandler) DeletePlusOne(c *gin.Context) {
	plusOneID, err := uuid.Parse(c.Param("plusOneId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plus-one ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.plusOneService.DeletePlusOne(plusOneID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
