package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes configures all authentication-related routes
func SetupAuthRoutes(router *gin.Engine, authHandler *handlers.AuthHandler, authMiddleware *middleware.AuthMiddleware) {
	// Public auth routes (no authentication required)
	auth := router.Group("/auth")
	{
		auth.POST("/signup", authHandler.SignUp)
		auth.POST("/signin", authHandler.SignIn)
		auth.POST("/signout", authHandler.SignOut)
	}

	// Protected auth routes (authentication required)
	authProtected := router.Group("/auth")
	authProtected.Use(authMiddleware.AuthRequired())
	{
		authProtected.GET("/me", authHandler.Me)
	}
}
