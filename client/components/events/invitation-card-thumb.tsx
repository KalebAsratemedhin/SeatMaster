"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  useGetInvitationCardQuery,
  type EventResponse,
} from "@/lib/api/eventsApi";
import { CARD_ARTBOARD, parseCardDocument } from "@/lib/invitationCardDocument";
import { ensureInvitationFontsLoaded } from "@/lib/invitationCardFonts";
import { loadInvitationOntoCanvas } from "@/lib/loadInvitationOntoCanvas";
import { Loader2 } from "lucide-react";

const thumbCache = new Map<string, string>();
const RENDER_MULTIPLIER = 0.5;

function cacheKey(eventId: string, stamp: string) {
  return `${eventId}:${stamp}:m${RENDER_MULTIPLIER}`;
}

async function renderPreviewDataUrl(
  event: EventResponse,
  card: Parameters<typeof loadInvitationOntoCanvas>[2]
): Promise<string> {
  await ensureInvitationFontsLoaded();
  const { StaticCanvas } = await import("fabric");
  const el = document.createElement("canvas");
  const doc = card ? parseCardDocument(card.document) : null;
  const artW = doc?.width || CARD_ARTBOARD.width;
  const artH = doc?.height || CARD_ARTBOARD.height;
  const canvas = new StaticCanvas(el, {
    width: artW,
    height: artH,
    backgroundColor: "#ffffff",
  });

  try {
    await loadInvitationOntoCanvas(canvas, event, card);
    return canvas.toDataURL({
      format: "png",
      multiplier: RENDER_MULTIPLIER,
      enableRetinaScaling: false,
    });
  } finally {
    canvas.dispose();
  }
}

type InvitationCardThumbProps = {
  event: EventResponse;
  className?: string;
  fallback: ReactNode;
};

export function InvitationCardThumb({
  event,
  className = "",
  fallback,
}: InvitationCardThumbProps) {
  const { data: card, isLoading, isFetching, isError } = useGetInvitationCardQuery(event.id);
  const fetching = isLoading || isFetching;
  const cardData = isError ? null : card ?? null;
  const stamp = cardData?.updated_at || `event:${event.updated_at}`;
  const key = cacheKey(event.id, stamp);
  const cachedUrl = !fetching ? thumbCache.get(key) ?? null : null;

  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    if (fetching || cachedUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const url = await renderPreviewDataUrl(event, cardData);
        if (cancelled) return;
        thumbCache.set(key, url);
        setRenderedUrl(url);
        setRenderFailed(false);
      } catch {
        if (!cancelled) {
          setRenderFailed(true);
          setRenderedUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetching, cachedUrl, cardData, event, key]);

  const displayUrl = cachedUrl ?? renderedUrl;

  if (displayUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayUrl}
        alt=""
        draggable={false}
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }

  if (!renderFailed && (fetching || !displayUrl)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return <>{fallback}</>;
}
