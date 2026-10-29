"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useGetPublicEventsQuery,
  useGetMyEventsQuery,
  useGetMyInvitationsQuery,
} from "@/lib/api/eventsApi";
import type { EventResponse } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { EventCard, inviteTagFromStatus } from "@/components/events/event-card";
import type { EventInviteTag } from "@/components/events/event-card";
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
import { Pagination } from "@/components/ui/pagination";
import { Calendar, Tag, MapPin, PlusCircle, User } from "lucide-react";

const PAGE_SIZE_DEFAULT = 12;
const FETCH_LIMIT = 200;

const DATE_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "Next 3 months" },
] as const;

type ScopeFilter = "all" | "mine";

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

export function DiscoverContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const token = useSelector((state: RootState) => state.auth.token);
  const isLoggedIn = !!token;
  const showMine = isLoggedIn && searchParams.get("mine") === "1";
  const scope: ScopeFilter = showMine ? "mine" : "all";

  const [dateFilter, setDateFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  useEffect(() => {
    if (isLoggedIn || searchParams.get("mine") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mine");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [isLoggedIn, pathname, router, searchParams]);

  const { data: publicEvents = [], isLoading: publicLoading } = useGetPublicEventsQuery(
    { search: qFromUrl, limit: FETCH_LIMIT, offset: 0 },
    { skip: showMine }
  );

  const { data: myEventsData, isLoading: myLoading } = useGetMyEventsQuery(
    { limit: FETCH_LIMIT, offset: 0 },
    { skip: !showMine }
  );

  const { data: myInvitationsData } = useGetMyInvitationsQuery(
    { limit: FETCH_LIMIT, offset: 0 },
    { skip: !isLoggedIn }
  );

  const inviteTagByEventId = useMemo(() => {
    const map = new Map<string, EventInviteTag>();
    for (const item of myInvitationsData?.items ?? []) {
      const tag = inviteTagFromStatus(item.invite.status);
      if (tag) map.set(item.event.id, tag);
    }
    return map;
  }, [myInvitationsData]);

  const events = showMine ? (myEventsData?.items ?? []) : publicEvents;
  const isLoading = showMine ? myLoading : publicLoading;

  const eventTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.event_type).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(
    () => filterEvents(events, dateFilter, tagFilter === "all" ? "" : tagFilter, locationFilter),
    [events, dateFilter, tagFilter, locationFilter]
  );

  const paginatedEvents = useMemo(() => {
    const start = page * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, page, pageSize]);

  useEffect(() => setPage(0), [dateFilter, tagFilter, locationFilter, scope, pageSize, qFromUrl]);

  const handleScopeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "mine") params.set("mine", "1");
    else params.delete("mine");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--brand-navy)] dark:text-white">
              Events
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
              {showMine
                ? "Events you have created."
                : isLoggedIn
                  ? "Browse public events or filter to yours."
                  : "Browse public events. Sign in to create or manage your own."}
            </p>
          </div>
          {isLoggedIn && (
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              <Link href="/events/new" className="flex items-center gap-2">
                <PlusCircle className="size-4" />
                Create Event
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 p-4">
          {isLoggedIn && (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="size-3.5" />
                Owner
              </Label>
              <Select value={scope} onValueChange={handleScopeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All public</SelectItem>
                  <SelectItem value="mine">My events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-slate-500 dark:text-slate-400">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600 p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              {events.length === 0
                ? showMine
                  ? (
                    <>
                      You haven&apos;t created any events yet.{" "}
                      <Link href="/events/new" className="text-primary hover:underline">
                        Create one
                      </Link>
                    </>
                  )
                  : "No public events yet. Create one when you're signed in!"
                : "No events match your filters. Try adjusting date, type, or location."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {paginatedEvents.length} of {filteredEvents.length} events
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  inviteTag={inviteTagByEventId.get(event.id) ?? null}
                />
              ))}
            </div>
            {filteredEvents.length > 0 && (
              <div className="mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Pagination
                  total={filteredEvents.length}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function DiscoverFallback() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--brand-navy)] dark:text-white">
            Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
