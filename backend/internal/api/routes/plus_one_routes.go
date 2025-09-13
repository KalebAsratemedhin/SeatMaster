package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupPlusOneRoutes configures all plus-one related routes
func SetupPlusOneRoutes(router *gin.Engine, plusOneHandler *handlers.PlusOneHandler, authMiddleware *middleware.AuthMiddleware) {
	// Plus-one routes (authentication required)
	plusOnes := router.Group("/guests/:guestId/plus-ones")
	plusOnes.Use(authMiddleware.AuthRequired())
	{
		plusOnes.POST("", plusOneHandler.CreatePlusOne)                     // Create plus-one
		plusOnes.GET("", plusOneHandler.GetPlusOnes)                        // Get guest plus-ones
		plusOnes.PATCH("/:plusOneId", plusOneHandler.UpdatePlusOne)         // Update plus-one
		plusOnes.DELETE("/:plusOneId", plusOneHandler.DeletePlusOne)        // Delete plus-one
		plusOnes.POST("/:plusOneId/approve", plusOneHandler.ApprovePlusOne) // Approve plus-one
		plusOnes.POST("/:plusOneId/reject", plusOneHandler.RejectPlusOne)   // Reject plus-one
	}
}
