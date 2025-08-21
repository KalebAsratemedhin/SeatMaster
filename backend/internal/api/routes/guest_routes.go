package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupGuestRoutes configures all guest-related routes
func SetupGuestRoutes(router *gin.Engine, guestHandler *handlers.GuestHandler, authMiddleware *middleware.AuthMiddleware) {
	// Guest routes (authentication required)
	guests := router.Group("/events/:id/guests")
	guests.Use(authMiddleware.AuthRequired())
	{
		guests.POST("", guestHandler.CreateGuest)                    // Create guest
		guests.GET("", guestHandler.GetGuests)                       // Get event guests
		guests.GET("/summary", guestHandler.GetGuestSummary)         // Get guest summary
		guests.GET("/:guestId", guestHandler.GetGuest)               // Get specific guest
		guests.PATCH("/:guestId", guestHandler.UpdateGuest)          // Update guest
		guests.PATCH("/:guestId/rsvp", guestHandler.UpdateGuestRSVP) // Update guest RSVP
		guests.POST("/:guestId/approve", guestHandler.ApproveGuest)  // Approve guest
		guests.DELETE("/:guestId", guestHandler.DeleteGuest)         // Delete guest
	}
}
