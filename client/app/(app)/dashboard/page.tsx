"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useGetDashboardQuery } from "@/lib/api/dashboardApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  Plus,
  UserPlus,
  CalendarDays,
} from "lucide-react";
import { getInitialsFromName } from "@/lib/user-display";

export default function DashboardPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: dashboard, isLoading } = useGetDashboardQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (typeof token === "string" && !token) {
      router.replace("/auth?mode=signin");
    }
  }, [token, router]);

  if (typeof window !== "undefined" && !token) {
    return null;
  }

  const firstName = user?.first_name ?? user?.email?.split("@")[0] ?? "there";
  const responseRate =
    dashboard && dashboard.total_invited > 0
      ? Math.round((dashboard.confirmed / dashboard.total_invited) * 100)
      : 0;
  const donutConfirmed =
    dashboard && dashboard.total_invited > 0
      ? (dashboard.confirmed / dashboard.total_invited) * 502
      : 0;
  const donutPending =
    dashboard && dashboard.total_invited > 0
      ? (dashboard.pending / dashboard.total_invited) * 502
      : 0;
  const donutDeclined =
    dashboard && dashboard.total_invited > 0
      ? (dashboard.declined / dashboard.total_invited) * 502
      : 502;

  const guestStats = dashboard?.guest_stats ?? null;
  const guestTotal = guestStats?.total ?? 0;
  const gConfirmed = guestStats?.confirmed ?? 0;
  const gPending = guestStats?.pending ?? 0;
  const gDeclined = guestStats?.declined ?? 0;
  const donutGuestConfirmed = guestTotal > 0 ? (gConfirmed / guestTotal) * 502 : 0;
  const donutGuestPending = guestTotal > 0 ? (gPending / guestTotal) * 502 : 0;
  const donutGuestDeclined = guestTotal > 0 ? (gDeclined / guestTotal) * 502 : 502;
  const myRecentRSVPs = dashboard?.my_recent_rsvps ?? [];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--brand-navy)] dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-0.5">
            Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="rounded-lg gap-2" asChild>
            <Link href="/events">
              <Download className="size-4 text-[var(--brand-amber)]" />
              Export
            </Link>
          </Button>
          <Button className="rounded-lg gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" asChild>
            <Link href="/events/new">
              <Plus className="size-4" />
              New Event
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8">Loading dashboard...</p>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/15 text-primary rounded-lg">
                  <CalendarDays className="size-5" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Active Events</p>
              <p className="text-2xl font-bold">{dashboard.active_events}</p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg">
                  <UserPlus className="size-5" />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Invited</p>
              <p className="text-2xl font-bold">{dashboard.total_invited}</p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <span className="size-5 rounded-full bg-primary block" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  {responseRate}% rate
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Confirmed</p>
              <p className="text-2xl font-bold">{dashboard.confirmed}</p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <span className="size-5 rounded-full bg-primary/80 block" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  Action req.
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pending RSVP</p>
              <p className="text-2xl font-bold">{dashboard.pending}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm">
              <h3 className="font-display text-lg font-semibold mb-6">Event stats as organizer</h3>
              <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${donutConfirmed} 502`} strokeDashoffset={0} className="text-primary" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${donutPending} 502`} strokeDashoffset={-donutConfirmed} className="text-primary/70" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${donutDeclined} 502`} strokeDashoffset={-donutConfirmed - donutPending} className="text-muted" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold">{dashboard?.total_invited ?? 0}</span>
                    <span className="text-xs text-slate-500 font-medium">Total Guests</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 w-full max-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium text-slate-500">Confirmed</span>
                    </div>
                    <span className="text-sm font-bold">{dashboard?.confirmed ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-primary/70" />
                      <span className="text-sm font-medium text-slate-500">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{dashboard?.pending ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-muted" />
                      <span className="text-sm font-medium text-slate-500">Declined</span>
                    </div>
                    <span className="text-sm font-bold">{dashboard?.declined ?? 0}</span>
                  </div>
                  <Link href="/events" className="text-[var(--brand-amber)] text-xs font-bold hover:underline text-left mt-2">
                    View events
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm">
              <h3 className="font-display text-lg font-semibold mb-6">Event stats as guest</h3>
              <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${donutGuestConfirmed} 502`} strokeDashoffset={0} className="text-primary" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${donutGuestPending} 502`} strokeDashoffset={-donutGuestConfirmed} className="text-primary/70" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${donutGuestDeclined} 502`} strokeDashoffset={-donutGuestConfirmed - donutGuestPending} className="text-muted" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold">{guestTotal}</span>
                    <span className="text-xs text-slate-500 font-medium">My Invitations</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 w-full max-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium text-slate-500">Confirmed</span>
                    </div>
                    <span className="text-sm font-bold">{gConfirmed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-primary/70" />
                      <span className="text-sm font-medium text-slate-500">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{gPending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-muted" />
                      <span className="text-sm font-medium text-slate-500">Declined</span>
                    </div>
                    <span className="text-sm font-bold">{gDeclined}</span>
                  </div>
                  <Link href="/invitations" className="text-[var(--brand-amber)] text-xs font-bold hover:underline text-left mt-2">
                    View invitations
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-2">
              {dashboard.upcoming_event && (
                <div className="bg-primary rounded-xl p-6 text-primary-foreground shadow-lg overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Upcoming Event</p>
                    <h4 className="text-xl font-bold mb-4">{dashboard.upcoming_event.name}</h4>
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <Calendar className="size-5" />
                      <span>{dashboard.upcoming_event.event_date}</span>
                    </div>
                    <Button asChild className="w-full py-2 bg-primary-foreground text-primary rounded-lg text-sm font-bold hover:bg-primary-foreground/90">
                      <Link href={`/events/${dashboard.upcoming_event.id}`}>Manage Event</Link>
                    </Button>
                  </div>
                  <div className="absolute -bottom-10 -right-10 size-40 bg-white/10 rounded-full" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Recent RSVPs</h3>
              <Link href="/events" className="text-sm font-bold text-[var(--brand-amber)] hover:underline transition-colors">
                View All Activity
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Guest Name</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Event</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Plus One</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dashboard.recent_rsvps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                        No recent RSVPs yet.
                      </td>
                    </tr>
                  ) : (
                    dashboard.recent_rsvps.map((row) => (
                      <tr key={row.event_id + row.guest_name + row.response_time}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {getInitialsFromName(row.guest_name)}
                            </div>
                            <span className="text-sm font-medium">{row.guest_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/events/${row.event_id}`} className="hover:text-[var(--brand-amber)]">
                            {row.event_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${
                              row.status === "confirmed"
                                ? "bg-primary text-primary-foreground"
                                : row.status === "declined"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/80 text-primary-foreground"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{row.plus_one}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{row.response_time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Events you recently RSVP&apos;d to</h3>
              <Link href="/invitations" className="text-sm font-bold text-[var(--brand-amber)] hover:underline transition-colors">
                View all invitations
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Event</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Response time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myRecentRSVPs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                        You haven&apos;t RSVP&apos;d to any events yet.
                      </td>
                    </tr>
                  ) : (
                    myRecentRSVPs.map((row) => (
                      <tr key={row.event_id + row.response_time}>
                        <td className="px-6 py-4">
                          <Link href={`/events/${row.event_id}`} className="text-sm font-medium hover:text-[var(--brand-amber)]">
                            {row.event_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.event_date}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${
                              row.status === "confirmed"
                                ? "bg-primary text-primary-foreground"
                                : row.status === "declined"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/80 text-primary-foreground"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{row.response_time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
