package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"
)

// SetupVenueRoutes configures venue-related routes
func SetupVenueRoutes(router *gin.Engine, venueHandler *handlers.VenueHandler, authMiddleware *middleware.AuthMiddleware) {
	// Public venue routes
	router.GET("/venues/public", venueHandler.GetPublicVenues)

	// Protected venue routes
	venues := router.Group("/venues")
	venues.Use(authMiddleware.AuthRequired())
	{
		venues.POST("", venueHandler.CreateVenue)
		venues.GET("", venueHandler.GetVenues)
		venues.GET("/:id", venueHandler.GetVenue)
		venues.PATCH("/:id", venueHandler.UpdateVenue)
		venues.DELETE("/:id", venueHandler.DeleteVenue)
	}
}
