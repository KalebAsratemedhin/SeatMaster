"use client";

import Link from "next/link";
import type { EventResponse } from "@/lib/api/eventsApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EventCardProps = {
  event: EventResponse;
  showActions?: boolean;
};

export function EventCard({ event, showActions = true }: EventCardProps) {
  return (
    <Card className="overflow-hidden">
      {event.banner_url ? (
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${event.banner_url})` }}
        />
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center text-muted-foreground text-sm">
          No image
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{event.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {event.event_type} · {event.event_date} {event.start_time}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
              event.visibility === "private"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
            }`}
          >
            {event.visibility}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {event.location && (
          <p className="text-sm text-muted-foreground">{event.location}</p>
        )}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm" variant="default">
              <Link href={`/events/${event.id}`}>View</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
