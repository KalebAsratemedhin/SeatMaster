package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"
	"github.com/seatmaster/backend/internal/config"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupRoutes initializes all application routes
func SetupRoutes(
	authService *services.AuthService,
	authHandler *handlers.AuthHandler,
	db *database.DB,
	config *config.Config,
) *gin.Engine {
	router := gin.Default()

	// Global middleware
	router.Use(corsMiddleware())

	// Initialize auth middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Setup route groups
	SetupPublicRoutes(router)
	SetupAuthRoutes(router, authHandler, authMiddleware)

	// Initialize profile handler and setup routes
	profileHandler := handlers.NewProfileHandler(authService)
	SetupProfileRoutes(router, profileHandler, authMiddleware)

	// Initialize event handler and setup routes
	eventService := services.NewEventService(db)
	eventHandler := handlers.NewEventHandler(eventService)
	SetupEventRoutes(router, eventHandler, authMiddleware)

	// Initialize guest handler and setup routes
	guestService := services.NewGuestService(db)
	guestHandler := handlers.NewGuestHandler(guestService)
	SetupGuestRoutes(router, guestHandler, authMiddleware)

	// Initialize invitation handler and setup routes
	invitationService := services.NewInvitationService(db, config)
	invitationHandler := handlers.NewInvitationHandler(invitationService)
	SetupInvitationRoutes(router, invitationHandler, authMiddleware)

	// Initialize venue handler and setup routes
	venueService := services.NewVenueService(db)
	venueHandler := handlers.NewVenueHandler(venueService)
	SetupVenueRoutes(router, venueHandler, authMiddleware)

	// Initialize room handler and setup routes
	roomService := services.NewRoomService(db)
	roomHandler := handlers.NewRoomHandler(roomService)
	SetupRoomRoutes(router, roomHandler, authMiddleware)

	// Initialize seat handler and setup routes
	seatService := services.NewSeatService(db)
	seatHandler := handlers.NewSeatHandler(seatService)
	SetupSeatRoutes(router, seatHandler, authMiddleware)

	// Initialize plus-one handler and setup routes
	plusOneService := services.NewPlusOneService(db)
	plusOneHandler := handlers.NewPlusOneHandler(plusOneService)
	SetupPlusOneRoutes(router, plusOneHandler, authMiddleware)

	// Initialize guest category handler and setup routes
	guestCategoryService := services.NewGuestCategoryService(db)
	guestCategoryHandler := handlers.NewGuestCategoryHandler(guestCategoryService)
	SetupGuestCategoryRoutes(router, guestCategoryHandler, authMiddleware)

	// Initialize guest tag handler and setup routes
	guestTagService := services.NewGuestTagService(db)
	guestTagHandler := handlers.NewGuestTagHandler(guestTagService)
	SetupGuestTagRoutes(router, guestTagHandler, authMiddleware)

	// Initialize guest communication handler and setup routes
	guestCommunicationService := services.NewGuestCommunicationService(db)
	guestCommunicationHandler := handlers.NewGuestCommunicationHandler(guestCommunicationService)
	SetupGuestCommunicationRoutes(router, guestCommunicationHandler, authMiddleware)

	// Initialize seating assignment handler and setup routes
	seatingAssignmentService := services.NewSeatingAssignmentService(db)
	seatingAssignmentHandler := handlers.NewSeatingAssignmentHandler(seatingAssignmentService)
	SetupSeatingAssignmentRoutes(router, seatingAssignmentHandler, authMiddleware)

	// Initialize bulk operations handler and setup routes
	bulkGuestService := services.NewBulkGuestService(db)
	bulkOperationsHandler := handlers.NewBulkOperationsHandler(bulkGuestService)
	SetupBulkOperationsRoutes(router, bulkOperationsHandler, authMiddleware)

	// Future route groups can be added here:
	// SetupUserRoutes(router, userHandler, authMiddleware)

	return router
}

// corsMiddleware handles CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
