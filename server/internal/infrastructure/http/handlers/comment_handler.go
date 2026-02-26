package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
)

type CommentHandler struct {
	commentUseCase *usecases.CommentUseCase
}

func NewCommentHandler(commentUseCase *usecases.CommentUseCase) *CommentHandler {
	return &CommentHandler{commentUseCase: commentUseCase}
}

func (h *CommentHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	callerID, _ := middleware.GetUserID(r.Context())
	limit, offset := parseLimitOffset(r)
	resp, err := h.commentUseCase.ListComments(r.Context(), eventID, callerID, limit, offset)
	if err != nil {
		if err.Error() == "forbidden: you do not have access to this event" {
			respondWithError(w, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	eventID, err := parseIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	var req dto.CreateEventCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.commentUseCase.CreateComment(r.Context(), eventID, userID, req.Body, req.ParentID)
	if err != nil {
		if err.Error() == "forbidden: you do not have access to this event" || err.Error() == "unauthorized" {
			respondWithError(w, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, resp)
}
