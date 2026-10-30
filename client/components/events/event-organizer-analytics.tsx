"use client";

import type { EventInviteResponse, EventTableResponse } from "@/lib/api/eventsApi";
import { getInitialsFromEmail } from "@/lib/user-display";
import { CheckCircle2, CircleDashed, Sofa, UserX, Users } from "lucide-react";

type EventOrganizerAnalyticsProps = {
  invites: EventInviteResponse[];
  invitesTotal: number;
  seating: EventTableResponse[];
  onOpenInvites?: () => void;
};

function statusCounts(invites: EventInviteResponse[]) {
  let confirmed = 0;
  let declined = 0;
  let pending = 0;
  for (const inv of invites) {
    if (inv.status === "confirmed") confirmed += 1;
    else if (inv.status === "declined") declined += 1;
    else pending += 1;
  }
  return { confirmed, declined, pending };
}

export function EventOrganizerAnalytics({
  invites,
  invitesTotal,
  seating,
  onOpenInvites,
}: EventOrganizerAnalyticsProps) {
  const { confirmed, declined, pending } = statusCounts(invites);
  const sampleNote = invitesTotal > invites.length;
  const responseDenom = confirmed + declined;
  const responseRate =
    invites.length > 0 ? Math.round((confirmed / invites.length) * 100) : 0;
  const rsvpRateAmongResponded =
    responseDenom > 0 ? Math.round((confirmed / responseDenom) * 100) : null;

  const totalSeats = seating.reduce((n, t) => n + (t.seats?.length ?? 0), 0);
  const seatsTaken = seating.reduce(
    (n, t) => n + (t.seats?.filter((s) => Boolean(s.invite_id)).length ?? 0),
    0
  );
  const seatFill = totalSeats > 0 ? Math.round((seatsTaken / totalSeats) * 100) : 0;

  const recent = [...invites]
    .filter((i) => i.status === "confirmed" || i.status === "declined")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const metrics = [
    {
      label: "Invited",
      value: invitesTotal,
      hint: sampleNote ? `Showing breakdown from ${invites.length}` : "All guests on the list",
      icon: Users,
    },
    {
      label: "Confirmed",
      value: confirmed,
      hint: `${responseRate}% of invited`,
      icon: CheckCircle2,
    },
    {
      label: "Awaiting",
      value: pending,
      hint: "No RSVP yet",
      icon: CircleDashed,
    },
    {
      label: "Declined",
      value: declined,
      hint: rsvpRateAmongResponded != null ? `${rsvpRateAmongResponded}% yes of responses` : "—",
      icon: UserX,
    },
    {
      label: "Seats filled",
      value: totalSeats > 0 ? `${seatsTaken}/${totalSeats}` : "—",
      hint: totalSeats > 0 ? `${seatFill}% of chart` : "Add seating to track",
      icon: Sofa,
    },
  ] as const;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Event analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            RSVP and seating snapshot for this event.
          </p>
        </div>
        {onOpenInvites ? (
          <button
            type="button"
            onClick={onOpenInvites}
            className="text-sm font-medium text-primary hover:underline"
          >
            Manage invites
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl bg-card px-4 py-4 ring-1 ring-border"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <m.icon className="size-3.5 shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-foreground">
              {m.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
          </div>
        ))}
      </div>

      {totalSeats > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Seating fill</span>
            <span className="tabular-nums">
              {seatsTaken} / {totalSeats}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${seatFill}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Recent responses</h3>
        {recent.length === 0 ? (
          <p className="rounded-xl bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
            No RSVPs yet — share the invite link to start collecting responses.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl ring-1 ring-border">
            {recent.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                  {getInitialsFromEmail(inv.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    inv.status === "confirmed"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {inv.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
