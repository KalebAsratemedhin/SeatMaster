import type { CardDocument } from "@/lib/invitationCardDocument";
import { CARD_ARTBOARD } from "@/lib/invitationCardDocument";
import { ensureInvitationFontsLoaded } from "@/lib/invitationCardFonts";

/** Render a saved card document to PNG using an offscreen Fabric canvas. */
export async function renderInvitationCardPngBlob(
  doc: CardDocument,
  options?: { multiplier?: number }
): Promise<Blob> {
  await ensureInvitationFontsLoaded();
  const { StaticCanvas } = await import("fabric");
  const el = document.createElement("canvas");
  const width = doc.width || CARD_ARTBOARD.width;
  const height = doc.height || CARD_ARTBOARD.height;
  const canvas = new StaticCanvas(el, {
    width,
    height,
    backgroundColor: doc.background || "#ffffff",
  });

  try {
    if (doc.engine === "fabric" && doc.fabric) {
      await canvas.loadFromJSON(doc.fabric);
    }
    canvas.backgroundColor = doc.background || "#ffffff";
    canvas.requestRenderAll();
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: options?.multiplier ?? 1,
      enableRetinaScaling: false,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  } finally {
    canvas.dispose();
  }
}

/** Smaller PNG suitable for event-list thumbnails. */
export async function renderInvitationCardPreviewBlob(doc: CardDocument): Promise<Blob> {
  return renderInvitationCardPngBlob(doc, { multiplier: 0.28 });
}

export async function downloadInvitationCardPng(
  doc: CardDocument,
  fileName: string
): Promise<void> {
  const blob = await renderInvitationCardPngBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/[^\w.-]+/g, "-")}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
