package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupGuestCommunicationRoutes configures all guest communication related routes
func SetupGuestCommunicationRoutes(router *gin.Engine, communicationHandler *handlers.GuestCommunicationHandler, authMiddleware *middleware.AuthMiddleware) {
	// Guest communication routes (authentication required)
	communications := router.Group("/events/:id/communications")
	communications.Use(authMiddleware.AuthRequired())
	{
		communications.POST("", communicationHandler.CreateCommunication)                             // Create communication
		communications.GET("", communicationHandler.GetCommunications)                                // Get event communications
		communications.GET("/:communicationId", communicationHandler.GetCommunication)                // Get specific communication
		communications.PATCH("/:communicationId", communicationHandler.UpdateCommunication)           // Update communication
		communications.DELETE("/:communicationId", communicationHandler.DeleteCommunication)          // Delete communication
		communications.POST("/:communicationId/send", communicationHandler.SendCommunication)         // Send communication
		communications.POST("/:communicationId/schedule", communicationHandler.ScheduleCommunication) // Schedule communication
		communications.GET("/:communicationId/stats", communicationHandler.GetCommunicationStats)     // Get communication stats
	}
}
