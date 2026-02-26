package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type ChatHandler struct {
	chatUseCase *usecases.ChatUseCase
}

func NewChatHandler(chatUseCase *usecases.ChatUseCase) *ChatHandler {
	return &ChatHandler{chatUseCase: chatUseCase}
}

// ListThreads returns threads for the current user for this event (owner sees all guest threads, guest sees their one thread).
func (h *ChatHandler) ListThreads(w http.ResponseWriter, r *http.Request) {
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
	threads, err := h.chatUseCase.ListMyThreads(r.Context(), eventID, userID)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, threads)
}

// GetOrCreateThread returns the thread with the given guest (for owner) or the current user's thread (for guest). Query: ?guest_id= for owner.
func (h *ChatHandler) GetOrCreateThread(w http.ResponseWriter, r *http.Request) {
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
	guestID := r.URL.Query().Get("guest_id")
	thread, err := h.chatUseCase.GetOrCreateThread(r.Context(), eventID, userID, guestID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, thread)
}

// ListMessages returns messages for a thread (paginated).
func (h *ChatHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	threadID, err := parseThreadIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid thread id")
		return
	}
	limit, offset := parseLimitOffset(r)
	resp, err := h.chatUseCase.ListMessages(r.Context(), threadID, userID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, resp)
}

// SendMessage (REST) - body: { "body": "..." }. Also used to persist; WebSocket sends same and hub broadcasts.
func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	threadID, err := parseThreadIDFromPath(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid thread id")
		return
	}
	var req struct {
		Body string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	resp, err := h.chatUseCase.SendMessage(r.Context(), threadID, userID, req.Body)
	if err != nil {
		respondWithError(w, http.StatusForbidden, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, resp)
}

func parseThreadIDFromPath(r *http.Request) (string, error) {
	vars := mux.Vars(r)
	idStr := vars["threadId"]
	if idStr == "" {
		return "", nil
	}
	if _, err := uuid.Parse(idStr); err != nil {
		return "", err
	}
	return idStr, nil
}
