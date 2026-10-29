"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetEventQuery,
  useDeleteEventMutation,
  useGetEventInvitesQuery,
  useGetMyInvitationsQuery,
  useInviteToEventMutation,
  useGetEventSeatingQuery,
  useCreateEventTableMutation,
  useDeleteEventTableMutation,
  useUpdateEventTableMutation,
} from "@/lib/api/eventsApi";
import { useListCommentsQuery, useCreateCommentMutation, type EventCommentResponse } from "@/lib/api/commentsApi";
import {
  useListThreadsQuery,
  useLazyGetOrCreateThreadQuery,
  useListMessagesQuery,
  type EventChatMessageResponse,
} from "@/lib/api/chatApi";
import { useChatWebSocket } from "@/lib/hooks/useChatWebSocket";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, MapPin, Calendar, UserPlus, Users, CheckCircle, Clock, Table2, Plus, Loader2, Share2, MessageSquare, Send, Reply } from "lucide-react";
import { SeatingChartFloor } from "@/components/events/seating-chart-floor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { getInitialsFromEmail, getInitialsFromName } from "@/lib/user-display";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";

const EventLocationMapDynamic = dynamic(
  () =>
    import("@/components/map/event-location-map").then((m) => ({
      default: m.EventLocationMap,
    })),
  { ssr: false }
);

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: event, isLoading, error } = useGetEventQuery(id, {
    skip: !id,
  });
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTableDialogOpen, setDeleteTableDialogOpen] = useState(false);
  const [tableToDeleteId, setTableToDeleteId] = useState<string | null>(null);
  const [guestsPage, setGuestsPage] = useState(0);
  const [guestsPageSize, setGuestsPageSize] = useState(10);
  const [shareCopied, setShareCopied] = useState(false);
  type TabId = "comments" | "chats" | "seating" | "invites";
  const [activeTab, setActiveTab] = useState<TabId>("comments");

  const eventReady = Boolean(event);
  const isOwner = Boolean(user && event && event.owner_id === user.id);

  // Guests / public visitors land on the invitation card first; this page is for organizers.
  useEffect(() => {
    if (!eventReady || !event) return;
    if (isOwner) return;
    router.replace(`/invite/${id}`);
  }, [eventReady, event, isOwner, id, router]);

  const { data: invitesData } = useGetEventInvitesQuery(
    { eventId: id, limit: guestsPageSize, offset: guestsPage * guestsPageSize },
    { skip: !id || !isOwner || !token }
  );
  const { data: myInvitationsData } = useGetMyInvitationsQuery(
    { limit: 100, offset: 0 },
    { skip: !token || !eventReady || isOwner }
  );
  const isInvitedGuest = Boolean(
    myInvitationsData?.items?.some((inv) => inv.event.id === id)
  );
  const invites = invitesData?.items ?? [];
  const invitesTotal = invitesData?.total ?? 0;
  const [inviteToEvent, { isLoading: isInviting, error: inviteError }] =
    useInviteToEventMutation();
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: seating = [] } = useGetEventSeatingQuery(id, {
    skip: !id || !token,
  });
  const [createTable, { isLoading: isCreatingTable }] = useCreateEventTableMutation();
  const [deleteTable, { isLoading: isDeletingTable }] = useDeleteEventTableMutation();
  const [updateEventTable] = useUpdateEventTableMutation();
  const [newTableCapacity, setNewTableCapacity] = useState(6);
  const [newTableShape, setNewTableShape] = useState<"round" | "rectangular" | "grid">("round");
  const [newTableRows, setNewTableRows] = useState(2);
  const [newTableColumns, setNewTableColumns] = useState(3);

  const seatIdToLabel = (() => {
    const m: Record<string, string> = {};
    for (const t of seating) {
      for (const s of t.seats) {
        m[s.id] = `${t.name} - Seat ${s.label}`;
      }
    }
    return m;
  })();

  // Comments (public)
  const { data: commentsData } = useListCommentsQuery(
    { eventId: id, limit: 50, offset: 0 },
    { skip: !id }
  );
  const [createComment, { isLoading: isPostingComment }] = useCreateCommentMutation();
  const [commentBody, setCommentBody] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  type CommentNode = { comment: EventCommentResponse; replies: CommentNode[] };
  const commentTree = useMemo(() => {
    const items = commentsData?.items ?? [];
    const byParent = new Map<string | null, EventCommentResponse[]>();
    byParent.set(null, []);
    for (const c of items) {
      const key = c.parent_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }
    const build = (parentKey: string | null): CommentNode[] =>
      (byParent.get(parentKey) ?? [])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c) => ({ comment: c, replies: build(c.id) }));
    return build(null);
  }, [commentsData?.items]);

  // Chat (private 1:1): owner lists threads; invited guest opens their own thread only
  const { data: chatThreads = [] } = useListThreadsQuery(id, {
    skip: !id || !token || !eventReady || !isOwner,
  });
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [getOrCreateThread, { data: currentThread }] = useLazyGetOrCreateThreadQuery();
  const threadIdForApi = currentThread?.id ?? selectedThreadId;
  const CHAT_PAGE_SIZE = 100;
  const [chatOffset, setChatOffset] = useState(0);
  const { data: messagesData } = useListMessagesQuery(
    {
      eventId: id,
      threadId: threadIdForApi ?? "",
      limit: CHAT_PAGE_SIZE,
      offset: chatOffset,
    },
    { skip: !id || !threadIdForApi || !token }
  );

  // Reset / jump to the latest window when switching threads
  useEffect(() => {
    setChatOffset(0);
  }, [threadIdForApi]);

  useEffect(() => {
    if (!messagesData || chatOffset !== 0) return;
    const total = messagesData.total ?? 0;
    if (total > CHAT_PAGE_SIZE) {
      setChatOffset(total - CHAT_PAGE_SIZE);
    }
  }, [messagesData, chatOffset]);

  const { messages: wsMessages, connected, sendMessage } = useChatWebSocket(
    threadIdForApi,
    token
  );
  const allMessages = useMemo(() => {
    const restMessages = (messagesData?.items ?? []) as EventChatMessageResponse[];
    const seen = new Set(restMessages.map((m) => m.id));
    const fromWs = wsMessages.filter((m) => !seen.has(m.id));
    return [...restMessages, ...fromWs].sort((a, b) => {
      const ta = Date.parse(a.created_at) || 0;
      const tb = Date.parse(b.created_at) || 0;
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
  }, [messagesData?.items, wsMessages]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Guest: open thread only after event role is known and invite is confirmed
  useEffect(() => {
    if (!id || !token || !eventReady || isOwner || !isInvitedGuest) return;
    getOrCreateThread({ eventId: id });
  }, [id, token, eventReady, isOwner, isInvitedGuest, getOrCreateThread]);

  // Owner: select first guest thread when list loads
  useEffect(() => {
    if (!isOwner || selectedThreadId || chatThreads.length === 0) return;
    setSelectedThreadId(chatThreads[0].id);
  }, [isOwner, selectedThreadId, chatThreads]);

  const activeChatPeerName = isOwner
    ? (chatThreads.find((t) => t.id === selectedThreadId) ?? currentThread)?.guest_name ?? "Guest"
    : "Organizer";

  const handlePostComment = (e: React.FormEvent, parentId?: string | null) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createComment({ eventId: id, body: commentBody.trim(), parentId: parentId ?? null })
      .unwrap()
      .then(() => {
        setCommentBody("");
        setReplyingToId(null);
      })
      .catch(() => {});
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteToEvent({ eventId: id, email: inviteEmail.trim() })
      .unwrap()
      .then(() => setInviteEmail(""))
      .catch(() => {});
  };

  const handleConfirmDelete = () => {
    deleteEvent(id)
      .unwrap()
      .then(() => {
        setDeleteDialogOpen(false);
        router.push("/events/discover?mine=1");
      })
      .catch(() => {});
  };

  if (isLoading || (!event && !error)) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <p className="text-destructive">
          Event not found or you don&apos;t have access.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href={token ? "/events/discover" : "/discover"}>
            Back to Events
          </Link>
        </Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening invitation…</p>
      </div>
    );
  }

  const confirmedCount = invites.filter((i) => i.status === "confirmed").length;
  const responseRate =
    invites.length > 0
      ? Math.round((confirmedCount / invites.length) * 100)
      : 0;

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="flex-1 w-full max-w-7xl mx-auto py-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link
                href={token ? "/events/discover" : "/discover"}
                className="hover:text-foreground transition-colors"
              >
                Events
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium truncate">
                {event.name}
              </span>
            </nav>

            <section className="mb-10">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {event.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
                  {event.event_type}
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    event.visibility === "private"
                      ? "bg-primary/10 text-primary"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {event.visibility}
                </span>
              </div>
              {event.message && (
                <p className="mt-6 text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed max-w-2xl">
                  {event.message}
                </p>
              )}
              {(() => {
                const invitePath = `/invite/${id}`;
                const handleShare = () => {
                  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
                    const url = `${window.location.origin}${invitePath}`;
                    navigator.clipboard.writeText(url);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }
                };
                return (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="size-4" />
                      {shareCopied ? "Copied invite link" : "Share invitation"}
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="rounded-xl">
                      <Link href={invitePath}>Preview card</Link>
                    </Button>
                  </div>
                );
              })()}
              {(event.latitude !== 0 || event.longitude !== 0) && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 relative z-0">
                  <EventLocationMapDynamic
                    latitude={event.latitude}
                    longitude={event.longitude}
                    location={event.location || undefined}
                    height="280px"
                  />
                </div>
              )}
            </section>

            {/* Tabbed sections below the map */}
            <div className="mt-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm">
              <div className="flex border-b border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("comments")}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === "comments"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  Comments
                </button>
                {token && (isOwner || currentThread) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("chats")}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "chats"
                        ? "border-primary text-primary bg-primary/10"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    Chat
                  </button>
                )}
                {token && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("seating")}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "seating"
                        ? "border-primary text-primary bg-primary/10"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    Seating arrangement
                  </button>
                )}
                {isOwner && token && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("invites")}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "invites"
                        ? "border-primary text-primary bg-primary/10"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    Invitation list
                  </button>
                )}
              </div>
              <div className="p-0">
                {activeTab === "comments" && (
            <section className="rounded-none border-0 overflow-visible bg-transparent backdrop-blur-none">
              <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="size-5 text-[var(--primary)]" />
                  Comments
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Public comments visible to everyone with access to this event.
                </p>
              </div>
              <div className="p-6 space-y-4">
                {token && (
                  <form onSubmit={(e) => handlePostComment(e)} className="flex gap-3">
                    <Input
                      placeholder="Write a comment..."
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      className="flex-1 rounded-xl"
                      maxLength={2000}
                    />
                    <Button
                      type="submit"
                      disabled={isPostingComment || !commentBody.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shrink-0"
                    >
                      {isPostingComment ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Post
                    </Button>
                  </form>
                )}
                <div className="space-y-3">
                  {commentTree.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No comments yet.</p>
                  ) : (
                    (function renderCommentNodes(nodes: CommentNode[], depth: number) {
                      return nodes.map((node) => (
                        <div key={node.comment.id} className={depth > 0 ? "ml-6 mt-2 border-l-2 border-slate-200/60 dark:border-slate-600 pl-4" : ""}>
                          <div className="flex gap-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-4">
                            <Avatar className="size-9 shrink-0 border border-slate-200/60 dark:border-slate-600">
                              <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium">
                                {getInitialsFromName(node.comment.author)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{node.comment.author}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">{node.comment.body}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(node.comment.created_at).toLocaleString()}
                                </p>
                                {token && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 -ml-1"
                                    onClick={() => { setReplyingToId(node.comment.id); setCommentBody(""); }}
                                  >
                                    <Reply className="size-3.5 mr-1" />
                                    Reply
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          {replyingToId === node.comment.id && token && (
                            <form onSubmit={(e) => handlePostComment(e, node.comment.id)} className="mt-2 flex gap-2 ml-12">
                              <Input
                                placeholder="Write a reply..."
                                value={commentBody}
                                onChange={(e) => setCommentBody(e.target.value)}
                                className="flex-1 rounded-lg text-sm"
                                maxLength={2000}
                                autoFocus
                              />
                              <Button type="submit" disabled={isPostingComment || !commentBody.trim()} size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                                {isPostingComment ? <Loader2 className="size-4 animate-spin" /> : "Reply"}
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => { setReplyingToId(null); setCommentBody(""); }}>Cancel</Button>
                            </form>
                          )}
                          {node.replies.length > 0 && renderCommentNodes(node.replies, depth + 1)}
                        </div>
                      ));
                    })(commentTree, 0)
                  )}
                </div>
              </div>
            </section>
                )}
                {activeTab === "chats" && token && (isOwner || currentThread) && (
                  <section className="flex h-[min(520px,70vh)] min-h-[360px]">
                    {/* Conversation list (owner) */}
                    {isOwner && (
                      <aside className="w-[220px] sm:w-[260px] shrink-0 border-r border-slate-200/80 dark:border-slate-700/80 flex flex-col bg-slate-50/80 dark:bg-slate-900/40">
                        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Guests</p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {chatThreads.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
                          ) : (
                            chatThreads.map((t) => {
                              const active = selectedThreadId === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setSelectedThreadId(t.id)}
                                  className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors border-l-2 ${
                                    active
                                      ? "border-primary bg-primary/10 dark:bg-primary/15"
                                      : "border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                                  }`}
                                >
                                  <Avatar className="size-10 shrink-0 border border-slate-200/70 dark:border-slate-600">
                                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                                      {getInitialsFromName(t.guest_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {t.guest_name}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </aside>
                    )}

                    {/* Message pane */}
                    <div className="flex-1 min-w-0 flex flex-col bg-white/60 dark:bg-slate-900/20">
                      {threadIdForApi ? (
                        <>
                          <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80 shrink-0">
                            <Avatar className="size-9 shrink-0 border border-slate-200/70 dark:border-slate-600">
                              <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs font-semibold">
                                {getInitialsFromName(activeChatPeerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {activeChatPeerName}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span
                                  className={`size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`}
                                />
                                {connected ? "Online" : "Connecting…"}
                              </p>
                            </div>
                          </header>

                          <div
                            ref={chatScrollRef}
                            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col-reverse"
                          >
                            {/* col-reverse anchors the thread to the composer; list stays oldest→newest */}
                            <div className="flex flex-col gap-3">
                              {allMessages.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-10">
                                  No messages yet.
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
                                        <Avatar className="size-8 shrink-0 border border-slate-200/60 dark:border-slate-600 self-end">
                                          <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                            {getInitialsFromName(activeChatPeerName)}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      <div
                                        className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}
                                      >
                                        <div
                                          className={`rounded-2xl px-3.5 py-2 text-sm ${
                                            isMe
                                              ? "bg-primary text-primary-foreground rounded-br-md"
                                              : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md"
                                          }`}
                                        >
                                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                          {new Date(m.created_at).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <form
                            onSubmit={handleSendChat}
                            className="shrink-0 flex items-center gap-2 px-3 py-3 border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/50"
                          >
                            <Input
                              placeholder="Message…"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              className="flex-1 rounded-full h-10"
                              maxLength={2000}
                            />
                            <Button
                              type="submit"
                              size="icon"
                              disabled={!chatInput.trim() || !connected}
                              className="rounded-full size-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                              aria-label="Send"
                            >
                              <Send className="size-4" />
                            </Button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center px-6">
                          <p className="text-sm text-muted-foreground text-center">
                            {isOwner ? "Select a guest to open the chat." : "Opening chat…"}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
                {activeTab === "seating" && token && (
                  isOwner ? (
                  <div className="rounded-none border-0 overflow-visible bg-transparent backdrop-blur-none">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-2xl font-black leading-tight tracking-tight text-[#111418] dark:text-white flex items-center gap-2">
                    <Table2 className="size-6 text-[var(--primary)]" />
                    Seating Arrangement
                  </h2>
                  <p className="text-[#617589] text-sm mt-1">
                    Add tables or sitting areas below; guests can pick a seat when they RSVP.
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-end gap-4 mb-6">
                    <form
                      className="flex flex-wrap items-end gap-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const body =
                          newTableShape === "grid"
                            ? { shape: "grid" as const, rows: newTableRows, columns: newTableColumns }
                            : { shape: newTableShape, capacity: newTableCapacity };
                        createTable({ eventId: id, body })
                          .unwrap()
                          .then(() => {
                            setNewTableCapacity(6);
                            setNewTableShape("round");
                            setNewTableRows(2);
                            setNewTableColumns(3);
                          })
                          .catch(() => {});
                      }}
                    >
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Arrangement</Label>
                        <Select
                          value={newTableShape}
                          onValueChange={(v) =>
                            setNewTableShape(v as "round" | "rectangular" | "grid")
                          }
                        >
                          <SelectTrigger className="w-36 rounded-lg h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round">Round</SelectItem>
                            <SelectItem value="rectangular">Rectangular</SelectItem>
                            <SelectItem value="grid">Sitting area (grid)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newTableShape === "grid" ? (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Rows</Label>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={newTableRows}
                              onChange={(e) =>
                                setNewTableRows(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)))
                              }
                              className="w-16 rounded-lg h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Columns</Label>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={newTableColumns}
                              onChange={(e) =>
                                setNewTableColumns(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)))
                              }
                              className="w-16 rounded-lg h-9"
                            />
                          </div>
                          <span className="text-xs text-[#617589] self-center">
                            {newTableRows * newTableColumns} seats
                          </span>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Capacity</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={newTableCapacity}
                            onChange={(e) =>
                              setNewTableCapacity(parseInt(e.target.value, 10) || 6)
                            }
                            className="w-20 rounded-lg h-9"
                          />
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={
                          isCreatingTable ||
                          (newTableShape === "grid" &&
                            (newTableRows < 1 || newTableColumns < 1 ||
                              newTableRows > 100 || newTableColumns > 100))
                        }
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-lg font-bold text-sm"
                      >
                        {isCreatingTable ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                        Add Table
                      </Button>
                    </form>
                  </div>
                  {seating.length > 0 ? (
                    <SeatingChartFloor
                      tables={seating}
                      showDelete
                      onDeleteTable={(tableId) => {
                        setTableToDeleteId(tableId);
                        setDeleteTableDialogOpen(true);
                      }}
                      onPositionChange={(tableId, x, y) => {
                        updateEventTable({
                          eventId: id,
                          tableId,
                          body: { position_x: x, position_y: y },
                        }).catch(() => {});
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-6">No tables yet. Add one above to build your seating chart.</p>
                  )}
                </div>
              </div>
                  ) : (
                  <div className="px-6 py-8">
                    <p className="text-sm text-muted-foreground mb-4">View the seating chart when you RSVP to choose your seat.</p>
                    {seating.length > 0 ? (
                      <SeatingChartFloor tables={seating} showDelete={false} />
                    ) : (
                      <p className="text-sm text-muted-foreground">No seating arrangement for this event yet.</p>
                    )}
                  </div>
                  )
                )}
                {activeTab === "invites" && isOwner && token && (
              <div className="rounded-none border-0 overflow-visible bg-transparent backdrop-blur-none">
                <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                    Guest Invitation List
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your event guest list.
                  </p>
                </div>
                <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80">
                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="invite-email" className="text-sm font-semibold">Email address</Label>
                      <Input id="invite-email" type="email" placeholder="guest@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="rounded-lg h-10" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={isInviting || !inviteEmail.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold flex items-center gap-2 h-10 px-6">
                        <UserPlus className="size-4" /> Add Guest
                      </Button>
                    </div>
                  </form>
                  {inviteError && <p className="text-destructive text-sm mt-2">{"data" in inviteError && typeof (inviteError as { data?: { error?: string } }).data?.error === "string" ? (inviteError as { data: { error: string } }).data.error : "Failed to invite"}</p>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-700/80">
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">RSVP Status</th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seating</th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/80">
                      {invites.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">No guests invited yet. Add a guest by email above.</td></tr>
                      ) : invites.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">{getInitialsFromEmail(inv.email)}</div>
                              <span className="font-medium text-slate-900 dark:text-slate-100">{inv.email.split("@")[0]}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{inv.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 text-sm font-medium ${inv.status === "confirmed" ? "text-primary" : inv.status === "declined" ? "text-muted-foreground" : "text-primary/90"}`}>
                              <span className={`size-2 rounded-full shrink-0 ${inv.status === "confirmed" ? "bg-primary" : inv.status === "declined" ? "bg-muted" : "bg-primary/70"}`} />
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{inv.seat_id != null ? seatIdToLabel[inv.seat_id] ?? `Seat #${inv.seat_id}` : "—"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {invitesTotal > 0 && (
                  <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-700/80">
                    <Pagination total={invitesTotal} pageSize={guestsPageSize} page={guestsPage} onPageChange={setGuestsPage} onPageSizeChange={(v) => { setGuestsPageSize(v); setGuestsPage(0); }} />
                  </div>
                )}
              </div>
            )}
              </div>
            </div>
          </div>

          {/* Aside - single sticky container so stat cards don't scroll */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-5">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                  <Calendar className="size-4" />
                </div>
                <span className="text-sm font-medium">{formatEventDate(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                  <Clock className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  {formatEventTimeRange(event.start_time, event.end_time)}
                </span>
              </div>
              {event.location && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{event.location}</span>
                </div>
              )}
              {isOwner && token && (
                <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full rounded-xl">
                    <Link href={`/events/${event.id}/invitation-card`}>
                      <Share2 className="size-4 mr-2" />
                      Invitation card
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full rounded-xl">
                    <Link href={`/events/${event.id}/edit`}>
                      <Pencil className="size-4 mr-2" />
                      Edit Event
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="w-full rounded-xl"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Event
                  </Button>
                </div>
              )}
            </div>

            {isOwner && token && (
              <div className="space-y-2">
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-4 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                      {invites.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Guests</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-4 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                      {confirmedCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{responseRate}% response rate</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-4 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="size-4 text-primary/80" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                      {invites.length - confirmedCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending RSVP</p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </aside>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{event.name}&quot; and cannot be undone. All guest invitations and data for this event will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTableDialogOpen} onOpenChange={(open) => { setDeleteTableDialogOpen(open); if (!open) setTableToDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete table or sitting area?</AlertDialogTitle>
            <AlertDialogDescription>
              Seat assignments for this table or sitting area will be cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTable}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingTable || tableToDeleteId == null}
              onClick={() => {
                if (tableToDeleteId != null) {
                  deleteTable({ eventId: id, tableId: tableToDeleteId })
                    .then(() => { setDeleteTableDialogOpen(false); setTableToDeleteId(null); })
                    .catch(() => {});
                }
              }}
            >
              {isDeletingTable ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
