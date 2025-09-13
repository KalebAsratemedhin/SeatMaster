package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupSeatingAssignmentRoutes configures all seating assignment related routes
func SetupSeatingAssignmentRoutes(router *gin.Engine, seatingAssignmentHandler *handlers.SeatingAssignmentHandler, authMiddleware *middleware.AuthMiddleware) {
	// Seating assignment routes (authentication required)
	seating := router.Group("/events/:id/seating")
	seating.Use(authMiddleware.AuthRequired())
	{
		seating.POST("/assign", seatingAssignmentHandler.AssignGuestToSeat)                           // Assign guest to seat
		seating.GET("", seatingAssignmentHandler.GetSeatingAssignments)                               // Get event seating assignments
		seating.GET("/chart", seatingAssignmentHandler.GetSeatingChart)                               // Get complete seating chart
		seating.DELETE("/assign/:seatId", seatingAssignmentHandler.UnassignGuestFromSeat)             // Unassign guest from seat
		seating.PATCH("/assignments/:assignmentId", seatingAssignmentHandler.UpdateSeatingAssignment) // Update seating assignment
	}
}
