"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Legacy RSVP URL — guests now use the unified invite experience. */
function RsvpRedirect() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (!id) return;
    const q = new URLSearchParams();
    q.set("continue", "1");
    if (tab === "comments" || tab === "chat" || tab === "rsvp") q.set("tab", tab);
    else q.set("tab", "rsvp");
    router.replace(`/invite/${id}?${q.toString()}`);
  }, [id, tab, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Opening invitation…
    </div>
  );
}

export default function EventRsvpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RsvpRedirect />
    </Suspense>
  );
}
