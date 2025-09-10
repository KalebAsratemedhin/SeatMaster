package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// GuestTagHandler handles HTTP requests for guest tag management
type GuestTagHandler struct {
	tagService *services.GuestTagService
}

// NewGuestTagHandler creates a new guest tag handler
func NewGuestTagHandler(tagService *services.GuestTagService) *GuestTagHandler {
	return &GuestTagHandler{
		tagService: tagService,
	}
}

// CreateTag creates a new guest tag
// @Summary Create a new guest tag
// @Description Create a new guest tag for labeling guests within an event
// @Tags Guest Tags
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param tag body models.CreateGuestTagRequest true "Tag details"
// @Success 201 {object} models.GuestTag
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags [post]
// @Security BearerAuth
func (h *GuestTagHandler) CreateTag(c *gin.Context) {
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

	var req models.CreateGuestTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tag, err := h.tagService.CreateTag(eventID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tag)
}

// GetTags retrieves all tags for an event
// @Summary Get event guest tags
// @Description Retrieve all guest tags for a specific event
// @Tags Guest Tags
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} models.GuestTagsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags [get]
// @Security BearerAuth
func (h *GuestTagHandler) GetTags(c *gin.Context) {
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

	tags, err := h.tagService.GetTagsByEvent(eventID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format with guest counts
	var responses []models.GuestTagResponse
	for _, tag := range tags {
		// Get guest count for this tag
		guests, err := h.tagService.GetGuestsByTag(tag.ID, user.UserID)
		if err != nil {
			continue // Skip this tag if we can't get guest count
		}

		response := models.GuestTagResponse{
			ID:          tag.ID,
			EventID:     tag.EventID,
			Name:        tag.Name,
			Description: tag.Description,
			Color:       tag.Color,
			GuestCount:  int64(len(guests)),
			CreatedAt:   tag.CreatedAt,
			UpdatedAt:   tag.UpdatedAt,
		}
		responses = append(responses, response)
	}

	result := models.GuestTagsResponse{
		Tags:  responses,
		Total: int64(len(responses)),
	}

	c.JSON(http.StatusOK, result)
}

// UpdateTag updates an existing tag
// @Summary Update guest tag
// @Description Update an existing guest tag
// @Tags Guest Tags
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param tagId path string true "Tag ID"
// @Param tag body models.UpdateGuestTagRequest true "Updated tag details"
// @Success 200 {object} models.GuestTag
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags/{tagId} [patch]
// @Security BearerAuth
func (h *GuestTagHandler) UpdateTag(c *gin.Context) {
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.UpdateGuestTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tag, err := h.tagService.UpdateTag(tagID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tag)
}

// DeleteTag deletes a tag
// @Summary Delete guest tag
// @Description Delete an existing guest tag
// @Tags Guest Tags
// @Produce json
// @Param id path string true "Event ID"
// @Param tagId path string true "Tag ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags/{tagId} [delete]
// @Security BearerAuth
func (h *GuestTagHandler) DeleteTag(c *gin.Context) {
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.tagService.DeleteTag(tagID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// AssignGuestToTag assigns a guest to a tag
// @Summary Assign guest to tag
// @Description Assign a guest to a specific tag
// @Tags Guest Tags
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param tagId path string true "Tag ID"
// @Param assignment body models.AssignGuestToTagRequest true "Guest assignment details"
// @Success 200 {object} models.GuestTagAssignment
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags/{tagId}/guests [post]
// @Security BearerAuth
func (h *GuestTagHandler) AssignGuestToTag(c *gin.Context) {
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.AssignGuestToTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := h.tagService.AssignGuestToTag(req.GuestID, tagID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

// RemoveGuestFromTag removes a guest from a tag
// @Summary Remove guest from tag
// @Description Remove a guest from a specific tag
// @Tags Guest Tags
// @Produce json
// @Param id path string true "Event ID"
// @Param tagId path string true "Tag ID"
// @Param guestId path string true "Guest ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags/{tagId}/guests/{guestId} [delete]
// @Security BearerAuth
func (h *GuestTagHandler) RemoveGuestFromTag(c *gin.Context) {
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag ID"})
		return
	}

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

	if err := h.tagService.RemoveGuestFromTag(guestID, tagID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetGuestsByTag retrieves all guests with a specific tag
// @Summary Get guests by tag
// @Description Retrieve all guests assigned to a specific tag
// @Tags Guest Tags
// @Produce json
// @Param id path string true "Event ID"
// @Param tagId path string true "Tag ID"
// @Success 200 {array} models.Guest
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/tags/{tagId}/guests [get]
// @Security BearerAuth
func (h *GuestTagHandler) GetGuestsByTag(c *gin.Context) {
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	guests, err := h.tagService.GetGuestsByTag(tagID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, guests)
}
