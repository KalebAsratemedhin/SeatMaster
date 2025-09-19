package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"
)

// SetupSeatRoutes configures seat-related routes
func SetupSeatRoutes(router *gin.Engine, seatHandler *handlers.SeatHandler, authMiddleware *middleware.AuthMiddleware) {
	// Seat routes are nested under venues/rooms
	venues := router.Group("/venues")
	venues.Use(authMiddleware.AuthRequired())
	{
		// Room management within venues
		rooms := venues.Group("/:id/rooms")
		{
			// Seat management within rooms
			seats := rooms.Group("/:roomId/seats")
			{
				seats.POST("", seatHandler.CreateSeat)
				seats.POST("/grid", seatHandler.CreateSeatGrid)
				seats.GET("", seatHandler.GetSeats)
				seats.PATCH("/:seatId", seatHandler.UpdateSeat)
				seats.DELETE("/:seatId", seatHandler.DeleteSeat)
			}
		}
	}

}
