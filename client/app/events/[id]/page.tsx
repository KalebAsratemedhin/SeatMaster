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
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2, MapPin, Calendar, UserPlus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = user && event && event.owner_id === user.id;

  const { data: invites = [] } = useGetEventInvitesQuery(id, {
    skip: !id || !isOwner || !token,
  });
  const [inviteToEvent, { isLoading: isInviting, error: inviteError }] =
    useInviteToEventMutation();
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteToEvent({ eventId: id, email: inviteEmail.trim() })
      .unwrap()
      .then(() => setInviteEmail(""))
      .catch(() => {});
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteEvent(id)
      .unwrap()
      .then(() => router.push("/events"))
      .catch(() => setConfirmDelete(false));
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Events
          </Link>
          {isOwner && token && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/events/${event.id}/edit`}>
                  <Pencil className="size-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {confirmDelete ? "Confirm delete?" : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {event.banner_url ? (
          <div
            className="rounded-xl overflow-hidden h-48 md:h-64 bg-cover bg-center mb-6"
            style={{ backgroundImage: `url(${event.banner_url})` }}
          />
        ) : (
          <div className="rounded-xl h-48 md:h-64 bg-muted flex items-center justify-center text-muted-foreground mb-6">
            No image
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {event.name}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {event.event_type}
                  <span className="mx-2">·</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      event.visibility === "private"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    }`}
                  >
                    {event.visibility}
                  </span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 shrink-0" />
              <span>
                {event.event_date} · {event.start_time} – {event.end_time}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {(event.latitude !== 0 || event.longitude !== 0) && (
              <div className="pt-2">
                <EventLocationMapDynamic
                  latitude={event.latitude}
                  longitude={event.longitude}
                  location={event.location || undefined}
                  height="280px"
                />
              </div>
            )}
            {event.message && (
              <div className="pt-4 border-t">
                <p className="text-sm whitespace-pre-wrap">{event.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isOwner && token && (
          <div className="mt-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-[#111418] dark:text-white">
                Guest Invitation List
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Invite guests by email. They must have an account.
              </p>
            </div>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
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
                    className="rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                    className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2"
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
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Email
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      RSVP Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Invited
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {invites.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No guests invited yet. Add a guest by email above.
                      </td>
                    </tr>
                  ) : (
                    invites.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {inv.email}
                          </span>
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
                              className={`size-2 rounded-full ${
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
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
