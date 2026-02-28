"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useGetTicketQuery } from "@/lib/api/ticketApi";
import { useGetEventQuery } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Loader2, Download } from "lucide-react";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
);

export default function EventTicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const token = useSelector((state: RootState) => state.auth.token);
  const ticketRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading, error } = useGetTicketQuery(id, {
    skip: !id || !token,
  });
  const { data: event } = useGetEventQuery(id, { skip: !id });

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const link = document.createElement("a");
    link.download = `ticket-${event?.name ?? id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (typeof window !== "undefined" && !token) {
    router.replace("/auth?mode=signin");
    return null;
  }

  if (isLoading || (!ticket && !error)) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12">
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
    <div className="container max-w-4xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/events" className="hover:text-primary">Events</Link>
          <span>/</span>
          <Link href={`/events/${id}`} className="hover:text-primary">{ticket.event_name}</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">Your Ticket</span>
        </nav>

        <div className="flex flex-col items-center gap-6">
          <div
            ref={ticketRef}
            className="w-full max-w-2xl flex flex-row overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex-[2.5] flex flex-col p-8 border-r border-dashed border-slate-200 dark:border-slate-700">
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
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{ticket.event_date}</p>
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
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{ticket.location}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-6 relative">
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
              <div className="mt-8 transform rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 whitespace-nowrap">
                ADMIT ONE • ADMIT ONE
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Button
              onClick={handleDownload}
              className="rounded-lg gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="size-4" />
              Download Ticket
            </Button>
            <Button variant="outline" asChild className="rounded-lg">
              <Link href={`/events/${id}`}>Back to Event</Link>
            </Button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-md">
            Present this ticket (or the QR code) at the entrance. You can save the image to your phone or print it.
          </p>
        </div>
    </div>
  );
}
