"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { useGetDashboardQuery } from "@/lib/api/dashboardApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/eventDateTime";
import { ArrowUpRight, CalendarDays, Plus } from "lucide-react";
import { getInitialsFromName } from "@/lib/user-display";

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "accepted") {
    return "text-emerald-700 dark:text-emerald-300";
  }
  if (s === "declined") {
    return "text-slate-500 dark:text-slate-400";
  }
  return "text-amber-800 dark:text-amber-300";
}

function statusLabel(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "accepted") return "Accepted";
  if (s === "declined") return "Declined";
  return "Pending";
}

export default function DashboardPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: dashboard, isLoading } = useGetDashboardQuery(undefined, {
    skip: !token,
  });

  const firstName = user?.first_name ?? user?.email?.split("@")[0] ?? "there";
  const guestStats = dashboard?.guest_stats ?? null;
  const myRecentRSVPs = dashboard?.my_recent_rsvps ?? [];
  const recentRsvps = dashboard?.recent_rsvps ?? [];
  const upcoming = dashboard?.upcoming_event ?? null;

  const invited = dashboard?.total_invited ?? 0;
  const confirmed = dashboard?.confirmed ?? 0;
  const pending = dashboard?.pending ?? 0;
  const declined = dashboard?.declined ?? 0;
  const acceptRate = invited > 0 ? Math.round((confirmed / invited) * 100) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 pb-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--brand-navy)] dark:text-white sm:text-4xl">
            Hello, {firstName}
          </h1>
          <p className="mt-2 max-w-md text-base text-slate-500 dark:text-slate-400">
            Your events, responses, and invitations — at a glance.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/events/new">
            <Plus className="size-4" />
            New event
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="py-12 text-slate-500">Loading…</p>
      ) : !dashboard ? null : (
        <>
          {upcoming ? (
            <section className="relative overflow-hidden rounded-3xl bg-[var(--brand-navy)] px-6 py-8 text-white sm:px-10 sm:py-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,165,116,0.28),transparent_55%)]" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Next up
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {upcoming.name}
                  </h2>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/70">
                    <CalendarDays className="size-4 opacity-80" />
                    {formatEventDate(upcoming.event_date)}
                  </p>
                </div>
                <Button
                  asChild
                  variant="secondary"
                  className="shrink-0 rounded-xl bg-white text-[var(--brand-navy)] hover:bg-white/90"
                >
                  <Link href={`/events/${upcoming.id}`} className="gap-2">
                    Open event
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-dashed border-slate-300/80 bg-[#fbfaf7] px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                No upcoming events yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Create an event and design an invitation card — guests will see that first.
              </p>
              <Button asChild className="mt-5 rounded-xl" size="sm">
                <Link href="/events/new">Create your first event</Link>
              </Button>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Hosting
              </h2>
              <Link
                href="/events/discover?mine=1"
                className="text-sm font-medium text-[var(--brand-amber)] hover:underline"
              >
                All my events
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Active events", value: dashboard.active_events },
                { label: "Invited", value: invited },
                { label: "Accepted", value: confirmed },
                { label: "Waiting", value: pending },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-[#fbfaf7] px-4 py-5 ring-1 ring-black/[0.05] dark:bg-slate-900/50 dark:ring-white/10"
                >
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            {invited > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Guest responses</span>
                  {acceptRate != null && <span>{acceptRate}% accepted</span>}
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                  {confirmed > 0 && (
                    <div
                      className="bg-emerald-600"
                      style={{ width: `${(confirmed / invited) * 100}%` }}
                    />
                  )}
                  {pending > 0 && (
                    <div
                      className="bg-amber-400"
                      style={{ width: `${(pending / invited) * 100}%` }}
                    />
                  )}
                  {declined > 0 && (
                    <div
                      className="bg-slate-400"
                      style={{ width: `${(declined / invited) * 100}%` }}
                    />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-600" /> Accepted {confirmed}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-400" /> Waiting {pending}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-slate-400" /> Declined {declined}
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Recent responses
                </h2>
                <Link
                  href="/events/discover?mine=1"
                  className="text-sm font-medium text-[var(--brand-amber)] hover:underline"
                >
                  View events
                </Link>
              </div>
              {recentRsvps.length === 0 ? (
                <p className="rounded-2xl bg-[#fbfaf7] px-5 py-8 text-sm text-slate-500 ring-1 ring-black/[0.05] dark:bg-slate-900/50 dark:ring-white/10">
                  No guest responses yet. Share an invitation to get started.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {recentRsvps.slice(0, 6).map((row) => (
                    <li key={`${row.event_id}-${row.guest_name}-${row.response_time}`}>
                      <Link
                        href={`/events/${row.event_id}`}
                        className="flex items-center gap-3 py-3.5 transition hover:opacity-80"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-900">
                          {getInitialsFromName(row.guest_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {row.guest_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.event_name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-xs font-semibold ${statusTone(row.status)}`}>
                            {statusLabel(row.status)}
                          </p>
                          <p className="text-[11px] text-slate-400">{row.response_time}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Your invitations
                </h2>
                <Link
                  href="/invitations"
                  className="text-sm font-medium text-[var(--brand-amber)] hover:underline"
                >
                  All invitations
                </Link>
              </div>

              {guestStats && guestStats.total > 0 && (
                <p className="mb-4 text-sm text-slate-500">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {guestStats.pending}
                  </span>{" "}
                  waiting for a reply ·{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {guestStats.confirmed}
                  </span>{" "}
                  accepted
                </p>
              )}

              {myRecentRSVPs.length === 0 ? (
                <p className="rounded-2xl bg-[#fbfaf7] px-5 py-8 text-sm text-slate-500 ring-1 ring-black/[0.05] dark:bg-slate-900/50 dark:ring-white/10">
                  You haven&apos;t responded to any invitations yet.{" "}
                  <Link href="/events/discover" className="font-medium text-[var(--brand-amber)] hover:underline">
                    Browse events
                  </Link>
                </p>
              ) : (
                <ul className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {myRecentRSVPs.slice(0, 6).map((row) => (
                    <li key={`${row.event_id}-${row.response_time}`}>
                      <Link
                        href={`/invite/${row.event_id}`}
                        className="flex items-center gap-3 py-3.5 transition hover:opacity-80"
                      >
                        <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          <span className="text-[8px] font-semibold uppercase tracking-wider opacity-70">
                            {new Date(`${row.event_date}T12:00:00`).toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </span>
                          <span className="text-sm font-semibold leading-none tabular-nums">
                            {new Date(`${row.event_date}T12:00:00`).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {row.event_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {formatEventDate(row.event_date)}
                          </p>
                        </div>
                        <p className={`shrink-0 text-xs font-semibold ${statusTone(row.status)}`}>
                          {statusLabel(row.status)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
