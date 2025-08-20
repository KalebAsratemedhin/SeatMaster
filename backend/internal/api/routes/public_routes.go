package routes

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupPublicRoutes configures public routes that don't require authentication
func SetupPublicRoutes(router *gin.Engine) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "SeatMaster Backend is running",
		})
	})

	// API documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
