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
	limit, offset := parseLimitOffset(r)
	resp, err := h.eventUseCase.GetEventsPaginated(r.Context(), ownerID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if resp == nil {
		resp = &dto.PaginatedEventsResponse{Items: []*dto.EventResponse{}, Total: 0}
	}
	respondWithJSON(w, http.StatusOK, resp)
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
	limit, offset := parseLimitOffset(r)
	resp, err := h.eventUseCase.ListEventInvitesPaginated(r.Context(), ownerID, eventID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	if resp == nil {
		resp = &dto.PaginatedInvitesResponse{Items: []*dto.EventInviteResponse{}, Total: 0}
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *EventHandler) GetMyInvitations(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	limit, offset := parseLimitOffset(r)
	resp, err := h.eventUseCase.GetMyInvitationsPaginated(r.Context(), userID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if resp == nil {
		resp = &dto.PaginatedInvitationsResponse{Items: []*dto.InvitationWithEventResponse{}, Total: 0}
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *EventHandler) RespondToInvite(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == 0 {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	var req dto.RespondToInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.eventUseCase.RespondToInvite(r.Context(), userID, eventID, req.Status, req.SeatID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func parseIDFromPath(r *http.Request) (int64, error) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	return strconv.ParseInt(idStr, 10, 64)
}

func parseLimitOffset(r *http.Request) (limit, offset int) {
	limit = 20
	offset = 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil && n >= 0 {
			offset = n
		}
	}
	return limit, offset
}

func (h *EventHandler) CreateEventTable(w http.ResponseWriter, r *http.Request) {
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
	var req dto.CreateEventTableRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.eventUseCase.CreateEventTable(r.Context(), ownerID, eventID, req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, resp)
}

func (h *EventHandler) ReorderEventTables(w http.ResponseWriter, r *http.Request) {
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
	var req dto.ReorderEventTablesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	if err := h.eventUseCase.ReorderEventTables(r.Context(), ownerID, eventID, req.TableIDs); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *EventHandler) ListEventSeating(w http.ResponseWriter, r *http.Request) {
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	callerID, _ := middleware.GetUserID(r.Context())
	tables, err := h.eventUseCase.ListEventSeating(r.Context(), eventID, callerID)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	if tables == nil {
		tables = []*dto.EventTableResponse{}
	}
	respondWithJSON(w, http.StatusOK, tables)
}

func (h *EventHandler) UpdateEventTable(w http.ResponseWriter, r *http.Request) {
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
	tableID, err := parseTableIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid table id")
		return
	}
	var req dto.UpdateEventTableRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.eventUseCase.UpdateEventTable(r.Context(), ownerID, eventID, tableID, req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *EventHandler) DeleteEventTable(w http.ResponseWriter, r *http.Request) {
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
	tableID, err := parseTableIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid table id")
		return
	}
	if err := h.eventUseCase.DeleteEventTable(r.Context(), ownerID, eventID, tableID); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func parseTableIDFromPath(r *http.Request) (int64, error) {
	vars := mux.Vars(r)
	idStr := vars["tableId"]
	return strconv.ParseInt(idStr, 10, 64)
}
