"use client";

import { useEffect, useRef, useState } from "react";
import type { EventResponse, InvitationCardResponse } from "@/lib/api/eventsApi";
import { CARD_ARTBOARD, parseCardDocument } from "@/lib/invitationCardDocument";
import { ensureInvitationFontsLoaded } from "@/lib/invitationCardFonts";
import { fabricDocumentHasEphemeralImages } from "@/lib/fabricInvitationActions";
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

function PreviewImage({
  url,
  artW,
  artH,
  maxWidth,
  maxHeight,
  className,
}: {
  url: string;
  artW: number;
  artH: number;
  maxWidth: number;
  maxHeight?: number;
  className?: string;
}) {
  const scale = fitScale(artW, artH, maxWidth, maxHeight);
  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <div
        className="overflow-hidden bg-white shadow-[0_20px_60px_-24px_rgba(28,25,23,0.45)] ring-1 ring-black/10"
        style={{ width: artW * scale, height: artH * scale }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic API preview */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

export function InvitationCardViewer({
  event,
  card,
  maxWidth = 420,
  maxHeight,
  className = "",
}: InvitationCardViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<import("fabric").StaticCanvas | null>(null);
  const artRef = useRef<{ width: number; height: number }>({
    width: CARD_ARTBOARD.width,
    height: CARD_ARTBOARD.height,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [usePreview, setUsePreview] = useState(false);

  const previewUrl = card?.preview_url || null;
  const doc = card ? parseCardDocument(card.document) : null;
  const ephemeral = Boolean(doc?.fabric && fabricDocumentHasEphemeralImages(doc.fabric));

  // Saved photo-cards with blob: srcs cannot rehydrate — show durable preview instead.
  useEffect(() => {
    if (ephemeral && previewUrl) {
      setUsePreview(true);
      setReady(true);
      setError(false);
    } else {
      setUsePreview(false);
    }
  }, [ephemeral, previewUrl, card?.id]);

  // Load once per event/card — avoid dispose/reload on every resize (makes invite flip-back feel slow).
  useEffect(() => {
    if (usePreview) return;
    if (!canvasRef.current || !event) return;
    let disposed = false;

    (async () => {
      try {
        setReady(false);
        setError(false);
        await ensureInvitationFontsLoaded();
        const { StaticCanvas } = await import("fabric");
        if (disposed || !canvasRef.current) return;

        fabricRef.current?.dispose();
        fabricRef.current = null;

        const { width: artW, height: artH } = artboardSize(card);
        artRef.current = { width: artW, height: artH };
        const canvas = new StaticCanvas(canvasRef.current, {
          width: artW,
          height: artH,
          backgroundColor: "#ffffff",
        });
        fabricRef.current = canvas;

        await loadInvitationOntoCanvas(canvas, event, card);
        if (disposed) return;

        // If fabric "loaded" but photo srcs were dead, fall back to preview when available.
        const objs = canvas.getObjects() as { type?: string; width?: number; height?: number }[];
        const images = objs.filter((o) => o.type === "image");
        const brokenPhotoCard =
          images.length > 0 &&
          images.every((o) => !o.width || !o.height || (o.width ?? 0) < 2 || (o.height ?? 0) < 2);
        if (brokenPhotoCard && previewUrl) {
          setUsePreview(true);
          setReady(true);
          return;
        }

        const scale = fitScale(artW, artH, maxWidth, maxHeight);
        canvas.setZoom(scale);
        canvas.setDimensions({ width: artW * scale, height: artH * scale });
        canvas.requestRenderAll();
        setReady(true);
      } catch {
        if (disposed) return;
        if (previewUrl) {
          setUsePreview(true);
          setReady(true);
          setError(false);
        } else {
          setError(true);
        }
      }
    })();

    return () => {
      disposed = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // intentionally omit maxWidth/maxHeight — rezoom below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, card, usePreview, previewUrl]);

  useEffect(() => {
    if (usePreview) return;
    const canvas = fabricRef.current;
    if (!canvas || !ready) return;
    const { width: artW, height: artH } = artRef.current;
    const scale = fitScale(artW, artH, maxWidth, maxHeight);
    canvas.setZoom(scale);
    canvas.setDimensions({ width: artW * scale, height: artH * scale });
    canvas.requestRenderAll();
  }, [maxWidth, maxHeight, ready, usePreview]);

  if (usePreview && previewUrl) {
    const { width: artW, height: artH } = artboardSize(card);
    return (
      <PreviewImage
        url={previewUrl}
        artW={artW}
        artH={artH}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        className={className}
      />
    );
  }

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
