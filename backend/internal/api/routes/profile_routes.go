package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupProfileRoutes configures all profile-related routes
func SetupProfileRoutes(router *gin.Engine, profileHandler *handlers.ProfileHandler, authMiddleware *middleware.AuthMiddleware) {
	// Profile routes (authentication required)
	profile := router.Group("/profile")
	profile.Use(authMiddleware.AuthRequired())
	{
		profile.GET("", profileHandler.GetProfile)
		profile.PUT("", profileHandler.UpdateProfile)
		profile.PUT("/password", profileHandler.ChangePassword)
	}
}
