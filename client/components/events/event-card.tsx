"use client";

import Link from "next/link";
import type { EventResponse } from "@/lib/api/eventsApi";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type EventCardProps = {
  event: EventResponse;
  showActions?: boolean;
};

export function EventCard({ event, showActions = true }: EventCardProps) {
  const href = `/events/${event.id}`;
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200/80 dark:border-slate-600/50 bg-white dark:bg-slate-800/50 overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--brand-amber)]/30 dark:hover:border-[var(--brand-amber)]/40 transition-all duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${event.banner_url})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <span className="font-display text-4xl text-slate-400 dark:text-slate-500">
              {event.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Dark gradient at bottom of banner for depth; stronger on hover */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span
            className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${
              event.visibility === "private"
                ? "bg-primary/80 text-primary-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {event.visibility}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-lg leading-tight text-slate-900 dark:text-white group-hover:text-[var(--brand-amber)] dark:group-hover:text-[var(--brand-amber)] transition-colors">
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
        {showActions && (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-[var(--brand-amber)] hover:bg-[var(--brand-amber)]/10 dark:hover:bg-[var(--brand-amber)]/20 gap-1 font-semibold"
              asChild
            >
              <span>
                More <ChevronRight className="size-4" />
              </span>
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
}
