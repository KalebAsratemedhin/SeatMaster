"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const baseURL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    : "http://localhost:8080";

function getWsBaseUrl(): string {
  const url = baseURL.replace(/^http/, "ws");
  return url.replace(/\/$/, "");
}

export type ChatMessageWS = {
  type: string;
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function useChatWebSocket(threadId: string | null, token: string | null) {
  const [messages, setMessages] = useState<ChatMessageWS[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const sendMessage = useCallback(
    (body: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !body.trim()) return;
      wsRef.current.send(JSON.stringify({ type: "message", body: body.trim() }));
    },
    []
  );

  useEffect(() => {
    if (!threadId || !token) {
      setMessages([]);
      setConnected(false);
      return;
    }
    const wsBase = getWsBaseUrl();
    const url = `${wsBase}/api/v1/ws/chat/threads/${threadId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatMessageWS;
        if (data.type === "message" && data.id) {
          setMessages((prev) => [...prev, data]);
        }
      } catch {
        // ignore non-JSON or invalid
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
      setMessages([]);
    };
  }, [threadId, token]);

  return { messages, connected, sendMessage, appendMessage: setMessages };
}
