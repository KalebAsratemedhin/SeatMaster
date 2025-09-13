package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupGuestCategoryRoutes configures all guest category related routes
func SetupGuestCategoryRoutes(router *gin.Engine, categoryHandler *handlers.GuestCategoryHandler, authMiddleware *middleware.AuthMiddleware) {
	// Guest category routes (authentication required)
	categories := router.Group("/events/:id/categories")
	categories.Use(authMiddleware.AuthRequired())
	{
		categories.POST("", categoryHandler.CreateCategory)                                        // Create category
		categories.GET("", categoryHandler.GetCategories)                                          // Get event categories
		categories.GET("/:categoryId", categoryHandler.GetCategory)                                // Get specific category
		categories.PATCH("/:categoryId", categoryHandler.UpdateCategory)                           // Update category
		categories.DELETE("/:categoryId", categoryHandler.DeleteCategory)                          // Delete category
		categories.POST("/:categoryId/guests", categoryHandler.AssignGuestToCategory)              // Assign guest to category
		categories.GET("/:categoryId/guests", categoryHandler.GetGuestsByCategory)                 // Get guests by category
		categories.DELETE("/:categoryId/guests/:guestId", categoryHandler.RemoveGuestFromCategory) // Remove guest from category
	}
}
