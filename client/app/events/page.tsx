"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useGetMyEventsQuery,
  useGetMyInvitationsQuery,
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { EventCard } from "@/components/events/event-card";
import { InvitationCard } from "@/components/events/invitation-card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PlusCircle } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [eventsPageSize, setEventsPageSize] = useState(10);
  const [eventsPage, setEventsPage] = useState(0);
  const [invPageSize, setInvPageSize] = useState(10);
  const [invPage, setInvPage] = useState(0);

  const { data: myEventsData, isLoading: myLoading } = useGetMyEventsQuery(
    { limit: eventsPageSize, offset: eventsPage * eventsPageSize },
    { skip: !token }
  );
  const { data: invitationsData, isLoading: invLoading } =
    useGetMyInvitationsQuery(
      { limit: invPageSize, offset: invPage * invPageSize },
      { skip: !token }
    );

  const myEvents = myEventsData?.items ?? [];
  const eventsTotal = myEventsData?.total ?? 0;
  const invitations = invitationsData?.items ?? [];
  const invitationsTotal = invitationsData?.total ?? 0;

  useEffect(() => setEventsPage(0), [eventsPageSize]);
  useEffect(() => setInvPage(0), [invPageSize]);

  useEffect(() => {
    if (typeof token === "string" && !token) {
      router.replace("/auth?mode=signin");
    }
  }, [token, router]);

  if (typeof window !== "undefined" && !token) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <Button asChild className="bg-[#044b36] hover:bg-[#065f46]">
            <Link href="/events/new" className="flex items-center gap-2">
              <PlusCircle className="size-4" />
              Create Event
            </Link>
          </Button>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">My Events</h2>
          {myLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : myEvents.length === 0 ? (
            <p className="text-muted-foreground">
              You haven&apos;t created any events yet.{" "}
              <Link href="/events/new" className="text-[#044b36] dark:text-[#D4AF37] hover:underline">
                Create one
              </Link>
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {eventsTotal > 0 && (
                <div className="mt-6 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
                  <Pagination
                    total={eventsTotal}
                    pageSize={eventsPageSize}
                    page={eventsPage}
                    onPageChange={setEventsPage}
                    onPageSizeChange={setEventsPageSize}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Invitations</h2>
          {invLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : invitations.length === 0 ? (
            <p className="text-muted-foreground">
              You have no event invitations.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invitations.map((inv) => (
                  <InvitationCard key={inv.invite.id} invitation={inv} />
                ))}
              </div>
              {invitationsTotal > 0 && (
                <div className="mt-6 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
                  <Pagination
                    total={invitationsTotal}
                    pageSize={invPageSize}
                    page={invPage}
                    onPageChange={setInvPage}
                    onPageSizeChange={setInvPageSize}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
