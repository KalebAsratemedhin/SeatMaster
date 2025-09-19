package handlers

import (
	"net/http"

	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/database/models"
	"github.com/seatmaster/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	authService *services.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

// SignUp handles user registration
// @Summary User registration
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param user body models.CreateUserRequest true "User registration data"
// @Success 201 {object} models.AuthResponse "User created successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Router /auth/signup [post]
func (h *AuthHandler) SignUp(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	response, err := h.authService.CreateUser(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// SignIn handles user authentication
// @Summary User login
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body models.SignInRequest true "User credentials"
// @Success 200 {object} models.AuthResponse "Login successful"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Router /auth/signin [post]
func (h *AuthHandler) SignIn(c *gin.Context) {
	var req models.SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	response, err := h.authService.SignIn(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// SignOut handles user logout (client-side token removal)
// @Summary User logout
// @Description Logout user (client-side token removal)
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Logged out successfully"
// @Router /auth/signout [post]
func (h *AuthHandler) SignOut(c *gin.Context) {
	// Since we're using JWT, the actual logout happens on the client side
	// by removing the token. This endpoint just confirms the logout.
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Me returns the current authenticated user
// @Summary Get current user
// @Description Get information about the currently authenticated user
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "User information"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
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
