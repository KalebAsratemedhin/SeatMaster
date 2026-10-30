"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useGetTicketQuery } from "@/lib/api/ticketApi";
import { useGetEventQuery } from "@/lib/api/eventsApi";
import { downloadTicketPng } from "@/lib/renderTicketPng";
import { useTicketSeatLabels } from "@/lib/ticketSeatLabels";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Armchair, Calendar, Download, Loader2, MapPin } from "lucide-react";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
);

/** Compact ticket shown on the invite RSVP tab after confirmation. */
export function EventGuestTicketPanel({ eventId }: { eventId: string }) {
  const token = useSelector((s: RootState) => s.auth.token);
  const [downloading, setDownloading] = useState(false);
  const { data: ticket, isLoading, isError } = useGetTicketQuery(eventId, {
    skip: !eventId || !token,
  });
  const { data: event } = useGetEventQuery(eventId, { skip: !eventId });
  const seats = useTicketSeatLabels(eventId, ticket);

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-primary/20 bg-primary/5 py-10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
        Ticket is preparing. Refresh in a moment if it doesn&apos;t appear.
      </p>
    );
  }

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadTicketPng(
        {
          ...ticket,
          display_event_name: event?.name ?? ticket.event_name,
          ...seats,
        },
        `ticket-${event?.name ?? ticket.event_name ?? eventId}`
      );
    } catch (err) {
      console.error("Ticket download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Your ticket</h2>
          <p className="text-xs text-slate-500">Ready for check-in — save or show the QR.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download
        </Button>
      </div>

      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="min-w-0 flex-[1.6] space-y-4 border-r border-dashed border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-primary">
                {ticket.event_name}
              </p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {event?.name ?? ticket.event_name}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Guest</p>
            <p className="text-lg font-bold text-primary">{ticket.guest_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{ticket.event_date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {ticket.start_time} – {ticket.end_time}
              </p>
            </div>
          </div>
          {seats.seats_display && (
            <div className="flex items-start gap-2 text-sm">
              <Armchair className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Seat</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{seats.seats_display}</p>
              </div>
            </div>
          )}
          {ticket.location && (
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{ticket.location}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-3 py-4 dark:bg-slate-800/50">
          <div className="mb-2 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-900">
            <QRCodeSVG value={ticket.ticket_id} size={88} level="M" includeMargin={false} />
          </div>
          <p className="font-mono text-[10px] font-bold tracking-wider text-slate-700 dark:text-slate-200">
            #{ticket.ticket_id.slice(0, 8)}
          </p>
        </div>
      </div>
    </section>
  );
}
