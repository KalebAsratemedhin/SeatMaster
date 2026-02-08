package http

import (
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/handlers"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"

	"github.com/gorilla/mux"
)

type Router struct {
	authHandler    *handlers.AuthHandler
	eventHandler   *handlers.EventHandler
	authMiddleware *middleware.AuthMiddleware
}

func NewRouter(
	authHandler *handlers.AuthHandler,
	eventHandler *handlers.EventHandler,
	authMiddleware *middleware.AuthMiddleware,
) *Router {
	return &Router{
		authHandler:    authHandler,
		eventHandler:  eventHandler,
		authMiddleware: authMiddleware,
	}
}

func (r *Router) SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	api := router.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/auth/register", r.authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/login", r.authHandler.Login).Methods("POST")

	// Public: discover public events (no auth)
	api.HandleFunc("/events/public", r.eventHandler.ListPublicEvents).Methods("GET")
	// Public: get single event (public events visible to all; private require auth or invite)
	api.HandleFunc("/events/{id}", r.eventHandler.GetEvent).Methods("GET")

	// Protected event routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(r.authMiddleware.Middleware)
	protected.HandleFunc("/events", r.eventHandler.CreateEvent).Methods("POST")
	protected.HandleFunc("/events", r.eventHandler.GetEvents).Methods("GET")
	protected.HandleFunc("/events/invitations", r.eventHandler.GetInvitationEvents).Methods("GET")
	protected.HandleFunc("/events/{id}/invites", r.eventHandler.ListEventInvites).Methods("GET")
	protected.HandleFunc("/events/{id}/invites", r.eventHandler.InviteUserToEvent).Methods("POST")
	protected.HandleFunc("/events/{id}", r.eventHandler.UpdateEvent).Methods("PUT")
	protected.HandleFunc("/events/{id}", r.eventHandler.DeleteEvent).Methods("DELETE")

	return router
}