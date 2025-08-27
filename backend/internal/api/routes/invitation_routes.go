package routes

import (
	"github.com/seatmaster/backend/internal/api/handlers"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupInvitationRoutes configures all invitation-related routes
func SetupInvitationRoutes(router *gin.Engine, invitationHandler *handlers.InvitationHandler, authMiddleware *middleware.AuthMiddleware) {
	// Invitation management routes (authentication required)
	invitations := router.Group("/events/:id")
	invitations.Use(authMiddleware.AuthRequired())
	{
		invitations.POST("/invitations", invitationHandler.CreateInvitation)                      // Create invitation
		invitations.GET("/invitations", invitationHandler.GetInvitations)                         // Get event invitations
		invitations.GET("/invitations/:invitationId", invitationHandler.GetInvitation)            // Get specific invitation
		invitations.PATCH("/invitations/:invitationId", invitationHandler.UpdateInvitation)       // Update invitation
		invitations.DELETE("/invitations/:invitationId", invitationHandler.CancelInvitation)      // Cancel invitation
		invitations.POST("/invitations/:invitationId/resend", invitationHandler.ResendInvitation) // Resend invitation
	}

	// Public invitation routes (no authentication required)
	router.GET("/invitations/:token", invitationHandler.GetInvitationByToken)     // Get invitation by token
	router.POST("/invitations/:token/accept", invitationHandler.AcceptInvitation) // Accept invitation
}
