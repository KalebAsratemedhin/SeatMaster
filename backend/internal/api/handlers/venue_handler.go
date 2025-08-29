package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// VenueHandler handles HTTP requests for venue operations
type VenueHandler struct {
	venueService *services.VenueService
}

// NewVenueHandler creates a new venue handler
func NewVenueHandler(venueService *services.VenueService) *VenueHandler {
	return &VenueHandler{venueService: venueService}
}

// CreateVenue handles venue creation
// @Summary Create a new venue
// @Description Create a new venue for the authenticated user
// @Tags venues
// @Accept json
// @Produce json
// @Param venue body models.CreateVenueRequest true "Venue creation data"
// @Success 201 {object} models.VenueResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /venues [post]
func (h *VenueHandler) CreateVenue(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	var req models.CreateVenueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	venue, err := h.venueService.CreateVenue(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create venue: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.VenueResponse{Venue: venue})
}

// GetVenues handles venue retrieval for the authenticated user
// @Summary Get user's venues
// @Description Retrieve all venues owned by the authenticated user
// @Tags venues
// @Produce json
// @Success 200 {object} models.VenuesResponse
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /venues [get]
func (h *VenueHandler) GetVenues(c *gin.Context) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userCtx.UserID

	venues, err := h.venueService.GetVenuesByOwner(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve venues: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.VenuesResponse{
		Venues: venues,
		Total:  len(venues),
	})
}

// GetPublicVenues handles public venue retrieval
// @Summary Get public venues
// @Description Retrieve all public venues
// @Tags venues
// @Produce json
// @Success 200 {object} models.VenuesResponse
// @Failure 500 {object} map[string]interface{}
// @Router /venues/public [get]
func (h *VenueHandler) GetPublicVenues(c *gin.Context) {
	venues, err := h.venueService.GetPublicVenues()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve public venues: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.VenuesResponse{
		Venues: venues,
		Total:  len(venues),
	})
}

// GetVenue handles specific venue retrieval
// @Summary Get venue by ID
// @Description Retrieve a specific venue by ID
// @Tags venues
// @Produce json
// @Param id path string true "Venue ID"
// @Success 200 {object} models.VenueResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /venues/{id} [get]
func (h *VenueHandler) GetVenue(c *gin.Context) {
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

	venue, err := h.venueService.GetVenueByID(venueID, userID)
	if err != nil {
		if err.Error() == "venue not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve venue: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.VenueResponse{Venue: venue})
}

// UpdateVenue handles venue updates
// @Summary Update venue
// @Description Update an existing venue
// @Tags venues
// @Accept json
// @Produce json
// @Param id path string true "Venue ID"
// @Param venue body models.UpdateVenueRequest true "Venue update data"
// @Success 200 {object} models.VenueResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /venues/{id} [patch]
func (h *VenueHandler) UpdateVenue(c *gin.Context) {
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

	var req models.UpdateVenueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	venue, err := h.venueService.UpdateVenue(venueID, userID, &req)
	if err != nil {
		if err.Error() == "venue not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update venue: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.VenueResponse{Venue: venue})
}

// DeleteVenue handles venue deletion
// @Summary Delete venue
// @Description Delete an existing venue
// @Tags venues
// @Produce json
// @Param id path string true "Venue ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /venues/{id} [delete]
func (h *VenueHandler) DeleteVenue(c *gin.Context) {
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

	err = h.venueService.DeleteVenue(venueID, userID)
	if err != nil {
		if err.Error() == "venue not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete venue: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
