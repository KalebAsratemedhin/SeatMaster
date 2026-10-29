"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import type { EventResponse } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { formatEventDate } from "@/lib/eventDateTime";
import { InvitationCardThumb } from "@/components/events/invitation-card-thumb";
import { ArrowUpRight } from "lucide-react";

export type EventInviteTag = "invited" | "accepted" | "declined";

type EventCardProps = {
  event: EventResponse;
  showActions?: boolean;
  inviteTag?: EventInviteTag | null;
};

const INVITE_TAG_LABEL: Record<EventInviteTag, string> = {
  invited: "Invited",
  accepted: "Accepted",
  declined: "Declined",
};

export function inviteTagFromStatus(status: string | null | undefined): EventInviteTag | null {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "accepted") return "accepted";
  if (s === "declined") return "declined";
  return "invited";
}

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

export function EventCard({ event, showActions = true, inviteTag = null }: EventCardProps) {
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const href =
    userId && event.owner_id === userId ? `/events/${event.id}` : `/invite/${event.id}`;
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
        {inviteTag && (
          <span className="mb-1 inline-flex rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-slate-900">
            {INVITE_TAG_LABEL[inviteTag]}
          </span>
        )}
        <h3 className="font-display truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {event.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
          {formatEventDate(event.event_date)}
        </p>
      </div>

      {showActions && (
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:bg-[var(--brand-amber)] group-hover:text-slate-900 dark:bg-white dark:text-slate-900">
          <ArrowUpRight className="size-4" />
        </span>
      )}
    </Link>
  );
}
