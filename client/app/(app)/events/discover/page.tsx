"use client";

import { useState, useEffect } from "react";
import { useGetPublicEventsQuery } from "@/lib/api/eventsApi";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25];

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: events = [], isLoading } = useGetPublicEventsQuery(
    { search: submittedSearch, limit: pageSize, offset: page * pageSize },
    { skip: false }
  );

  useEffect(() => setPage(0), [pageSize, submittedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  const hasMore = events.length === pageSize;
  const hasPrev = page > 0;

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

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex flex-1 max-w-md items-stretch rounded-lg overflow-hidden border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-center pl-4 text-[#617589]">
              <Search className="size-5" />
            </div>
            <input
              type="search"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 border-0 bg-transparent px-4 py-3 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-sm font-bold transition-colors"
          >
            Search
          </button>
        </form>

        {isLoading ? (
          <p className="text-[#617589] dark:text-slate-400">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-12 text-center">
            <p className="text-[#617589] dark:text-slate-400">
              {submittedSearch
                ? "No public events match your search."
                : "No public events yet. Create one when you're signed in!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {events.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-[#dbe0e6] dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#617589] dark:text-slate-400">Per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="w-[72px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
