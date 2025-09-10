package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"
)

// GuestCategoryHandler handles HTTP requests for guest category management
type GuestCategoryHandler struct {
	categoryService *services.GuestCategoryService
}

// NewGuestCategoryHandler creates a new guest category handler
func NewGuestCategoryHandler(categoryService *services.GuestCategoryService) *GuestCategoryHandler {
	return &GuestCategoryHandler{
		categoryService: categoryService,
	}
}

// CreateCategory creates a new guest category
// @Summary Create a new guest category
// @Description Create a new guest category for organizing guests within an event
// @Tags Guest Categories
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param category body models.CreateGuestCategoryRequest true "Category details"
// @Success 201 {object} models.GuestCategory
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories [post]
// @Security BearerAuth
func (h *GuestCategoryHandler) CreateCategory(c *gin.Context) {
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

	var req models.CreateGuestCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.categoryService.CreateCategory(eventID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// GetCategories retrieves all categories for an event
// @Summary Get event guest categories
// @Description Retrieve all guest categories for a specific event
// @Tags Guest Categories
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} models.GuestCategoriesResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories [get]
// @Security BearerAuth
func (h *GuestCategoryHandler) GetCategories(c *gin.Context) {
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

	categories, err := h.categoryService.GetCategoriesByEvent(eventID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format with guest counts
	var responses []models.GuestCategoryResponse
	for _, category := range categories {
		// Get guest count for this category
		guests, err := h.categoryService.GetGuestsByCategory(category.ID, user.UserID)
		if err != nil {
			continue // Skip this category if we can't get guest count
		}

		response := models.GuestCategoryResponse{
			ID:          category.ID,
			EventID:     category.EventID,
			Name:        category.Name,
			Description: category.Description,
			Color:       category.Color,
			Icon:        category.Icon,
			IsDefault:   category.IsDefault,
			GuestCount:  int64(len(guests)),
			CreatedAt:   category.CreatedAt,
			UpdatedAt:   category.UpdatedAt,
		}
		responses = append(responses, response)
	}

	result := models.GuestCategoriesResponse{
		Categories: responses,
		Total:      int64(len(responses)),
	}

	c.JSON(http.StatusOK, result)
}

// GetCategory retrieves a specific category
// @Summary Get guest category details
// @Description Retrieve details of a specific guest category
// @Tags Guest Categories
// @Produce json
// @Param id path string true "Event ID"
// @Param categoryId path string true "Category ID"
// @Success 200 {object} models.GuestCategoryResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories/{categoryId} [get]
// @Security BearerAuth
func (h *GuestCategoryHandler) GetCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("categoryId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get categories for the event and find the specific one
	categories, err := h.categoryService.GetCategoriesByEvent(uuid.Nil, user.UserID) // We'll get all categories for the user
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var targetCategory *models.GuestCategory
	for _, category := range categories {
		if category.ID == categoryID {
			targetCategory = &category
			break
		}
	}

	if targetCategory == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}

	// Get guest count
	guests, err := h.categoryService.GetGuestsByCategory(categoryID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := models.GuestCategoryResponse{
		ID:          targetCategory.ID,
		EventID:     targetCategory.EventID,
		Name:        targetCategory.Name,
		Description: targetCategory.Description,
		Color:       targetCategory.Color,
		Icon:        targetCategory.Icon,
		IsDefault:   targetCategory.IsDefault,
		GuestCount:  int64(len(guests)),
		CreatedAt:   targetCategory.CreatedAt,
		UpdatedAt:   targetCategory.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateCategory updates an existing category
// @Summary Update guest category
// @Description Update an existing guest category
// @Tags Guest Categories
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param categoryId path string true "Category ID"
// @Param category body models.UpdateGuestCategoryRequest true "Updated category details"
// @Success 200 {object} models.GuestCategory
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories/{categoryId} [patch]
// @Security BearerAuth
func (h *GuestCategoryHandler) UpdateCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("categoryId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.UpdateGuestCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.categoryService.UpdateCategory(categoryID, user.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, category)
}

// DeleteCategory deletes a category
// @Summary Delete guest category
// @Description Delete an existing guest category
// @Tags Guest Categories
// @Produce json
// @Param id path string true "Event ID"
// @Param categoryId path string true "Category ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories/{categoryId} [delete]
// @Security BearerAuth
func (h *GuestCategoryHandler) DeleteCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("categoryId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.categoryService.DeleteCategory(categoryID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// AssignGuestToCategory assigns a guest to a category
// @Summary Assign guest to category
// @Description Assign a guest to a specific category
// @Tags Guest Categories
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param categoryId path string true "Category ID"
// @Param assignment body models.AssignGuestToCategoryRequest true "Guest assignment details"
// @Success 200 {object} models.GuestCategoryAssignment
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories/{categoryId}/guests [post]
// @Security BearerAuth
func (h *GuestCategoryHandler) AssignGuestToCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("categoryId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.AssignGuestToCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := h.categoryService.AssignGuestToCategory(req.GuestID, categoryID, user.UserID, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

// RemoveGuestFromCategory removes a guest from a category
// @Summary Remove guest from category
// @Description Remove a guest from a specific category
// @Tags Guest Categories
// @Produce json
// @Param id path string true "Event ID"
// @Param categoryId path string true "Category ID"
// @Param guestId path string true "Guest ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories/{categoryId}/guests/{guestId} [delete]
// @Security BearerAuth
func (h *GuestCategoryHandler) RemoveGuestFromCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("categoryId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
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

	if err := h.categoryService.RemoveGuestFromCategory(guestID, categoryID, user.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetGuestsByCategory retrieves all guests in a category
// @Summary Get guests by category
// @Description Retrieve all guests assigned to a specific category
// @Tags Guest Categories
// @Produce json
// @Param id path string true "Event ID"
// @Param categoryId path string true "Category ID"
// @Success 200 {array} models.Guest
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /events/{id}/categories/{categoryId}/guests [get]
// @Security BearerAuth
func (h *GuestCategoryHandler) GetGuestsByCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("categoryId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	user, exists := middleware.GetUserFromContext(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	guests, err := h.categoryService.GetGuestsByCategory(categoryID, user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, guests)
}
