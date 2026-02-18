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
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errors";
import { SeatingChartFloor } from "@/components/events/seating-chart-floor";
import { ArrowLeft, ImageIcon, CheckCircle, XCircle } from "lucide-react";

type AttendanceChoice = "confirmed" | "declined";

export default function EventRsvpPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: event, isLoading: eventLoading, error: eventError } = useGetEventQuery(id, {
    skip: !id || isNaN(id),
  });
  const { data: invitationsData, isLoading: invLoading } = useGetMyInvitationsQuery(
    { limit: 100, offset: 0 },
    { skip: !token }
  );
  const invitations = invitationsData?.items ?? [];
  const myInvitation = invitations.find((inv) => inv.event.id === id);
  const invite = myInvitation?.invite;
  const isInvited = !!myInvitation;

  const { data: seating = [] } = useGetEventSeatingQuery(id, { skip: !id || !token });

  const [attendance, setAttendance] = useState<AttendanceChoice | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [dietary, setDietary] = useState("");

  useEffect(() => {
    if (invite?.status === "confirmed") setAttendance("confirmed");
    else if (invite?.status === "declined") setAttendance("declined");
    else setAttendance(null);
  }, [invite?.status]);
  useEffect(() => {
    if (invite?.seat_id != null) setSelectedSeatId(invite.seat_id);
  }, [invite?.seat_id]);

  const [respondToInvite, { isLoading: isSubmitting, error: submitError }] =
    useRespondToInviteMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendance === null) return;
    respondToInvite({
      eventId: id,
      status: attendance,
      seat_id: attendance === "confirmed" ? selectedSeatId ?? undefined : undefined,
    })
      .unwrap()
      .then(() => {
        setAttendance(attendance);
      })
      .catch(() => {});
  };

  const isLoading = eventLoading || invLoading;
  const notFound = eventError || !event;
  const isPublic = event?.visibility === "public";
  const forbidden = !invLoading && !eventLoading && event && !isPublic && !isInvited;

  if (typeof window !== "undefined" && !token) {
    router.replace(`/auth?mode=signin&redirect=${encodeURIComponent(`/events/${id}/rsvp`)}`);
    return null;
  }

  if (isLoading || (!event && !eventError)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22]">
        <SiteHeader />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22]">
        <SiteHeader />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
          <p className="text-destructive">Event not found.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/events">Back to Events</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22]">
        <SiteHeader />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
          <p className="text-destructive">You don&apos;t have an invitation to this event.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/invitations">View your invitations</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf7] dark:bg-[#0a1a14] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      {/* Full-width banner */}
      {event!.banner_url ? (
        <div
          className="w-full min-h-[320px] md:min-h-[400px] bg-cover bg-center flex flex-col justify-end relative border-b-4 border-double border-[#d4af37]/30"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(6, 78, 59, 0.85) 0%, rgba(6, 78, 59, 0.35) 55%, transparent 100%), url(${event!.banner_url})`,
          }}
        >
          <div className="flex flex-col p-8 md:p-16 items-center text-center">
            <h1 className="text-[#d4af37] tracking-[0.12em] text-3xl md:text-4xl font-normal leading-tight mb-4 font-serif">
              {event!.name}
            </h1>
            <div className="w-20 h-px bg-[#d4af37] mb-4" />
            {event!.message && (
              <p className="text-white/90 text-lg md:text-xl italic max-w-xl">
                {event!.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full min-h-[280px] bg-[#064e3b] dark:bg-emerald-900 flex flex-col justify-end border-b-4 border-double border-[#d4af37]/30">
          <div className="flex flex-col p-8 md:p-12 items-center text-center">
            <div className="size-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <ImageIcon className="size-8 text-white/70" />
            </div>
            <h1 className="text-[#d4af37] tracking-[0.12em] text-2xl md:text-3xl font-normal font-serif">
              {event!.name}
            </h1>
          </div>
        </div>
      )}

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 md:py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/invitations" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3.5" /> Invitations
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium truncate">{event!.name}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">RSVP</span>
        </nav>

        {/* Event details card */}
        <div className="rounded-xl border border-[#d4af37]/20 bg-white dark:bg-[#0f241d] p-6 md:p-8 mb-10 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-medium mb-2">
            When & where
          </p>
          <p className="text-xl font-medium text-slate-900 dark:text-[#d4af37]">
            {event!.event_date} · {event!.start_time}
            {event!.end_time ? ` – ${event!.end_time}` : ""}
          </p>
          {event!.location && (
            <p className="mt-2 text-slate-600 dark:text-slate-400">{event!.location}</p>
          )}
        </div>

        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-slate-900 dark:text-[#d4af37]">
            Kindly Respond
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="h-px w-10 bg-[#d4af37]/50" />
            <p className="text-slate-500 dark:text-slate-400 text-sm italic">
              Your response helps us plan
            </p>
            <div className="h-px w-10 bg-[#d4af37]/50" />
          </div>
        </div>

        <div className="rounded-xl border border-[#d4af37]/20 bg-white dark:bg-[#0f241d] p-6 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#d4af37]/30 rounded-tl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#d4af37]/30 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#d4af37]/30 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#d4af37]/30 rounded-br" />

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <Label className="text-base font-medium uppercase tracking-wider text-center block text-slate-900 dark:text-[#d4af37]">
                Attendance
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`relative flex cursor-pointer border rounded-lg p-6 transition-all duration-200 ${
                    attendance === "confirmed"
                      ? "border-[#064e3b] dark:border-[#d4af37] bg-emerald-50/50 dark:bg-emerald-950/30"
                      : "border-slate-200 dark:border-slate-600 hover:border-[#d4af37]/40"
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
                  <div className="flex flex-col items-center gap-3 w-full">
                    <CheckCircle
                      className={`size-10 ${
                        attendance === "confirmed"
                          ? "text-[#064e3b] dark:text-[#d4af37]"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="font-semibold uppercase tracking-wider text-sm">
                      Joyfully Accepts
                    </span>
                  </div>
                </label>
                <label
                  className={`relative flex cursor-pointer border rounded-lg p-6 transition-all duration-200 ${
                    attendance === "declined"
                      ? "border-[#064e3b] dark:border-[#d4af37] bg-emerald-50/50 dark:bg-emerald-950/30"
                      : "border-slate-200 dark:border-slate-600 hover:border-[#d4af37]/40"
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
                  <div className="flex flex-col items-center gap-3 w-full">
                    <XCircle
                      className={`size-10 ${
                        attendance === "declined"
                          ? "text-[#064e3b] dark:text-[#d4af37]"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="font-semibold uppercase tracking-wider text-sm">
                      Regretfully Declines
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-lg border border-[#d4af37]/20 bg-emerald-50/30 dark:bg-emerald-900/10 gap-4">
              <div className="text-center sm:text-left">
                <p className="font-semibold uppercase tracking-wider text-sm text-slate-900 dark:text-[#d4af37]">
                  Guest accompaniment
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Will you be bringing a guest?
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={plusOne}
                  onChange={(e) => setPlusOne(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="relative inline-block w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-600 peer-checked:bg-[#064e3b] dark:peer-checked:bg-[#d4af37]/30 after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-[#d4af37] after:transition-transform after:content-[''] peer-checked:after:translate-x-6" />
              </label>
            </div>

            {seating.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-[#d4af37] block text-center">
                  {attendance === "confirmed" ? "Choose your seat" : "Seating arrangement"}
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  {attendance === "confirmed"
                    ? "Click an available seat (gray) to reserve it. Assigned seats are green."
                    : "Select &quot;Joyfully Accepts&quot; above to pick a seat."}
                </p>
                <SeatingChartFloor
                  tables={seating}
                  selectable={attendance === "confirmed"}
                  selectedSeatId={selectedSeatId}
                  currentInviteId={invite?.id}
                  onSeatSelect={(seatId) => setSelectedSeatId(selectedSeatId === seatId ? null : seatId)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="dietary"
                className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-[#d4af37]"
              >
                Dietary requirements
              </Label>
              <Textarea
                id="dietary"
                placeholder="Allergies or preferences..."
                rows={3}
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="resize-none border-[#d4af37]/20 focus:border-[#d4af37] dark:border-[#d4af37]/30 bg-transparent"
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive">
                {getErrorMessage(submitError)}
              </p>
            )}

            <div className="pt-4 flex flex-col items-center">
              <Button
                type="submit"
                disabled={attendance === null || isSubmitting}
                className="min-w-[260px] h-12 bg-[#064e3b] hover:bg-[#065f46] text-[#d4af37] border border-[#d4af37]/50 font-semibold uppercase tracking-widest text-xs"
              >
                {isSubmitting ? "Sending…" : "Send response"}
              </Button>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                You can update your response until the event
              </p>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href={`/events/${id}`}>View event details</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
