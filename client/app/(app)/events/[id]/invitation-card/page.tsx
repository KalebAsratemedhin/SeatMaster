"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { InvitationCardWorkspace } from "@/components/events/invitation-card-workspace";
import { Loader2 } from "lucide-react";

function InvitationCardPageInner() {
  const params = useParams();
  const id = params.id as string;
  return <InvitationCardWorkspace eventId={id} />;
}

export default function EventInvitationCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <InvitationCardPageInner />
    </Suspense>
  );
}
