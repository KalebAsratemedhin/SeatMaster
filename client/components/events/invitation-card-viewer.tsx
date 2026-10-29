"use client";

import { useEffect, useRef, useState } from "react";
import type { EventResponse, InvitationCardResponse } from "@/lib/api/eventsApi";
import { CARD_ARTBOARD, parseCardDocument } from "@/lib/invitationCardDocument";
import { ensureInvitationFontsLoaded } from "@/lib/invitationCardFonts";
import { loadInvitationOntoCanvas } from "@/lib/loadInvitationOntoCanvas";
import { Loader2 } from "lucide-react";

type InvitationCardViewerProps = {
  event: EventResponse;
  card?: InvitationCardResponse | null;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
};

function fitScale(artW: number, artH: number, maxWidth: number, maxHeight?: number) {
  const byW = maxWidth / artW;
  if (maxHeight == null) return Math.min(1, byW);
  const byH = maxHeight / artH;
  return Math.min(1, byW, byH);
}

function artboardSize(card?: InvitationCardResponse | null) {
  const doc = card ? parseCardDocument(card.document) : null;
  return {
    width: doc?.width || CARD_ARTBOARD.width,
    height: doc?.height || CARD_ARTBOARD.height,
  };
}

export function InvitationCardViewer({
  event,
  card,
  maxWidth = 420,
  maxHeight,
  className = "",
}: InvitationCardViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !event) return;
    let disposed = false;
    let canvas: import("fabric").StaticCanvas | null = null;

    (async () => {
      try {
        setReady(false);
        setError(false);
        await ensureInvitationFontsLoaded();
        const { StaticCanvas } = await import("fabric");
        if (disposed || !canvasRef.current) return;

        const { width: artW, height: artH } = artboardSize(card);
        canvas = new StaticCanvas(canvasRef.current, {
          width: artW,
          height: artH,
          backgroundColor: "#ffffff",
        });

        await loadInvitationOntoCanvas(canvas, event, card);

        const scale = fitScale(artW, artH, maxWidth, maxHeight);
        canvas.setZoom(scale);
        canvas.setDimensions({
          width: artW * scale,
          height: artH * scale,
        });
        canvas.requestRenderAll();
        if (!disposed) setReady(true);
      } catch {
        if (!disposed) setError(true);
      }
    })();

    return () => {
      disposed = true;
      canvas?.dispose();
    };
  }, [event, card, maxWidth, maxHeight]);

  if (error) {
    return (
      <div
        className={`rounded-xl bg-white/80 p-6 text-center text-sm text-muted-foreground ring-1 ring-black/5 ${className}`}
      >
        Could not render this invitation card.
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#e8e4dc]/60">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
      <div className="bg-white shadow-[0_20px_60px_-24px_rgba(28,25,23,0.45)] ring-1 ring-black/10">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
