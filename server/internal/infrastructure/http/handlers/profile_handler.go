package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	pkgerrors "github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

type ProfileHandler struct {
	profileUseCase *usecases.ProfileUseCase
}

func NewProfileHandler(profileUseCase *usecases.ProfileUseCase) *ProfileHandler {
	return &ProfileHandler{profileUseCase: profileUseCase}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	profile, err := h.profileUseCase.GetProfile(r.Context(), userID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "user not found")
		return
	}
	respondWithJSON(w, http.StatusOK, profile)
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req dto.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	profile, err := h.profileUseCase.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, profile)
}

func (h *ProfileHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req dto.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	if err := h.profileUseCase.ChangePassword(r.Context(), userID, req); err != nil {
		mapAccountError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, dto.OkResponse{OK: true})
}

func (h *ProfileHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req dto.DeleteAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	if err := h.profileUseCase.DeleteAccount(r.Context(), userID, req); err != nil {
		mapAccountError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func mapAccountError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecases.ErrInvalidCurrentPassword), errors.Is(err, usecases.ErrInvalidPassword):
		respondWithError(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, pkgerrors.ErrPasswordTooShort),
		errors.Is(err, usecases.ErrNewPasswordSameAsCurrent),
		errors.Is(err, usecases.ErrConfirmationRequired):
		respondWithError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, usecases.ErrHasOwnedEvents):
		respondWithError(w, http.StatusConflict, err.Error())
	case errors.Is(err, usecases.ErrUserNotFound):
		respondWithError(w, http.StatusNotFound, err.Error())
	case err.Error() == "unauthorized":
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
	default:
		respondWithError(w, http.StatusBadRequest, err.Error())
	}
}
