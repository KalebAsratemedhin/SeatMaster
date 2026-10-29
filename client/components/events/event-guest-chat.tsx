"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  useLazyGetOrCreateThreadQuery,
  useListMessagesQuery,
  type EventChatMessageResponse,
} from "@/lib/api/chatApi";
import { useGetMyInvitationsQuery } from "@/lib/api/eventsApi";
import { useChatWebSocket } from "@/lib/hooks/useChatWebSocket";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsFromName } from "@/lib/user-display";
import { formatChatTimestamp } from "@/lib/formatChatTimestamp";
import { Loader2, Send } from "lucide-react";

const CHAT_PAGE_SIZE = 100;

function ChatThread({
  eventId,
  threadId,
  token,
}: {
  eventId: string;
  threadId: string;
  token: string;
}) {
  const user = useSelector((s: RootState) => s.auth.user);
  const [chatInput, setChatInput] = useState("");

  const { data: messagesData } = useListMessagesQuery({
    eventId,
    threadId,
    limit: CHAT_PAGE_SIZE,
    offset: 0,
  });

  const total = messagesData?.total ?? 0;
  const jumpOffset = total > CHAT_PAGE_SIZE ? total - CHAT_PAGE_SIZE : 0;

  const { data: latestPage } = useListMessagesQuery(
    {
      eventId,
      threadId,
      limit: CHAT_PAGE_SIZE,
      offset: jumpOffset,
    },
    { skip: jumpOffset === 0 }
  );

  const restMessages = useMemo(
    () =>
      ((jumpOffset > 0 ? latestPage?.items : messagesData?.items) ??
        []) as EventChatMessageResponse[],
    [jumpOffset, latestPage?.items, messagesData?.items]
  );

  const { messages: wsMessages, connected, sendMessage } = useChatWebSocket(
    threadId,
    token
  );

  const allMessages = useMemo(() => {
    const seen = new Set(restMessages.map((m) => m.id));
    const fromWs = wsMessages.filter((m) => !seen.has(m.id));
    return [...restMessages, ...fromWs].sort((a, b) => {
      const ta = Date.parse(a.created_at) || 0;
      const tb = Date.parse(b.created_at) || 0;
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
  }, [restMessages, wsMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="flex h-[min(560px,70vh)] flex-col overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-2.5 dark:border-slate-700/80">
        <p className="text-xs font-medium text-slate-500">
          {connected ? "Connected" : "Connecting…"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-3">
          {allMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Say hello to the organizer.
            </p>
          ) : (
            allMessages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isMe && (
                    <Avatar className="size-8 shrink-0 self-end border border-slate-200/60 dark:border-slate-600">
                      <AvatarFallback className="bg-slate-200 text-[10px] font-semibold dark:bg-slate-700">
                        {getInitialsFromName("Organizer")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isMe
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                      {formatChatTimestamp(m.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="flex shrink-0 items-center gap-2 border-t border-slate-200/80 bg-white/80 px-3 py-3 dark:border-slate-700/80 dark:bg-slate-900/50"
      >
        <Input
          placeholder="Message the organizer…"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="h-10 flex-1 rounded-full"
          maxLength={2000}
        />
        <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" disabled={!chatInput.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export function EventGuestChat({ eventId }: { eventId: string }) {
  const token = useSelector((s: RootState) => s.auth.token);

  const { data: myInvitationsData } = useGetMyInvitationsQuery(
    { limit: 100, offset: 0 },
    { skip: !token }
  );
  const isInvitedGuest = Boolean(
    myInvitationsData?.items?.some((inv) => inv.event.id === eventId)
  );

  const [getOrCreateThread, { data: currentThread, isFetching: opening }] =
    useLazyGetOrCreateThreadQuery();
  const threadId = currentThread?.id ?? null;

  useEffect(() => {
    if (!eventId || !token || !isInvitedGuest) return;
    getOrCreateThread({ eventId });
  }, [eventId, token, isInvitedGuest, getOrCreateThread]);

  if (!token) {
    return (
      <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <Link
          href={`/auth?mode=signin&redirect=${encodeURIComponent(`/invite/${eventId}?tab=chat&continue=1`)}`}
          className="font-medium text-primary underline"
        >
          Sign in
        </Link>{" "}
        to message the organizer.
      </p>
    );
  }

  if (!isInvitedGuest) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
        Chat is available to invited guests.
      </p>
    );
  }

  if (opening || !threadId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <ChatThread key={threadId} eventId={eventId} threadId={threadId} token={token} />;
}
