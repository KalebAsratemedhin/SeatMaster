package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/ws"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
	"github.com/gorilla/websocket"
)

// ChatWSHandler handles WebSocket connections for chat and the hub.
type ChatWSHandler struct {
	chatUseCase *usecases.ChatUseCase
	jwt         *security.JWTManager
	hub         *ws.Hub
}

func NewChatWSHandler(chatUseCase *usecases.ChatUseCase, jwt *security.JWTManager, hub *ws.Hub) *ChatWSHandler {
	return &ChatWSHandler{chatUseCase: chatUseCase, jwt: jwt, hub: hub}
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// Upgrade upgrades HTTP to WebSocket. URL: /api/v1/ws/events/:eventId/chat/:threadId?token=xxx
func (h *ChatWSHandler) Upgrade(w http.ResponseWriter, r *http.Request) {
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		if ah := r.Header.Get("Authorization"); len(ah) > 7 && strings.EqualFold(ah[:7], "Bearer ") {
			tokenStr = ah[7:]
		}
	}
	if tokenStr == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}
	claims, err := h.jwt.ValidateToken(tokenStr)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}
	userID := claims.UserID
	threadID, err := parseThreadIDFromPath(r)
	if err != nil || threadID == "" {
		http.Error(w, "invalid thread id", http.StatusBadRequest)
		return
	}
	ok, err := h.chatUseCase.CanAccessThread(r.Context(), threadID, userID)
	if err != nil || !ok {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	client := &ws.Client{
		UserID:   userID,
		ThreadID: threadID,
		Send:     make(chan []byte, 256),
	}
	h.hub.Register(client)
	defer h.hub.Unregister(client)

	go h.writePump(conn, client)
	h.readPump(r.Context(), conn, client, threadID, userID)
}

func (h *ChatWSHandler) writePump(conn *websocket.Conn, client *ws.Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case msg, ok := <-client.Send:
			if !ok {
				conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *ChatWSHandler) readPump(ctx context.Context, conn *websocket.Conn, client *ws.Client, threadID, userID string) {
	defer func() { _ = conn.Close() }()
	conn.SetReadLimit(64 * 1024)
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			break
		}
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		var in struct {
			Type string `json:"type"`
			Body string `json:"body"`
		}
		if json.Unmarshal(data, &in) != nil || in.Type != "message" || in.Body == "" {
			continue
		}
		msg, err := h.chatUseCase.SendMessage(ctx, threadID, userID, in.Body)
		if err != nil {
			continue
		}
		h.hub.BroadcastChatMessage(threadID, ws.ChatMessageWS{
			Type:      "message",
			ID:        msg.ID,
			ThreadID:  msg.ThreadID,
			SenderID:  msg.SenderID,
			Body:      msg.Body,
			CreatedAt: msg.CreatedAt,
		})
	}
}
