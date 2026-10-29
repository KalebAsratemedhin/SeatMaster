"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useGetEventQuery,
  useGetInvitationCardQuery,
  useGetMyInvitationsQuery,
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { InvitationCardViewer } from "@/components/events/invitation-card-viewer";
import { EventGuestRsvpForm } from "@/components/events/event-guest-rsvp-form";
import { EventGuestComments } from "@/components/events/event-guest-comments";
import { EventGuestChat } from "@/components/events/event-guest-chat";
import { ArrowRight, Loader2, MessageSquare, MessagesSquare } from "lucide-react";

export type GuestTab = "rsvp" | "comments" | "chat";

function useCardFit(full: boolean) {
  const [fit, setFit] = useState({ maxWidth: full ? 640 : 320, maxHeight: full ? 900 : 480 });

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (full) {
        setFit({
          maxWidth: Math.max(280, vw - 96),
          maxHeight: Math.max(360, vh - 160),
        });
      } else {
        setFit({
          maxWidth: Math.min(320, Math.max(240, vw * 0.35)),
          maxHeight: Math.max(360, vh - 140),
        });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [full]);

  return fit;
}

function GuestExperienceInner({ eventId }: { eventId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector((s: RootState) => s.auth.token);

  const tabParam = searchParams.get("tab");
  const continuedParam = searchParams.get("continue");
  const guestTab: GuestTab =
    tabParam === "comments" || tabParam === "chat" ? tabParam : "rsvp";
  const continued =
    continuedParam !== "0" &&
    (continuedParam === "1" ||
      tabParam === "rsvp" ||
      tabParam === "comments" ||
      tabParam === "chat");

  const fullFit = useCardFit(true);
  const sideFit = useCardFit(false);

  const { data: event, isLoading: eventLoading, error: eventError } = useGetEventQuery(eventId, {
    skip: !eventId,
  });
  const { data: card, isLoading: cardLoading, error: cardError } = useGetInvitationCardQuery(
    eventId,
    { skip: !eventId }
  );
  const { data: invitationsData, isLoading: invLoading } = useGetMyInvitationsQuery(
    { limit: 100, offset: 0 },
    { skip: !token }
  );

  const isInvited = Boolean(invitationsData?.items?.some((inv) => inv.event.id === eventId));
  const loading = eventLoading || cardLoading || (!!token && invLoading);
  const eventErrorStatus =
    eventError && typeof eventError === "object" && "status" in eventError
      ? (eventError as { status?: number }).status
      : undefined;
  const needsAuthForPrivate = eventErrorStatus === 403;
  const isForbidden =
    !!token && !invLoading && !eventLoading && !!event && event.visibility !== "public" && !isInvited;

  const setTab = (tab: GuestTab) => {
    router.replace(`/invite/${eventId}?tab=${tab}&continue=1`, { scroll: false });
  };

  const handleContinue = () => {
    router.replace(`/invite/${eventId}?tab=rsvp&continue=1`, { scroll: false });
  };

  const openFullCard = () => {
    router.replace(`/invite/${eventId}?continue=0`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsAuthForPrivate) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-muted-foreground">
          This event is private. Sign in with the invited account to continue.
        </p>
        <Button asChild>
          <Link href={`/auth?mode=signin&redirect=${encodeURIComponent(`/invite/${eventId}`)}`}>
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-muted-foreground">
          This invitation is not available. It may be private or the event was removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/discover">Browse events</Link>
        </Button>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-destructive">You don&apos;t have an invitation to this event.</p>
        <Button asChild variant="outline">
          <Link href="/invitations">Your invitations</Link>
        </Button>
      </div>
    );
  }

  const cardData = cardError ? null : card;

  if (!continued) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-3 py-6 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          You&apos;re invited
        </p>
        <InvitationCardViewer
          event={event}
          card={cardData}
          maxWidth={fullFit.maxWidth}
          maxHeight={fullFit.maxHeight}
        />
        <button
          type="button"
          onClick={handleContinue}
          className="absolute right-[12%] top-1/2 z-10 -translate-y-1/2 p-2 text-slate-700 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:right-[15%] dark:text-slate-200 dark:hover:text-white"
          aria-label="Continue"
        >
          <ArrowRight className="size-8 sm:size-10" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-1 py-2 sm:px-2 lg:flex-row lg:items-start lg:gap-10 lg:px-4 lg:py-4">
      <aside className="mx-auto w-fit shrink-0 self-start lg:sticky lg:top-2 lg:mx-0 lg:z-10">
        <button
          type="button"
          onClick={openFullCard}
          className="group relative block w-fit cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          aria-label="View invitation card full size"
        >
          <InvitationCardViewer
            event={event}
            card={cardData}
            maxWidth={sideFit.maxWidth}
            maxHeight={sideFit.maxHeight}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium tracking-wide text-white opacity-0 transition group-hover:opacity-100">
            View full size
          </span>
        </button>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 -mx-1 mb-6 bg-[var(--surface-warm)] px-1 pb-3 pt-1 dark:bg-[var(--brand-navy)]">
          <div className="flex gap-1 overflow-x-auto rounded-full bg-black/5 p-1 dark:bg-white/10">
            {(
              [
                ["rsvp", "RSVP", null],
                ["comments", "Comments", <MessageSquare key="c" className="size-3.5" />],
                ["chat", "Chat", <MessagesSquare key="h" className="size-3.5" />],
              ] as const
            ).map(([tab, label, icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  guestTab === tab
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#fbfaf7]/90 p-5 ring-1 ring-black/5 dark:bg-slate-900/60 dark:ring-white/10 sm:p-7">
          {guestTab === "rsvp" && <EventGuestRsvpForm event={event} />}
          {guestTab === "comments" && <EventGuestComments eventId={eventId} />}
          {guestTab === "chat" && <EventGuestChat eventId={eventId} />}
        </div>
      </section>
    </div>
  );
}

export function EventGuestExperience({ eventId }: { eventId: string }) {
  return (
    <div className="text-slate-800 dark:text-white">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <GuestExperienceInner eventId={eventId} />
      </Suspense>
    </div>
  );
}
