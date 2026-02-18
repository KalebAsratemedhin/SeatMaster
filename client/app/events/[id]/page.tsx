"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import {
  useGetEventQuery,
  useDeleteEventMutation,
  useGetEventInvitesQuery,
  useInviteToEventMutation,
  useGetEventSeatingQuery,
  useCreateEventTableMutation,
  useDeleteEventTableMutation,
  useReorderEventTablesMutation,
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
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
import { ArrowLeft, Pencil, Trash2, MapPin, Calendar, UserPlus, Users, CheckCircle, Clock, ImageIcon, Table2, Plus, Loader2 } from "lucide-react";
import { SeatingChartFloor } from "@/components/events/seating-chart-floor";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitialsFromEmail } from "@/lib/user-display";

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
  const id = Number(params.id);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: event, isLoading, error } = useGetEventQuery(id, {
    skip: !id || isNaN(id),
  });
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = user && event && event.owner_id === user.id;

  const { data: invitesData } = useGetEventInvitesQuery(
    { eventId: id, limit: 100, offset: 0 },
    { skip: !id || !isOwner || !token }
  );
  const invites = invitesData?.items ?? [];
  const [inviteToEvent, { isLoading: isInviting, error: inviteError }] =
    useInviteToEventMutation();
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: seating = [] } = useGetEventSeatingQuery(id, {
    skip: !id || !token,
  });
  const [createTable, { isLoading: isCreatingTable }] = useCreateEventTableMutation();
  const [deleteTable, { isLoading: isDeletingTable }] = useDeleteEventTableMutation();
  const [reorderTables] = useReorderEventTablesMutation();
  const [newTableCapacity, setNewTableCapacity] = useState(6);
  const [newTableShape, setNewTableShape] = useState<"round" | "rectangular" | "grid">("round");
  const [newTableRows, setNewTableRows] = useState(2);
  const [newTableColumns, setNewTableColumns] = useState(3);

  const seatIdToLabel = (() => {
    const m: Record<number, string> = {};
    for (const t of seating) {
      for (const s of t.seats) {
        m[s.id] = `${t.name} - Seat ${s.label}`;
      }
    }
    return m;
  })();

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
        router.push("/events");
      })
      .catch(() => {});
  };

  if (isLoading || (!event && !error)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22]">
        <SiteHeader />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22]">
        <SiteHeader />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
          <p className="text-destructive">
            Event not found or you don&apos;t have access.
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/events">Back to Events</Link>
          </Button>
        </main>
      </div>
    );
  }

  const formatTime = (t: string) => (t ? t.slice(0, 5) : "");
  const confirmedCount = invites.filter((i) => i.status === "confirmed").length;
  const responseRate =
    invites.length > 0
      ? Math.round((confirmedCount / invites.length) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      {/* Full-width banner */}
      {event.banner_url ? (
        <div
          className="w-full h-48 sm:h-56 md:h-72 lg:h-80 bg-cover bg-center"
          style={{ backgroundImage: `url(${event.banner_url})` }}
        />
      ) : (
        <div className="w-full h-48 sm:h-56 md:h-72 lg:h-80 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 border-b border-slate-200 dark:border-slate-700">
          <div className="size-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <ImageIcon className="size-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No banner image
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Add a banner in event settings for a richer preview
          </p>
        </div>
      )}

      <div className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/events" className="hover:text-foreground transition-colors">
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
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
              {!isOwner && event.visibility === "public" && (
                <div className="mt-6">
                  <Button asChild className="bg-[#044b36] hover:bg-[#065f46] text-white rounded-xl">
                    <Link href={`/events/${id}/rsvp`}>RSVP</Link>
                  </Button>
                </div>
              )}
              {(event.latitude !== 0 || event.longitude !== 0) && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
                  <EventLocationMapDynamic
                    latitude={event.latitude}
                    longitude={event.longitude}
                    location={event.location || undefined}
                    height="280px"
                  />
                </div>
              )}
            </section>

            {isOwner && token && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm">
              <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                  Guest Invitation List
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your event guest list with an elegant emerald touch.
                </p>
              </div>
              <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80">
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="invite-email" className="text-sm font-semibold">
                      Email address
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="guest@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="rounded-lg h-10"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={isInviting || !inviteEmail.trim()}
                      className="bg-[#059669] hover:bg-[#047857] text-white rounded-lg font-semibold flex items-center gap-2 h-10 px-6"
                    >
                      <UserPlus className="size-4" />
                      Add Guest
                    </Button>
                  </div>
                </form>
                {inviteError && (
                  <p className="text-destructive text-sm mt-2">
                    {"data" in inviteError &&
                    typeof (inviteError as { data?: { error?: string } }).data?.error === "string"
                      ? (inviteError as { data: { error: string } }).data.error
                      : "Failed to invite"}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-700/80">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Name
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Email Address
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        RSVP Status
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Seating
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Invited
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/80">
                    {invites.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">
                          No guests invited yet. Add a guest by email above.
                        </td>
                      </tr>
                    ) : (
                      invites.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-[#059669] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                                {getInitialsFromEmail(inv.email)}
                              </div>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {inv.email.split("@")[0]}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {inv.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 text-sm font-medium ${
                                inv.status === "confirmed"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : inv.status === "declined"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              <span
                                className={`size-2 rounded-full shrink-0 ${
                                  inv.status === "confirmed"
                                    ? "bg-emerald-500"
                                    : inv.status === "declined"
                                      ? "bg-rose-500"
                                      : "bg-amber-500"
                                }`}
                              />
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {inv.seat_id != null ? seatIdToLabel[inv.seat_id] ?? `Seat #${inv.seat_id}` : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {invites.length > 0 && invitesData && (
                <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Showing 1 to {invites.length} of {invitesData.total} guests</span>
                </div>
              )}
            </div>
            )}

            {isOwner && token && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm mt-8">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-2xl font-black leading-tight tracking-tight text-[#111418] dark:text-white flex items-center gap-2">
                    <Table2 className="size-6 text-[#10b981]" />
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
                        <select
                          value={newTableShape}
                          onChange={(e) =>
                            setNewTableShape(e.target.value as "round" | "rectangular" | "grid")
                          }
                          className="w-36 rounded-lg h-9 border border-input bg-background px-3 text-sm"
                        >
                          <option value="round">Round</option>
                          <option value="rectangular">Rectangular</option>
                          <option value="grid">Sitting area (grid)</option>
                        </select>
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
                        className="bg-[#10b981] hover:bg-[#059669] h-9 rounded-lg font-bold text-sm"
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
                        if (confirm("Delete this table or sitting area? Seat assignments will be cleared.")) {
                          deleteTable({ eventId: id, tableId }).catch(() => {});
                        }
                      }}
                      onReorder={(orderedTableIds) => {
                        reorderTables({ eventId: id, tableIds: orderedTableIds }).catch(() => {});
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-6">No tables yet. Add one above to build your seating chart.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aside */}
          <aside className="lg:w-80 shrink-0 space-y-5">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm p-5 sticky top-24 space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                  <Calendar className="size-4" />
                </div>
                <span className="text-sm font-medium">{event.event_date}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                  <Clock className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  {formatTime(event.start_time)} – {formatTime(event.end_time)}
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
                  <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                      {invites.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Guests</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-4 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                      {confirmedCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{responseRate}% response rate</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-4 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
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
    </div>
  );
}
