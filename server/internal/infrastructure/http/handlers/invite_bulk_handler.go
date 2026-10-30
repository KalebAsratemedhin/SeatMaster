package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func (h *EventHandler) BulkInvite(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	var req dto.BulkInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.eventUseCase.StartBulkInviteJob(r.Context(), ownerID, eventID, req.Emails)
	if err != nil {
		mapInviteJobError(w, err)
		return
	}
	respondWithJSON(w, http.StatusAccepted, resp)
}

func (h *EventHandler) ImportInvites(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	if err := r.ParseMultipartForm(8 << 20); err != nil { // 8 MiB
		respondWithError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, 8<<20))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "failed to read file")
		return
	}
	resp, err := h.eventUseCase.StartImportInviteJob(r.Context(), ownerID, eventID, header.Filename, data)
	if err != nil {
		mapInviteJobError(w, err)
		return
	}
	respondWithJSON(w, http.StatusAccepted, resp)
}

func (h *EventHandler) GetInviteJob(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	jobID := mux.Vars(r)["jobId"]
	if _, err := uuid.Parse(jobID); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid job id")
		return
	}
	resp, err := h.eventUseCase.GetInviteJobStatus(r.Context(), ownerID, eventID, jobID)
	if err != nil {
		mapInviteJobError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *EventHandler) ListAttendeeRecommendations(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	limit, offset := parseLimitOffset(r)
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	excludeEventID := strings.TrimSpace(r.URL.Query().Get("exclude_event_id"))
	if excludeEventID != "" {
		if _, err := uuid.Parse(excludeEventID); err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid exclude_event_id")
			return
		}
	}
	resp, err := h.eventUseCase.ListAttendeeRecommendations(r.Context(), ownerID, search, excludeEventID, limit, offset)
	if err != nil {
		mapInviteJobError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func mapInviteJobError(w http.ResponseWriter, err error) {
	msg := err.Error()
	switch {
	case msg == "unauthorized":
		respondWithError(w, http.StatusUnauthorized, msg)
	case msg == "you are not the owner of this event":
		respondWithError(w, http.StatusForbidden, msg)
	case msg == "event not found", msg == "invite job not found":
		respondWithError(w, http.StatusNotFound, msg)
	default:
		respondWithError(w, http.StatusBadRequest, msg)
	}
}
