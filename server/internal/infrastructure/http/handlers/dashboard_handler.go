package handlers

import (
	"net/http"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
)

type DashboardHandler struct {
	dashboardUseCase *usecases.DashboardUseCase
}

func NewDashboardHandler(dashboardUseCase *usecases.DashboardUseCase) *DashboardHandler {
	return &DashboardHandler{dashboardUseCase: dashboardUseCase}
}

func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := middleware.GetUserID(r.Context())
	if !ok || ownerID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	resp, err := h.dashboardUseCase.GetDashboard(r.Context(), ownerID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}
