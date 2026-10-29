"use client";

import Link from "next/link";
import type { InvitationWithEventResponse } from "@/lib/api/eventsApi";
import { formatEventDate } from "@/lib/eventDateTime";
import { InvitationCardThumb } from "@/components/events/invitation-card-thumb";
import { ArrowUpRight } from "lucide-react";

type InvitationCardProps = {
  invitation: InvitationWithEventResponse;
};

const statusLabel: Record<string, string> = {
  pending: "No response yet",
  confirmed: "Accepted",
  declined: "Declined",
};

function dateParts(isoDate: string | null | undefined) {
  if (!isoDate) return { day: "—", month: "—" };
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "—", month: "—" };
  return {
    day: d.toLocaleDateString(undefined, { day: "2-digit" }),
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
}

function MiniFallback({ day, month }: { day: string; month: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
      <span className="text-[8px] font-semibold tracking-[0.12em] opacity-70">{month}</span>
      <span className="text-base font-semibold leading-none tabular-nums">{day}</span>
    </div>
  );
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const { event, invite } = invitation;
  const label = statusLabel[invite.status] ?? invite.status;
  const href = `/invite/${event.id}`;
  const { day, month } = dateParts(event.event_date);

  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-2xl bg-[#fbfaf7] p-3.5 ring-1 ring-black/[0.06] transition duration-200 hover:-translate-y-0.5 hover:ring-black/15 dark:bg-slate-900/70 dark:ring-white/10 dark:hover:ring-white/20"
    >
      <div className="relative h-[136px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/10 dark:bg-slate-800 dark:ring-white/10">
        <InvitationCardThumb
          event={event}
          fallback={<MiniFallback day={day} month={month} />}
        />
      </div>

      <div className="min-w-0 flex-1">
        <span
          className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            invite.status === "confirmed"
              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
              : invite.status === "declined"
                ? "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
          }`}
        >
          {label}
        </span>
        <h3 className="font-display truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {event.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
          {formatEventDate(event.event_date)}
        </p>
      </div>

      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:bg-primary dark:bg-white dark:text-slate-900">
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
  );
}
