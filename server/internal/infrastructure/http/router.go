package http

import (
	"net/http"

	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/handlers"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"

	"github.com/gorilla/mux"
)

type Router struct {
	authHandler      *handlers.AuthHandler
	eventHandler     *handlers.EventHandler
	uploadHandler    *handlers.UploadHandler
	profileHandler   *handlers.ProfileHandler
	commentHandler  *handlers.CommentHandler
	chatHandler      *handlers.ChatHandler
	chatWSHandler    *handlers.ChatWSHandler
	dashboardHandler *handlers.DashboardHandler
	authMiddleware   *middleware.AuthMiddleware
}

func NewRouter(
	authHandler *handlers.AuthHandler,
	eventHandler *handlers.EventHandler,
	uploadHandler *handlers.UploadHandler,
	profileHandler *handlers.ProfileHandler,
	commentHandler *handlers.CommentHandler,
	chatHandler *handlers.ChatHandler,
	chatWSHandler *handlers.ChatWSHandler,
	dashboardHandler *handlers.DashboardHandler,
	authMiddleware *middleware.AuthMiddleware,
) *Router {
	return &Router{
		authHandler:      authHandler,
		eventHandler:     eventHandler,
		uploadHandler:    uploadHandler,
		profileHandler:   profileHandler,
		commentHandler:   commentHandler,
		chatHandler:      chatHandler,
		chatWSHandler:    chatWSHandler,
		dashboardHandler: dashboardHandler,
		authMiddleware:   authMiddleware,
	}
}

func (r *Router) SetupRoutes(uploadDir string) *mux.Router {
	router := mux.NewRouter()

	// Serve uploaded files (banners) at /uploads/
	if uploadDir != "" {
		router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads", http.FileServer(http.Dir(uploadDir))))
	}

	api := router.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/auth/register", r.authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/login", r.authHandler.Login).Methods("POST")

	// Event routes that work with or without auth (optional auth so owner/invited can see private events)
	eventsPublic := api.PathPrefix("/events").Subrouter()
	eventsPublic.Use(r.authMiddleware.OptionalAuth)
	eventsPublic.HandleFunc("/public", r.eventHandler.ListPublicEvents).Methods("GET")
	eventsPublic.HandleFunc("/{id}/seating", r.eventHandler.ListEventSeating).Methods("GET")
	eventsPublic.HandleFunc("/{id}", r.eventHandler.GetEvent).Methods("GET")
	// Public comments (optional auth: need access to event)
	eventsPublic.HandleFunc("/{id}/comments", r.commentHandler.ListComments).Methods("GET")

	// Protected event routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(r.authMiddleware.Middleware)
	protected.HandleFunc("/upload/banner", r.uploadHandler.UploadBanner).Methods("POST")
	protected.HandleFunc("/events/{id}/comments", r.commentHandler.CreateComment).Methods("POST")
	protected.HandleFunc("/events/{id}/chat/threads", r.chatHandler.ListThreads).Methods("GET")
	protected.HandleFunc("/events/{id}/chat/thread", r.chatHandler.GetOrCreateThread).Methods("GET")
	protected.HandleFunc("/events/{id}/chat/threads/{threadId}/messages", r.chatHandler.ListMessages).Methods("GET")
	protected.HandleFunc("/events/{id}/chat/threads/{threadId}/messages", r.chatHandler.SendMessage).Methods("POST")
	protected.HandleFunc("/upload/avatar", r.uploadHandler.UploadAvatar).Methods("POST")
	protected.HandleFunc("/users/me", r.profileHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/users/me", r.profileHandler.UpdateProfile).Methods("PUT")
	protected.HandleFunc("/dashboard", r.dashboardHandler.GetDashboard).Methods("GET")
	protected.HandleFunc("/events", r.eventHandler.CreateEvent).Methods("POST")
	protected.HandleFunc("/events", r.eventHandler.GetEvents).Methods("GET")
	protected.HandleFunc("/events/{id}/ticket", r.eventHandler.GetTicket).Methods("GET")
	protected.HandleFunc("/events/invitations", r.eventHandler.GetInvitationEvents).Methods("GET")
	protected.HandleFunc("/invitations", r.eventHandler.GetMyInvitations).Methods("GET")
	protected.HandleFunc("/events/{id}/invites", r.eventHandler.ListEventInvites).Methods("GET")
	protected.HandleFunc("/events/{id}/invites", r.eventHandler.InviteUserToEvent).Methods("POST")
	protected.HandleFunc("/events/{id}/rsvp", r.eventHandler.RespondToInvite).Methods("PUT")
	protected.HandleFunc("/events/{id}/tables", r.eventHandler.CreateEventTable).Methods("POST")
	protected.HandleFunc("/events/{id}/seating/order", r.eventHandler.ReorderEventTables).Methods("PUT")
	protected.HandleFunc("/events/{id}/tables/{tableId}", r.eventHandler.UpdateEventTable).Methods("PUT")
	protected.HandleFunc("/events/{id}/tables/{tableId}", r.eventHandler.DeleteEventTable).Methods("DELETE")
	protected.HandleFunc("/events/{id}", r.eventHandler.UpdateEvent).Methods("PUT")
	protected.HandleFunc("/events/{id}", r.eventHandler.DeleteEvent).Methods("DELETE")

	// WebSocket: chat (token in query or header)
	api.HandleFunc("/ws/chat/threads/{threadId}", r.chatWSHandler.Upgrade).Methods("GET")

	return router
}