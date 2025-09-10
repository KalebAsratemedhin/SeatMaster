package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// BulkOperationsHandler handles HTTP requests for bulk guest operations
type BulkOperationsHandler struct {
	bulkService *services.BulkGuestService
}

// NewBulkOperationsHandler creates a new bulk operations handler
func NewBulkOperationsHandler(bulkService *services.BulkGuestService) *BulkOperationsHandler {
	return &BulkOperationsHandler{
		bulkService: bulkService,
	}
}

// ImportGuestsFromCSV imports guests from CSV data
// @Summary Import guests from CSV
// @Description Import multiple guests from CSV data
// @Tags Bulk Operations
// @Accept multipart/form-data
// @Produce json
// @Param id path string true "Event ID"
// @Param file formData file true "CSV file"
// @Success 200 {object} models.BulkImportResult
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/guests/bulk/import [post]
// @Security BearerAuth
func (h *BulkOperationsHandler) ImportGuestsFromCSV(c *gin.Context) {
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

	// Get the uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}
	defer file.Close()

	// Check file type
	if header.Header.Get("Content-Type") != "text/csv" && header.Filename[len(header.Filename)-4:] != ".csv" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file must be a CSV"})
		return
	}

	// Read file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}

	// Import guests
	result, err := h.bulkService.ImportGuestsFromCSV(eventID, user.UserID, fileContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ExportGuestsToCSV exports guests to CSV format
// @Summary Export guests to CSV
// @Description Export guests to CSV format with optional filtering
// @Tags Bulk Operations
// @Produce text/csv
// @Param id path string true "Event ID"
// @Param categories query []string false "Filter by category IDs"
// @Param tags query []string false "Filter by tag IDs"
// @Param rsvpStatus query string false "Filter by RSVP status"
// @Param source query string false "Filter by source"
// @Param approved query bool false "Filter by approval status"
// @Success 200 {file} file "CSV file"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/guests/bulk/export [get]
// @Security BearerAuth
func (h *BulkOperationsHandler) ExportGuestsToCSV(c *gin.Context) {
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

	// Parse query parameters for filters
	filters := &models.GuestExportFilters{}

	if categoriesStr := c.QueryArray("categories"); len(categoriesStr) > 0 {
		for _, catStr := range categoriesStr {
			if catID, err := uuid.Parse(catStr); err == nil {
				filters.Categories = append(filters.Categories, catID)
			}
		}
	}

	if tagsStr := c.QueryArray("tags"); len(tagsStr) > 0 {
		for _, tagStr := range tagsStr {
			if tagID, err := uuid.Parse(tagStr); err == nil {
				filters.Tags = append(filters.Tags, tagID)
			}
		}
	}

	if rsvpStatus := c.Query("rsvpStatus"); rsvpStatus != "" {
		status := models.RSVPStatus(rsvpStatus)
		filters.RSVPStatus = &status
	}

	if source := c.Query("source"); source != "" {
		sourceType := models.GuestSource(source)
		filters.Source = &sourceType
	}

	if approvedStr := c.Query("approved"); approvedStr != "" {
		if approvedStr == "true" {
			approved := true
			filters.Approved = &approved
		} else if approvedStr == "false" {
			approved := false
			filters.Approved = &approved
		}
	}

	// Export guests
	csvData, err := h.bulkService.ExportGuestsToCSV(eventID, user.UserID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set response headers for file download
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=guests.csv")
	c.Data(http.StatusOK, "text/csv", csvData)
}

// SendBulkInvitations sends invitations to multiple guests
// @Summary Send bulk invitations
// @Description Send invitations to multiple guests at once
// @Tags Bulk Operations
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param invitations body models.BulkInvitationRequest true "Bulk invitation details"
// @Success 200 {object} models.BulkInvitationResult
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/guests/bulk/invite [post]
// @Security BearerAuth
func (h *BulkOperationsHandler) SendBulkInvitations(c *gin.Context) {
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

	var req models.BulkInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.bulkService.SendBulkInvitations(eventID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// UpdateBulkRSVP updates RSVP status for multiple guests
// @Summary Update bulk RSVP
// @Description Update RSVP status for multiple guests at once
// @Tags Bulk Operations
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param rsvp body models.BulkRSVPUpdateRequest true "Bulk RSVP update details"
// @Success 200 {object} models.BulkRSVPUpdateResult
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/guests/bulk/rsvp [patch]
// @Security BearerAuth
func (h *BulkOperationsHandler) UpdateBulkRSVP(c *gin.Context) {
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

	var req models.BulkRSVPUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.bulkService.UpdateBulkRSVP(eventID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// DeleteBulkGuests removes multiple guests from an event
// @Summary Delete bulk guests
// @Description Remove multiple guests from an event at once
// @Tags Bulk Operations
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param guestIds body []string true "Array of guest IDs to delete"
// @Success 200 {object} models.BulkDeleteResult
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/guests/bulk [delete]
// @Security BearerAuth
func (h *BulkOperationsHandler) DeleteBulkGuests(c *gin.Context) {
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

	var guestIDs []uuid.UUID
	if err := c.ShouldBindJSON(&guestIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.bulkService.DeleteBulkGuests(eventID, user.UserID, guestIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
