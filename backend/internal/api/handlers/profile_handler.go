package handlers

import (
	"net/http"

	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type ProfileHandler struct {
	authService *services.AuthService
	validate    *validator.Validate
}

func NewProfileHandler(authService *services.AuthService) *ProfileHandler {
	return &ProfileHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

// GetProfile returns the current user's profile
// @Summary Get user profile
// @Description Get the current authenticated user's profile information
// @Tags profile
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "User profile"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Router /profile [get]
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user from database
	user, err := h.authService.GetUserByID(userCtx.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateProfile updates the current user's profile
// @Summary Update user profile
// @Description Update the current authenticated user's profile information
// @Tags profile
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param profile body models.UpdateProfileRequest true "Profile update data"
// @Success 200 {object} map[string]interface{} "Profile updated successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Router /profile [put]
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Update profile
	user, err := h.authService.UpdateProfile(userCtx.UserID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

// ChangePassword changes the current user's password
// @Summary Change user password
// @Description Change the current authenticated user's password
// @Tags profile
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param password body models.ChangePasswordRequest true "Password change data"
// @Success 200 {object} map[string]interface{} "Password changed successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Router /profile/password [put]
func (h *ProfileHandler) ChangePassword(c *gin.Context) {
	// Get user context from middleware
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Change password
	err := h.authService.ChangePassword(userCtx.UserID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
}
