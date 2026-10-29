package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
)

type InvitationCardHandler struct {
	useCase *usecases.InvitationCardUseCase
}

func NewInvitationCardHandler(useCase *usecases.InvitationCardUseCase) *InvitationCardHandler {
	return &InvitationCardHandler{useCase: useCase}
}

func (h *InvitationCardHandler) Get(w http.ResponseWriter, r *http.Request) {
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	callerID, _ := middleware.GetUserID(r.Context())
	resp, err := h.useCase.Get(r.Context(), eventID, callerID)
	if err != nil {
		mapInvitationCardError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *InvitationCardHandler) Upsert(w http.ResponseWriter, r *http.Request) {
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
	var req dto.UpsertInvitationCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.useCase.Upsert(r.Context(), eventID, ownerID, req)
	if err != nil {
		mapInvitationCardError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *InvitationCardHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
	if err := h.useCase.Delete(r.Context(), eventID, ownerID); err != nil {
		mapInvitationCardError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func mapInvitationCardError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecases.ErrInvitationCardNotFound):
		respondWithError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, usecases.ErrEventNotFound):
		respondWithError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, usecases.ErrInvitationCardForbidden):
		respondWithError(w, http.StatusForbidden, err.Error())
	case errors.Is(err, usecases.ErrInvitationCardUnauthorized):
		respondWithError(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, usecases.ErrInvitationCardValidation), strings.HasPrefix(err.Error(), "validation_error"):
		respondWithError(w, http.StatusBadRequest, err.Error())
	default:
		respondWithError(w, http.StatusBadRequest, err.Error())
	}
}
