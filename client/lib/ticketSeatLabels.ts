import { useMemo } from "react";
import {
  useGetEventSeatingQuery,
  useGetMyInvitationsQuery,
  type EventTableResponse,
} from "@/lib/api/eventsApi";
import type { TicketResponse } from "@/lib/api/ticketApi";

export type TicketSeatLabels = {
  seat_label?: string;
  guest_seat_label?: string;
  /** Single line for ticket UI / PNG, e.g. "Table 1 · Seat A". */
  seats_display?: string;
};

function labelForSeat(tables: EventTableResponse[], seatId: string | null | undefined): string | undefined {
  if (!seatId) return undefined;
  for (const t of tables) {
    const seat = t.seats.find((s) => s.id === seatId);
    if (seat) return `${t.name} · Seat ${seat.label}`;
  }
  return undefined;
}

function labelsForInviteId(tables: EventTableResponse[], inviteId: string | undefined): string[] {
  if (!inviteId) return [];
  const labels: string[] = [];
  for (const t of tables) {
    for (const s of t.seats) {
      if (s.invite_id === inviteId) labels.push(`${t.name} · Seat ${s.label}`);
    }
  }
  return labels;
}

type TicketWithOptionalSeats = TicketResponse & {
  seat_label?: string | null;
  guest_seat_label?: string | null;
};

/** Resolve seat labels: prefer ticket API fields (REQ-005), else seating chart + invite. */
export function useTicketSeatLabels(
  eventId: string | undefined,
  ticket?: TicketWithOptionalSeats | null
): TicketSeatLabels {
  const { data: seating = [] } = useGetEventSeatingQuery(eventId ?? "", {
    skip: !eventId,
  });
  const { data: invitations } = useGetMyInvitationsQuery(
    { limit: 200, offset: 0 },
    { skip: !eventId }
  );

  return useMemo(() => {
    if (!eventId) return {};

    // REQ-005 fields when backend ships them
    if (ticket?.seat_label || ticket?.guest_seat_label) {
      const parts = [ticket.seat_label, ticket.guest_seat_label].filter(Boolean) as string[];
      return {
        seat_label: ticket.seat_label || undefined,
        guest_seat_label: ticket.guest_seat_label || undefined,
        seats_display: parts.length ? parts.join(" · ") : undefined,
      };
    }

    // Prefer seating seats tagged with this ticket/invite id (ticket_id === invite id)
    const fromChart = labelsForInviteId(seating, ticket?.ticket_id);
    if (fromChart.length) {
      return {
        seat_label: fromChart[0],
        guest_seat_label: fromChart[1],
        seats_display: fromChart.join(" · "),
      };
    }

    const row = invitations?.items?.find((i) => i.event.id === eventId);
    const invite = row?.invite;
    if (!invite) return {};
    const seat_label = labelForSeat(seating, invite.seat_id);
    const guest_seat_label = labelForSeat(seating, invite.guest_seat_id);
    const parts = [seat_label, guest_seat_label].filter(Boolean) as string[];
    return {
      seat_label,
      guest_seat_label,
      seats_display: parts.length ? parts.join(" · ") : undefined,
    };
  }, [eventId, invitations?.items, seating, ticket]);
}
