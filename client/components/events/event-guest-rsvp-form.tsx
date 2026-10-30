"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetEventSeatingQuery,
  useGetMyInvitationsQuery,
  useRespondToInviteMutation,
  type EventResponse,
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errors";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";
import { SeatingChartFloor } from "@/components/events/seating-chart-floor";
import { EventGuestTicketPanel } from "@/components/events/event-guest-ticket-panel";
import { ticketApi } from "@/lib/api/ticketApi";
import { CalendarDays, MapPin } from "lucide-react";
import { toast } from "sonner";

const EventLocationMapDynamic = dynamic(
  () =>
    import("@/components/map/event-location-map").then((m) => ({
      default: m.EventLocationMap,
    })),
  { ssr: false }
);

type AttendanceChoice = "confirmed" | "declined";

function RsvpFormFields({
  event,
  inviteId,
  inviteStatus,
  initialSeatIds,
  initialPlusOne,
}: {
  event: EventResponse;
  inviteId?: string;
  inviteStatus?: string;
  initialSeatIds: string[];
  initialPlusOne: boolean;
}) {
  const id = event.id;
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const { data: seating = [] } = useGetEventSeatingQuery(id, { skip: !id });

  const [attendance, setAttendance] = useState<AttendanceChoice | null>(() => {
    if (inviteStatus === "confirmed") return "confirmed";
    if (inviteStatus === "declined") return "declined";
    return null;
  });
  const [selectedSeatIds, setSelectedSeatIds] = useState(initialSeatIds);
  const [plusOne, setPlusOne] = useState(initialPlusOne);
  const [dietary, setDietary] = useState("");
  const [justConfirmed, setJustConfirmed] = useState(false);
  const maxSeats = plusOne ? 2 : 1;
  const showTicket = inviteStatus === "confirmed" || justConfirmed;

  const [respondToInvite, { isLoading: isSubmitting, error: submitError }] =
    useRespondToInviteMutation();

  const handlePlusOneChange = (next: boolean) => {
    setPlusOne(next);
    if (!next) setSelectedSeatIds((prev) => prev.slice(0, 1));
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) return prev.filter((x) => x !== seatId);
      if (prev.length >= maxSeats) return prev;
      return [...prev, seatId];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendance === null) return;
    if (!token) {
      router.replace(
        `/auth?mode=signin&redirect=${encodeURIComponent(`/invite/${id}?tab=rsvp`)}`
      );
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
        if (attendance === "confirmed") {
          setJustConfirmed(true);
          dispatch(ticketApi.util.invalidateTags([{ type: "Ticket", id }]));
          toast.success("Confirmed");
        } else {
          setJustConfirmed(false);
          toast.success("Saved");
        }
      })
      .catch(() => {});
  };

  const isEventPast =
    event.event_date != null && event.event_date < new Date().toISOString().slice(0, 10);

  if (isEventPast) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
        This event has already passed. RSVPs are no longer accepted.
      </p>
    );
  }

  const hasCoords = event.latitude != null && event.longitude != null
    && (event.latitude !== 0 || event.longitude !== 0);

  return (
    <>
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {event.name}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {event.event_date && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatEventDate(event.event_date)}
              {formatEventTimeRange(event.start_time, event.end_time)
                ? ` · ${formatEventTimeRange(event.start_time, event.end_time)}`
                : ""}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-slate-400" />
              {event.location}
            </span>
          )}
        </div>
        {event.message && (
          <p className="whitespace-pre-wrap pt-1 text-sm text-slate-600 dark:text-slate-300">
            {event.message}
          </p>
        )}
      </div>

      {hasCoords && (
        <section className="mb-7">
          <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Where</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <EventLocationMapDynamic
              latitude={event.latitude!}
              longitude={event.longitude!}
              location={event.location || undefined}
              height="220px"
            />
          </div>
        </section>
      )}

      {!token && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>Sign in to submit your RSVP.</p>
          <Button asChild size="sm" className="shrink-0">
            <Link
              href={`/auth?mode=signin&redirect=${encodeURIComponent(`/invite/${id}?tab=rsvp`)}`}
            >
              Sign in
            </Link>
          </Button>
        </div>
      )}

      {showTicket && token && (
        <div className="mb-7">
          <EventGuestTicketPanel eventId={id} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Will you attend?
          </h2>
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-200 p-1 dark:border-slate-700 dark:bg-slate-800"
            role="group"
            aria-label="Attendance"
          >
            <label
              className={`cursor-pointer rounded-md px-5 py-2.5 text-sm font-medium transition-colors ${
                attendance === "confirmed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
              className={`cursor-pointer rounded-md px-5 py-2.5 text-sm font-medium transition-colors ${
                attendance === "declined"
                  ? "bg-muted text-muted-foreground shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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

        <section className="flex flex-col gap-3 border-y border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Bringing a guest?
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Optional if you&apos;re attending</p>
          </div>
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={plusOne}
              onChange={(e) => handlePlusOneChange(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative inline-block h-6 w-11 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5 dark:bg-slate-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {plusOne ? "Yes" : "No"}
            </span>
          </label>
        </section>

        {seating.length > 0 && (
          <section>
            <h2 className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              {attendance === "confirmed"
                ? plusOne
                  ? "Choose seats (you + guest)"
                  : "Choose your seat"
                : "Seating"}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
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
              currentInviteId={inviteId}
              onSeatSelect={handleSeatSelect}
            />
          </section>
        )}

        <section>
          <Label htmlFor="dietary" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Dietary requirements
          </Label>
          <p className="mb-2 mt-0.5 text-xs text-slate-500">Optional</p>
          <Textarea
            id="dietary"
            placeholder="Allergies or preferences..."
            rows={3}
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className="mt-1 w-full resize-none rounded-lg"
          />
        </section>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {getErrorMessage(submitError)}
          </p>
        )}

        <section className="flex flex-col items-start gap-2 pt-1">
          <Button type="submit" disabled={attendance === null || isSubmitting} className="min-w-[180px]">
            {isSubmitting ? "Sending…" : token ? "Submit response" : "Sign in to respond"}
          </Button>
          <p className="text-xs text-slate-500">You can change your response until the event.</p>
        </section>
      </form>
    </>
  );
}

export function EventGuestRsvpForm({ event }: { event: EventResponse }) {
  const token = useSelector((s: RootState) => s.auth.token);
  const { data: invitationsData } = useGetMyInvitationsQuery(
    { limit: 100, offset: 0 },
    { skip: !token }
  );
  const invite = invitationsData?.items?.find((inv) => inv.event.id === event.id)?.invite;
  const initialSeatIds: string[] = [];
  if (invite?.seat_id != null) initialSeatIds.push(invite.seat_id);
  if (invite?.guest_seat_id != null) initialSeatIds.push(invite.guest_seat_id);

  return (
    <RsvpFormFields
      key={`${invite?.id ?? "none"}:${invite?.status ?? ""}:${invite?.seat_id ?? ""}:${invite?.guest_seat_id ?? ""}`}
      event={event}
      inviteId={invite?.id}
      inviteStatus={invite?.status}
      initialSeatIds={initialSeatIds}
      initialPlusOne={invite?.guest_seat_id != null}
    />
  );
}
