import type { EventResponse, InvitationCardResponse } from "@/lib/api/eventsApi";
import {
  CARD_ARTBOARD,
  applyVirtualTemplateToCanvas,
  loadDocumentOntoCanvas,
  parseCardDocument,
  type CardDocument,
} from "@/lib/invitationCardDocument";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFabricCanvas = any;

export type InvitationLoadResult = {
  document: CardDocument | null;
  width: number;
  height: number;
};

/** Load a saved fabric document or the formal_gold template onto a canvas. */
export async function loadInvitationOntoCanvas(
  canvas: AnyFabricCanvas,
  event: EventResponse,
  card?: Pick<InvitationCardResponse, "document" | "headline" | "body_message"> | null
): Promise<InvitationLoadResult> {
  const doc = card ? parseCardDocument(card.document) : null;

  if (doc?.engine === "fabric" && doc.fabric) {
    await loadDocumentOntoCanvas(canvas, doc);
    return {
      document: doc,
      width: doc.width || CARD_ARTBOARD.width,
      height: doc.height || CARD_ARTBOARD.height,
    };
  }

  await applyVirtualTemplateToCanvas(canvas, "formal_gold", {
    ...event,
    name: card?.headline || event.name,
    message: card?.body_message || event.message,
  });

  return {
    document: null,
    width: CARD_ARTBOARD.width,
    height: CARD_ARTBOARD.height,
  };
}
