"use client";

import { useParams } from "next/navigation";
import { EventGuestExperience } from "@/components/events/event-guest-experience";

export default function PublicInviteCardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  return <EventGuestExperience eventId={eventId} />;
}
