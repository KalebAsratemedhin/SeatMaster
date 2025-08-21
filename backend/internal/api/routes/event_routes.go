package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupEventRoutes configures all event-related routes
func SetupEventRoutes(router *gin.Engine, eventHandler *handlers.EventHandler, authMiddleware *middleware.AuthMiddleware) {
	// Public event routes (no authentication required)
	router.GET("/events/public", eventHandler.GetPublicEvents) // Get public events

	// Event routes (authentication required)
	events := router.Group("/events")
	events.Use(authMiddleware.AuthRequired())
	{
		events.POST("", eventHandler.CreateEvent)       // Create event
		events.GET("", eventHandler.GetEvents)          // Get user's events
		events.GET("/:id", eventHandler.GetEvent)       // Get specific event
		events.PATCH("/:id", eventHandler.UpdateEvent)  // Update event (partial update)
		events.DELETE("/:id", eventHandler.DeleteEvent) // Delete event
	}
}
