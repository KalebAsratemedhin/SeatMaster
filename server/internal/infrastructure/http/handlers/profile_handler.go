package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
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
