"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useGetTicketQuery } from "@/lib/api/ticketApi";
import { useGetEventQuery } from "@/lib/api/eventsApi";
import { downloadTicketPng } from "@/lib/renderTicketPng";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Loader2, Download } from "lucide-react";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
);

export default function EventTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const token = useSelector((state: RootState) => state.auth.token);
  const [downloading, setDownloading] = useState(false);

  const { data: ticket, isLoading, error } = useGetTicketQuery(id, {
    skip: !id || !token,
  });
  const { data: event } = useGetEventQuery(id, { skip: !id });

  const handleDownload = async () => {
    if (!ticket || downloading) return;
    setDownloading(true);
    try {
      await downloadTicketPng(
        {
          ...ticket,
          display_event_name: event?.name ?? ticket.event_name,
        },
        `ticket-${event?.name ?? ticket.event_name ?? id}`
      );
    } catch (err) {
      console.error("Ticket download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || (!ticket && !error)) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12">
        <p className="text-destructive text-center">
          Ticket not available. Confirm your RSVP first or check your invitation.
        </p>
        <Button variant="outline" asChild className="mt-6 mx-auto block">
          <Link href={`/events/${id}`}>Back to Event</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <Link href="/events/discover" className="hover:text-primary">
          Events
        </Link>
        <span>/</span>
        <Link href={`/events/${id}`} className="hover:text-primary">
          {ticket.event_name}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-white">Your Ticket</span>
      </nav>

      <div className="flex flex-col items-center gap-6">
        <div className="w-full flex flex-row overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
          <div className="flex-[2.5] flex flex-col px-6 sm:px-8 py-8 border-r border-dashed border-slate-200 dark:border-slate-700">
            <div className="mb-8 flex items-center gap-3">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="size-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {ticket.event_name}
                </p>
                <h4 className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
                  {event?.name ?? ticket.event_name}
                </h4>
              </div>
            </div>
            <div className="mt-auto space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Guest Name
                </p>
                <h2 className="text-3xl font-black text-primary">{ticket.guest_name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Date
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {ticket.event_date}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Time
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {ticket.start_time} - {ticket.end_time}
                  </p>
                </div>
              </div>
              {ticket.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-5 text-primary shrink-0" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {ticket.location}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 px-3 py-6 relative">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around py-4 z-10">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"
                />
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm mb-4">
              <QRCodeSVG
                value={ticket.ticket_id}
                size={96}
                level="M"
                includeMargin={false}
                className="rounded"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400 mb-1">
              Ticket ID
            </p>
            <p className="text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100 break-all text-center">
              #{ticket.ticket_id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-lg gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {downloading ? "Preparing…" : "Download Ticket"}
          </Button>
          <Button variant="outline" asChild className="rounded-lg">
            <Link href={`/events/${id}`}>Back to Event</Link>
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-md">
          Present this ticket (or the QR code) at the entrance. You can save the image to your phone
          or print it.
        </p>
      </div>
    </div>
  );
}
