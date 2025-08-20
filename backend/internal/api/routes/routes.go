package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupRoutes initializes all application routes
func SetupRoutes(
	authService *services.AuthService,
	authHandler *handlers.AuthHandler,
) *gin.Engine {
	router := gin.Default()

	// Global middleware
	router.Use(corsMiddleware())

	// Initialize auth middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Setup route groups
	SetupPublicRoutes(router)
	SetupAuthRoutes(router, authHandler, authMiddleware)

	// Future route groups can be added here:
	// SetupEventRoutes(router, eventHandler, authMiddleware)
	// SetupUserRoutes(router, userHandler, authMiddleware)

	return router
}

// corsMiddleware handles CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
