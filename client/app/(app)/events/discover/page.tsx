"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useGetPublicEventsQuery } from "@/lib/api/eventsApi";
import type { EventResponse } from "@/lib/api/eventsApi";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Tag, MapPin } from "lucide-react";

const PAGE_SIZE = 12;
const FETCH_LIMIT = 200;

const DATE_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "Next 3 months" },
] as const;

function parseEventDate(d: string): Date {
  return new Date(d + "T00:00:00");
}

function inDateRange(eventDate: Date, range: "week" | "month" | "quarter"): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  let end: Date;
  if (range === "week") {
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (range === "month") {
    end = new Date(start);
    end.setMonth(end.getMonth() + 1);
  } else {
    end = new Date(start);
    end.setMonth(end.getMonth() + 3);
  }
  return eventDate >= start && eventDate <= end;
}

function filterEvents(
  events: EventResponse[],
  dateFilter: string,
  tagFilter: string,
  locationFilter: string
): EventResponse[] {
  return events.filter((event) => {
    if (dateFilter && dateFilter !== "all") {
      const d = parseEventDate(event.event_date);
      if (!inDateRange(d, dateFilter as "week" | "month" | "quarter")) return false;
    }
    if (tagFilter && event.event_type !== tagFilter) return false;
    if (locationFilter.trim()) {
      const loc = (event.location || "").toLowerCase();
      if (!loc.includes(locationFilter.trim().toLowerCase())) return false;
    }
    return true;
  });
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";

  const [dateFilter, setDateFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(0);

  const { data: events = [], isLoading } = useGetPublicEventsQuery(
    { search: qFromUrl, limit: FETCH_LIMIT, offset: 0 },
    { skip: false }
  );

  const eventTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.event_type).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(
    () => filterEvents(events, dateFilter, tagFilter === "all" ? "" : tagFilter, locationFilter),
    [events, dateFilter, tagFilter, locationFilter]
  );

  const paginatedEvents = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, page]);

  useEffect(() => setPage(0), [dateFilter, tagFilter, locationFilter]);

  const hasMore = (page + 1) * PAGE_SIZE < filteredEvents.length;
  const hasPrev = page > 0;
  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111418] dark:text-white">
              Discover Events
            </h1>
            <p className="text-[#617589] dark:text-slate-400 text-base mt-1">
              Browse public events. Sign in to create or manage your own.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Date
            </Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Tag className="size-3.5" />
              Type
            </Label>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {eventTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px] max-w-xs">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Location
            </Label>
            <Input
              type="text"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border-[#dbe0e6] dark:border-slate-600"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-[#617589] dark:text-slate-400">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-12 text-center">
            <p className="text-[#617589] dark:text-slate-400">
              {events.length === 0
                ? "No public events yet. Create one when you're signed in!"
                : "No events match your filters. Try adjusting date, type, or location."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#617589] dark:text-slate-400">
              Showing {paginatedEvents.length} of {filteredEvents.length} events
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-[#dbe0e6] dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                <p className="text-sm text-[#617589] dark:text-slate-400">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={!hasPrev}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DiscoverFallback() {
  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111418] dark:text-white">
            Discover Events
          </h1>
          <p className="text-[#617589] dark:text-slate-400 text-base mt-1">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <DiscoverContent />
    </Suspense>
  );
}
