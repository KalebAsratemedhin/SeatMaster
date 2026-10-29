"use client";

import { useParams } from "next/navigation";
import { InvitationCardWorkspace } from "@/components/events/invitation-card-workspace";

export default function EventInvitationCardPage() {
  const params = useParams();
  const id = params.id as string;
  return <InvitationCardWorkspace eventId={id} />;
}
