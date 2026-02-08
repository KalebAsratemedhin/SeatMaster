package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	"github.com/gorilla/mux"
)

type EventHandler struct {
	eventUseCase *usecases.EventUseCase
}

func NewEventHandler(eventUseCase *usecases.EventUseCase) *EventHandler {
	return &EventHandler{eventUseCase: eventUseCase}
}

func (h *EventHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req dto.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	resp, err := h.eventUseCase.CreateEvent(r.Context(), ownerID, req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, resp)
}

func (h *EventHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var req dto.UpdateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	req.ID = id

	resp, err := h.eventUseCase.UpdateEvent(r.Context(), ownerID, req)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *EventHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	if err := h.eventUseCase.DeleteEvent(r.Context(), id, ownerID); err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EventHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	id, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	callerID, _ := middleware.GetUserID(r.Context()) // 0 if not logged in

	resp, err := h.eventUseCase.GetEvent(r.Context(), id, callerID)
	if err != nil {
		if err.Error() == "forbidden: event is private" || err.Error() == "forbidden: you do not have access to this event" {
			respondWithError(w, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *EventHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	events, err := h.eventUseCase.GetEvents(r.Context(), ownerID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if events == nil {
		events = []*dto.EventResponse{}
	}
	respondWithJSON(w, http.StatusOK, events)
}

func (h *EventHandler) GetInvitationEvents(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	events, err := h.eventUseCase.GetInvitationEvents(r.Context(), userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if events == nil {
		events = []*dto.EventResponse{}
	}
	respondWithJSON(w, http.StatusOK, events)
}

func (h *EventHandler) ListPublicEvents(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	limit := 20
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil && n >= 0 {
			offset = n
		}
	}

	events, err := h.eventUseCase.ListPublicEvents(r.Context(), search, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if events == nil {
		events = []*dto.EventResponse{}
	}
	respondWithJSON(w, http.StatusOK, events)
}

func (h *EventHandler) InviteUserToEvent(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var req dto.InviteEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	resp, err := h.eventUseCase.InviteUserToEvent(r.Context(), ownerID, eventID, req.Email)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, resp)
}

func (h *EventHandler) ListEventInvites(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	invites, err := h.eventUseCase.ListEventInvites(r.Context(), ownerID, eventID)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	if invites == nil {
		invites = []*dto.EventInviteResponse{}
	}
	respondWithJSON(w, http.StatusOK, invites)
}

func parseIDFromPath(r *http.Request) (int64, error) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	return strconv.ParseInt(idStr, 10, 64)
}
