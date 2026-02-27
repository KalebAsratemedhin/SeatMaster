"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import {
  useGetEventQuery,
  useGetMyInvitationsQuery,
  useGetEventSeatingQuery,
  useRespondToInviteMutation,
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getErrorMessage } from "@/lib/api/errors";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";
import { SeatingChartFloor } from "@/components/events/seating-chart-floor";
import { ArrowLeft, ImageIcon, CalendarDays, MapPin } from "lucide-react";

type AttendanceChoice = "confirmed" | "declined";

export default function EventRsvpPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: event, isLoading: eventLoading, error: eventError } = useGetEventQuery(id, {
    skip: !id,
  });
  const { data: invitationsData, isLoading: invLoading } = useGetMyInvitationsQuery(
    { limit: 100, offset: 0 },
    { skip: !token }
  );
  const invitations = invitationsData?.items ?? [];
  const myInvitation = invitations.find((inv) => inv.event.id === id);
  const invite = myInvitation?.invite;
  const isInvited = !!myInvitation;

  const { data: seating = [] } = useGetEventSeatingQuery(id, { skip: !id });

  const [attendance, setAttendance] = useState<AttendanceChoice | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [plusOne, setPlusOne] = useState(false);
  const [dietary, setDietary] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const maxSeats = plusOne ? 2 : 1;

  useEffect(() => {
    if (invite?.status === "confirmed") setAttendance("confirmed");
    else if (invite?.status === "declined") setAttendance("declined");
    else setAttendance(null);
  }, [invite?.status]);
  useEffect(() => {
    const ids: string[] = [];
    if (invite?.seat_id != null) ids.push(invite.seat_id);
    if (invite?.guest_seat_id != null) ids.push(invite.guest_seat_id);
    setSelectedSeatIds(ids);
  }, [invite?.seat_id, invite?.guest_seat_id]);
  useEffect(() => {
    if (invite?.guest_seat_id != null) setPlusOne(true);
  }, [invite?.guest_seat_id]);
  useEffect(() => {
    if (!plusOne && selectedSeatIds.length > 1) {
      setSelectedSeatIds((prev) => prev.slice(0, 1));
    }
  }, [plusOne, selectedSeatIds.length]);

  const [respondToInvite, { isLoading: isSubmitting, error: submitError }] =
    useRespondToInviteMutation();

  const handleSeatToggle = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId);
      if (prev.length >= maxSeats) return prev;
      return [...prev, seatId];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendance === null) return;
    if (typeof window !== "undefined" && !token) {
      router.replace(`/auth?mode=signin&redirect=${encodeURIComponent(`/events/${id}/rsvp`)}`);
      return;
    }
    respondToInvite({
      eventId: id,
      status: attendance,
      seat_id: attendance === "confirmed" ? selectedSeatIds[0] ?? undefined : undefined,
      guest_seat_id: attendance === "confirmed" ? selectedSeatIds[1] ?? undefined : undefined,
    })
      .unwrap()
      .then(() => {
        setAttendance(attendance);
        setShowSuccessDialog(true);
      })
      .catch(() => {});
  };

  const isLoading = eventLoading || (!!token && invLoading);
  const notFound = eventError || !event;
  const isPublic = event?.visibility === "public";
  const isForbidden = !!token && !invLoading && !eventLoading && event && !isPublic && !isInvited;
  const isEventPast =
    event?.event_date != null &&
    event.event_date < new Date().toISOString().slice(0, 10);
  const eventErrorStatus = eventError && typeof eventError === "object" && "status" in eventError
    ? (eventError as { status?: number }).status
    : undefined;
  const isPrivateEventRequiresAuth = eventErrorStatus === 403;

  if (isLoading || (!event && !eventError && !isPrivateEventRequiresAuth)) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isPrivateEventRequiresAuth) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">
          This event is private. Sign in with the account that received the invitation to view and respond.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/auth?mode=signin&redirect=${encodeURIComponent(`/events/${id}/rsvp`)}`}>
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <p className="text-destructive">Event not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <p className="text-destructive">You don&apos;t have an invitation to this event.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/invitations">View your invitations</Link>
        </Button>
      </div>
    );
  }

  if (event && isEventPast) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8 md:py-12">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/invitations" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="size-3.5" /> Invitations
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium truncate">{event.name}</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">RSVP</span>
          </nav>
          <div className="rounded-2xl border border-[#d4af37]/25 bg-white dark:bg-[#0d2a21] p-8 md:p-12 shadow-lg text-center">
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              This event has already passed. RSVPs are no longer accepted.
            </p>
            <Button variant="outline" asChild className="mt-6 rounded-xl">
              <Link href={`/events/${id}`}>View event details</Link>
            </Button>
          </div>
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* Hero: compact */}
      {event!.banner_url ? (
        <div
          className="w-full h-[200px] md:h-[240px] bg-cover bg-center flex flex-col justify-end"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%), url(${event!.banner_url})`,
          }}
        >
          <div className="container max-w-3xl mx-auto px-4 pb-5">
            <h1 className="text-white text-2xl md:text-3xl font-semibold drop-shadow-md">
              {event!.name}
            </h1>
            {event!.message && (
              <p className="text-white/90 text-sm mt-1 line-clamp-2">{event!.message}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="container max-w-3xl mx-auto px-4 py-6 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <ImageIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                {event!.name}
              </h1>
              {event!.message && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 line-clamp-1">
                  {event!.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container max-w-3xl mx-auto px-4 py-6 md:py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/invitations"
            className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" /> Invitations
          </Link>
          <span aria-hidden>/</span>
          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px] md:max-w-none">
            {event!.name}
          </span>
          <span aria-hidden>/</span>
          <span className="text-slate-900 dark:text-white font-medium">RSVP</span>
        </nav>

        {invite?.status === "confirmed" && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              You&apos;re confirmed. Get your ticket with QR code for check-in.
            </p>
            <Button asChild size="sm" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href={`/events/${id}/ticket`}>Download ticket</Link>
            </Button>
          </div>
        )}

        {/* When & where: inline strip, no card */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <CalendarDays className="size-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>
              {formatEventDate(event!.event_date)} · {formatEventTimeRange(event!.start_time, event!.end_time)}
            </span>
          </div>
          {event!.location && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="size-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>{event!.location}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Attendance — segmented control */}
          <section>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Will you attend?
            </h2>
            <div
              className="inline-flex p-1 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Attendance"
            >
              <label
                className={`cursor-pointer px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  attendance === "confirmed"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <input
                  type="radio"
                  name="attendance"
                  value="confirmed"
                  checked={attendance === "confirmed"}
                  onChange={() => setAttendance("confirmed")}
                  className="sr-only"
                />
                I&apos;ll be there
              </label>
              <label
                className={`cursor-pointer px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  attendance === "declined"
                    ? "bg-slate-700 dark:bg-slate-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <input
                  type="radio"
                  name="attendance"
                  value="declined"
                  checked={attendance === "declined"}
                  onChange={() => setAttendance("declined")}
                  className="sr-only"
                />
                Can&apos;t make it
              </label>
            </div>
          </section>

          {/* Section: Guest — single row with switch */}
          <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-y border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Bringing a guest?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Optional; only if you&apos;re attending
              </p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={plusOne}
                onChange={(e) => setPlusOne(e.target.checked)}
                className="sr-only peer"
              />
              <span className="relative inline-block w-11 h-6 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-5" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {plusOne ? "Yes" : "No"}
              </span>
            </label>
          </section>

          {/* Section: Seating — heading + chart only */}
          {seating.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {attendance === "confirmed"
                  ? plusOne
                    ? "Choose seats (you + guest)"
                    : "Choose your seat"
                  : "Seating"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {attendance === "confirmed"
                  ? plusOne
                    ? "Select up to two seats."
                    : "Select one seat."
                  : "Accept above to pick a seat."}
              </p>
              <SeatingChartFloor
                tables={seating}
                selectable={attendance === "confirmed"}
                selectedSeatIds={selectedSeatIds}
                currentInviteId={invite?.id}
                onSeatSelect={handleSeatToggle}
              />
            </section>
          )}

          {/* Section: Dietary — label + field */}
          <section>
            <Label
              htmlFor="dietary"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Dietary requirements
            </Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
              Optional
            </p>
            <Textarea
              id="dietary"
              placeholder="Allergies or preferences..."
              rows={3}
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </section>

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              {getErrorMessage(submitError)}
            </p>
          )}

          {/* Submit */}
          <section className="pt-4 flex flex-col items-center gap-3">
            {!token && (
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Sign in or create an account to submit your response.
              </p>
            )}
            <Button
              type="submit"
              disabled={attendance === null || isSubmitting}
              className="w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isSubmitting ? "Sending…" : token ? "Submit response" : "Sign in to respond"}
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can change your response until the event.
            </p>
          </section>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={`/events/${id}`}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View event details →
          </Link>
        </div>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Response received</AlertDialogTitle>
            <AlertDialogDescription>
              Thank you! Your response has been recorded. You can update your RSVP until the event.
              {attendance === "confirmed" && " Get your ticket with QR code for check-in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            {attendance === "confirmed" && (
              <Button asChild className="rounded-lg bg-emerald-600 hover:bg-emerald-700">
                <Link href={`/events/${id}/ticket`} onClick={() => setShowSuccessDialog(false)}>
                  Get your ticket
                </Link>
              </Button>
            )}
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
