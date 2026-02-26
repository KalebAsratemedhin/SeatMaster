"use client";

import Link from "next/link";
import type { InvitationWithEventResponse } from "@/lib/api/eventsApi";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type InvitationCardProps = {
  invitation: InvitationWithEventResponse;
};

const statusLabel: Record<string, string> = {
  pending: "No response yet",
  confirmed: "Accepted",
  declined: "Declined",
};

export function InvitationCard({ invitation }: InvitationCardProps) {
  const { event, invite } = invitation;
  const label = statusLabel[invite.status] ?? invite.status;
  const href = `/events/${event.id}`;

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 overflow-hidden shadow-sm hover:shadow-md hover:border-[#044b36]/30 dark:hover:border-[#D4AF37]/30 transition-all duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${event.banner_url})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <span className="text-4xl font-serif text-slate-400 dark:text-slate-500">
              {event.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              invite.status === "confirmed"
                ? "bg-emerald-500/90 text-white"
                : invite.status === "declined"
                  ? "bg-slate-500/90 text-white"
                  : "bg-amber-500/90 text-white"
            }`}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg leading-tight text-slate-900 dark:text-white group-hover:text-[#044b36] dark:group-hover:text-[#D4AF37] transition-colors">
          {event.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {event.event_type} · {formatEventDate(event.event_date)} · {formatEventTimeRange(event.start_time, event.end_time)}
        </p>
        {event.location && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {event.location}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="text-[#044b36] dark:text-[#D4AF37] hover:bg-[#044b36]/10 dark:hover:bg-[#D4AF37]/10 gap-1"
            asChild
          >
            <span>
              More <ChevronRight className="size-4" />
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
