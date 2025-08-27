package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupGuestRoutes configures all guest-related routes
func SetupGuestRoutes(router *gin.Engine, guestHandler *handlers.GuestHandler, authMiddleware *middleware.AuthMiddleware) {
	// User's own registrations (not tied to specific event) - NEW ROUTES
	userRegistrations := router.Group("/events")
	userRegistrations.Use(authMiddleware.AuthRequired())
	{
		userRegistrations.GET("/user/registrations", guestHandler.GetUserRegistrations)
	}

	// Guest routes (authentication required)
	guests := router.Group("/events/:id")
	guests.Use(authMiddleware.AuthRequired())
	{
		guests.POST("/guests", guestHandler.CreateGuest)                    // Create guest
		guests.GET("/guests", guestHandler.GetGuests)                       // Get event guests
		guests.GET("/guests/summary", guestHandler.GetGuestSummary)         // Get guest summary
		guests.GET("/guests/:guestId", guestHandler.GetGuest)               // Get specific guest
		guests.PATCH("/guests/:guestId", guestHandler.UpdateGuest)          // Update guest
		guests.PATCH("/guests/:guestId/rsvp", guestHandler.UpdateGuestRSVP) // Update guest RSVP
		guests.POST("/guests/:guestId/approve", guestHandler.ApproveGuest)  // Approve guest
		guests.DELETE("/guests/:guestId", guestHandler.DeleteGuest)         // Delete guest
		guests.POST("/register", guestHandler.RegisterForEvent)
		guests.PATCH("/registration", guestHandler.UpdateUserRegistration)
		guests.DELETE("/registration", guestHandler.CancelUserRegistration)
	}
}
