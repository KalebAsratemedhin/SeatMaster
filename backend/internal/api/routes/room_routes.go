package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"
)

// SetupRoomRoutes configures room-related routes
func SetupRoomRoutes(router *gin.Engine, roomHandler *handlers.RoomHandler, authMiddleware *middleware.AuthMiddleware) {
	// Room routes are nested under venues
	venues := router.Group("/venues")
	venues.Use(authMiddleware.AuthRequired())
	{
		// Room management within venues
		rooms := venues.Group("/:id/rooms")
		{
			rooms.POST("", roomHandler.CreateRoom)
			rooms.GET("", roomHandler.GetRooms)
			rooms.GET("/:roomId", roomHandler.GetRoom)
			rooms.PATCH("/:roomId", roomHandler.UpdateRoom)
			rooms.DELETE("/:roomId", roomHandler.DeleteRoom)
		}
	}
}
