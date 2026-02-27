"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useGetMyInvitationsQuery } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { InvitationCard } from "@/components/events/invitation-card";
import { Button } from "@/components/ui/button";
import { Calendar, Ticket, ChevronRight } from "lucide-react";
import { formatEventDate } from "@/lib/eventDateTime";

export default function GuestDashboardPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading } = useGetMyInvitationsQuery(
    { limit: 20, offset: 0 },
    { skip: !token }
  );

  useEffect(() => {
    if (typeof token === "string" && !token) {
      router.replace("/auth?mode=signin");
    }
  }, [token, router]);

  if (typeof window !== "undefined" && !token) {
    return null;
  }

  const invitations = data?.items ?? [];
  const firstName = user?.first_name ?? user?.email?.split("@")[0] ?? "there";
  const pending = invitations.filter((i) => i.invite.status === "pending");
  const confirmed = invitations.filter((i) => i.invite.status === "confirmed");
  const upcoming = [...invitations]
    .filter((i) => i.invite.status !== "declined")
    .sort(
      (a, b) =>
        new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime()
    )
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111418] dark:text-white">
            Guest dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-0.5">
            Welcome, {firstName}. Here are your event invitations and tickets.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg gap-2" asChild>
          <Link href="/events/discover">Discover events</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                  <Calendar className="size-5" />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                Total invitations
              </p>
              <p className="text-2xl font-bold">{invitations.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                  <span className="size-5 rounded-full bg-amber-500 block" />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                Pending RSVP
              </p>
              <p className="text-2xl font-bold">{pending.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <Ticket className="size-5" />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                Confirmed
              </p>
              <p className="text-2xl font-bold">{confirmed.length}</p>
            </div>
          </div>

          {pending.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
              <h3 className="text-lg font-bold mb-4">Action required</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                You have {pending.length} invitation{pending.length !== 1 ? "s" : ""} waiting for your
                response.
              </p>
              <div className="flex flex-wrap gap-3">
                {pending.slice(0, 3).map((inv) => (
                  <Button key={inv.invite.id} size="sm" asChild>
                    <Link href={`/events/${inv.event.id}/rsvp`}>
                      RSVP – {inv.event.name}
                      <ChevronRight className="size-4 ml-1" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold">Your invitations</h3>
              <Link
                href="/invitations"
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View all
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                <p className="mb-4">You don&apos;t have any invitations yet.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/events/discover">Discover events</Link>
                </Button>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((inv) => (
                  <div key={inv.invite.id} className="contents">
                    <InvitationCard invitation={inv} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {confirmed.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold">Get your ticket</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Download your ticket with QR code for confirmed events.
                </p>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {confirmed.slice(0, 5).map((inv) => (
                  <li key={inv.invite.id}>
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div>
                        <p className="font-medium">{inv.event.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatEventDate(inv.event.event_date)}
                        </p>
                      </div>
                      <Button size="sm" className="gap-2" asChild>
                        <Link href={`/events/${inv.event.id}/ticket`} className="flex items-center gap-2">
                          <Ticket className="size-4" />
                          Download ticket
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
