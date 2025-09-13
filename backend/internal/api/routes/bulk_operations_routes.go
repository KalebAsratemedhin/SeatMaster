package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupBulkOperationsRoutes configures all bulk operations related routes
func SetupBulkOperationsRoutes(router *gin.Engine, bulkHandler *handlers.BulkOperationsHandler, authMiddleware *middleware.AuthMiddleware) {
	// Bulk operations routes (authentication required)
	bulk := router.Group("/events/:id/guests/bulk")
	bulk.Use(authMiddleware.AuthRequired())
	{
		bulk.POST("/import", bulkHandler.ImportGuestsFromCSV) // Import guests from CSV
		bulk.GET("/export", bulkHandler.ExportGuestsToCSV)    // Export guests to CSV
		bulk.POST("/invite", bulkHandler.SendBulkInvitations) // Send bulk invitations
		bulk.PATCH("/rsvp", bulkHandler.UpdateBulkRSVP)       // Update bulk RSVP
		bulk.DELETE("", bulkHandler.DeleteBulkGuests)         // Delete bulk guests
	}
}
