"use client";

import { useState } from "react";
import { useGetPublicEventsQuery } from "@/lib/api/eventsApi";
import { SiteHeader } from "@/components/layout/site-header";
import { EventCard } from "@/components/events/event-card";
import { Search } from "lucide-react";

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const { data: events = [], isLoading } = useGetPublicEventsQuery(
    { search: submittedSearch, limit: 24, offset: 0 },
    { skip: false }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f8] dark:bg-[#101922] text-[#111418] dark:text-white antialiased">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 py-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
