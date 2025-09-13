package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupGuestTagRoutes configures all guest tag related routes
func SetupGuestTagRoutes(router *gin.Engine, tagHandler *handlers.GuestTagHandler, authMiddleware *middleware.AuthMiddleware) {
	// Guest tag routes (authentication required)
	tags := router.Group("/events/:id/tags")
	tags.Use(authMiddleware.AuthRequired())
	{
		tags.POST("", tagHandler.CreateTag)                                   // Create tag
		tags.GET("", tagHandler.GetTags)                                      // Get event tags
		tags.PATCH("/:tagId", tagHandler.UpdateTag)                           // Update tag
		tags.DELETE("/:tagId", tagHandler.DeleteTag)                          // Delete tag
		tags.POST("/:tagId/guests", tagHandler.AssignGuestToTag)              // Assign guest to tag
		tags.GET("/:tagId/guests", tagHandler.GetGuestsByTag)                 // Get guests by tag
		tags.DELETE("/:tagId/guests/:guestId", tagHandler.RemoveGuestFromTag) // Remove guest from tag
	}
}
