import type { EventResponse } from "@/lib/api/eventsApi";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";

/**
 * Fabric Canvas / StaticCanvas.
 * Avoid top-level `import "fabric"` here — it breaks Next/Turbopack module evaluation
 * (symptom: "module has no exports at all"). Callers pass Fabric instances; we only
 * dynamic-import fabric inside async helpers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFabricCanvas = any;

export const CARD_ARTBOARD = { width: 1080, height: 1528 } as const;

/** Persisted invitation design (REQ-002). Fabric payload lives in `fabric`. */
export type CardDocument = {
  version: 1;
  width: number;
  height: number;
  background: string;
  /** Required by API validation; may be empty when using Fabric. */
  elements: unknown[];
  engine?: "fabric" | "legacy";
  /** Fabric.js canvas.toObject() / toJSON() payload */
  fabric?: Record<string, unknown>;
};

export type VirtualTemplateId =
  | "blank"
  | "formal_gold"
  | "modern_minimal"
  | "garden_floral"
  | "corporate_clean"
  | "gift_blush"
  | "gift_midnight"
  | "party_confetti"
  | "wedding_ivory";

export type VirtualTemplatePreview = {
  bg: string;
  fg: string;
  accent: string;
  /** Visual motif for the thumbnail */
  motif: "blank" | "formal" | "bar" | "blobs" | "frame" | "gift" | "stars" | "ivory";
};

export type VirtualTemplateMeta = {
  id: VirtualTemplateId;
  label: string;
  description: string;
  preview: VirtualTemplatePreview;
};

export const VIRTUAL_TEMPLATES: VirtualTemplateMeta[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Empty artboard",
    preview: { bg: "#ffffff", fg: "#94a3b8", accent: "#e2e8f0", motif: "blank" },
  },
  {
    id: "formal_gold",
    label: "Formal Gold",
    description: "Dark elegant starter",
    preview: { bg: "#1c1917", fg: "#d4a574", accent: "#292524", motif: "formal" },
  },
  {
    id: "modern_minimal",
    label: "Modern Minimal",
    description: "Clean light starter",
    preview: { bg: "#f8fafc", fg: "#0f172a", accent: "#0f172a", motif: "bar" },
  },
  {
    id: "garden_floral",
    label: "Garden",
    description: "Soft cream starter",
    preview: { bg: "#f5f0e8", fg: "#3f3a32", accent: "#fce7f3", motif: "blobs" },
  },
  {
    id: "corporate_clean",
    label: "Corporate",
    description: "Professional starter",
    preview: { bg: "#eef2ff", fg: "#1e293b", accent: "#2563eb", motif: "frame" },
  },
  {
    id: "gift_blush",
    label: "Blush Gift Card",
    description: "Soft pink patterned gift card",
    preview: { bg: "#fff1f2", fg: "#881337", accent: "#f9a8d4", motif: "gift" },
  },
  {
    id: "gift_midnight",
    label: "Midnight Gift",
    description: "Navy + gold gift card",
    preview: { bg: "#0f172a", fg: "#fafaf9", accent: "#d4a574", motif: "gift" },
  },
  {
    id: "party_confetti",
    label: "Party Confetti",
    description: "Bright celebration card",
    preview: { bg: "#1e1b4b", fg: "#ffffff", accent: "#fde68a", motif: "stars" },
  },
  {
    id: "wedding_ivory",
    label: "Wedding Ivory",
    description: "Ivory formal invitation sample",
    preview: { bg: "#faf7f2", fg: "#44403c", accent: "#a8a29e", motif: "ivory" },
  },
];

export function createBlankDocument(background = "#ffffff"): CardDocument {
  return {
    version: 1,
    width: CARD_ARTBOARD.width,
    height: CARD_ARTBOARD.height,
    background,
    elements: [],
    engine: "fabric",
    fabric: {
      version: "6",
      objects: [],
      background,
    },
  };
}

export function isCardDocument(value: unknown): value is CardDocument {
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  if (!raw || typeof raw !== "object") return false;
  const d = raw as CardDocument;
  return (
    d.version === 1 &&
    typeof d.width === "number" &&
    typeof d.height === "number" &&
    Array.isArray(d.elements)
  );
}

export function parseCardDocument(value: unknown): CardDocument | null {
  if (!isCardDocument(value)) return null;
  if (typeof value === "string") return JSON.parse(value) as CardDocument;
  return value;
}

export function documentFromFabricCanvas(canvas: AnyFabricCanvas): CardDocument {
  // Solid string for API `background`; full fill (incl. Gradient) lives in fabric JSON.
  const background =
    typeof canvas.backgroundColor === "string"
      ? canvas.backgroundColor
      : "#ffffff";
  const fabric = canvas.toObject([
    "name",
    "selectable",
    "evented",
    "__locked",
    "lockMovementX",
    "lockMovementY",
    "lockScalingX",
    "lockScalingY",
    "lockRotation",
    "hasControls",
  ]) as Record<string, unknown>;
  const zoom = typeof canvas.getZoom === "function" ? canvas.getZoom() || 1 : 1;
  const cssW = canvas.getWidth?.() || CARD_ARTBOARD.width;
  const cssH = canvas.getHeight?.() || CARD_ARTBOARD.height;
  return {
    version: 1,
    // Persist logical artboard size (not zoomed CSS pixels).
    width: Math.round(cssW / zoom) || CARD_ARTBOARD.width,
    height: Math.round(cssH / zoom) || CARD_ARTBOARD.height,
    background,
    elements: Array.isArray(fabric.objects) ? (fabric.objects as unknown[]) : [],
    engine: "fabric",
    fabric,
  };
}

/** Build a Fabric-ready document starter from a virtual template + event fields. */
export async function applyVirtualTemplateToCanvas(
  canvas: AnyFabricCanvas,
  templateId: VirtualTemplateId,
  event: EventResponse
): Promise<void> {
  const { Rect, Textbox, Line, Ellipse } = await import("fabric");
  const W = CARD_ARTBOARD.width;
  const H = CARD_ARTBOARD.height;
  const title = event.name || "Your Event";
  const dateLine = formatEventDate(event.event_date);
  const timeLine = formatEventTimeRange(event.start_time, event.end_time);
  const place = event.location || "";
  const message = event.message || "";

  canvas.clear();
  canvas.backgroundColor = "#ffffff";

  const addText = (
    text: string,
    opts: ConstructorParameters<typeof Textbox>[1]
  ) => {
    const t = new Textbox(text, {
      originX: "center",
      textAlign: "center",
      ...opts,
    });
    canvas.add(t);
    return t;
  };

  if (templateId === "blank") {
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
    return;
  }

  if (templateId === "formal_gold") {
    canvas.backgroundColor = "#1c1917";
    canvas.add(
      new Rect({
        left: 48,
        top: 80,
        width: W - 96,
        height: H - 160,
        fill: "#292524",
        rx: 24,
        ry: 24,
        stroke: "#44403c",
      })
    );
    addText("YOU ARE INVITED", {
      left: W / 2,
      top: 160,
      width: W - 200,
      fontSize: 18,
      fontFamily: "Montserrat",
      fontWeight: "600",
      fill: "#a8a29e",
    });
    addText(title, {
      left: W / 2,
      top: 220,
      width: W - 200,
      fontSize: 56,
      fontFamily: "Playfair Display",
      fontStyle: "italic",
      fontWeight: "600",
      fill: "#d4a574",
    });
    addText(dateLine, {
      left: W / 2,
      top: 400,
      width: W - 200,
      fontSize: 24,
      fontFamily: "Montserrat",
      fontWeight: "600",
      fill: "#fafaf9",
    });
    addText(timeLine, {
      left: W / 2,
      top: 450,
      width: W - 200,
      fontSize: 20,
      fontFamily: "Montserrat",
      fill: "#a8a29e",
    });
    if (place) {
      addText(place, {
        left: W / 2,
        top: 510,
        width: W - 200,
        fontSize: 20,
        fontFamily: "Montserrat",
        fill: "#a8a29e",
      });
    }
    if (message) {
      addText(message, {
        left: W / 2,
        top: 600,
        width: W - 280,
        fontSize: 22,
        fontFamily: "Cormorant Garamond",
        fill: "#d6d3d1",
      });
    }
    canvas.requestRenderAll();
    return;
  }

  if (templateId === "modern_minimal") {
    canvas.backgroundColor = "#f8fafc";
    canvas.add(
      new Rect({
        left: 0,
        top: 0,
        width: W,
        height: 12,
        fill: "#0f172a",
        selectable: false,
      })
    );
    canvas.add(
      new Textbox(title, {
        left: 96,
        top: 180,
        width: W - 192,
        fontSize: 64,
        fontFamily: "Montserrat",
        fontWeight: "700",
        fill: "#0f172a",
        textAlign: "left",
      }),
      new Line([96, 380, 256, 380], {
        stroke: "#0f172a",
        strokeWidth: 4,
      }),
      new Textbox(`${dateLine}  ·  ${timeLine}`, {
        left: 96,
        top: 420,
        width: W - 192,
        fontSize: 22,
        fontFamily: "DM Sans",
        fill: "#64748b",
        textAlign: "left",
      })
    );
    if (place) {
      canvas.add(
        new Textbox(place, {
          left: 96,
          top: 480,
          width: W - 192,
          fontSize: 22,
          fontFamily: "DM Sans",
          fill: "#64748b",
          textAlign: "left",
        })
      );
    }
    if (message) {
      canvas.add(
        new Textbox(message, {
          left: 96,
          top: 580,
          width: W - 192,
          fontSize: 22,
          fontFamily: "DM Sans",
          fill: "#334155",
          textAlign: "left",
        })
      );
    }
    canvas.requestRenderAll();
    return;
  }

  if (templateId === "garden_floral") {
    canvas.backgroundColor = "#f5f0e8";
    canvas.add(
      new Ellipse({
        left: W - 280,
        top: -40,
        rx: 160,
        ry: 160,
        fill: "#d9f99d",
      }),
      new Ellipse({
        left: -80,
        top: H - 260,
        rx: 140,
        ry: 140,
        fill: "#fce7f3",
      })
    );
    addText("Together with joy", {
      left: W / 2,
      top: 280,
      width: W - 200,
      fontSize: 22,
      fontFamily: "Great Vibes",
      fill: "#78716c",
    });
    addText(title, {
      left: W / 2,
      top: 360,
      width: W - 200,
      fontSize: 52,
      fontFamily: "Cormorant Garamond",
      fontWeight: "600",
      fill: "#3f3a32",
    });
    addText(`${dateLine}\n${timeLine}`, {
      left: W / 2,
      top: 560,
      width: W - 200,
      fontSize: 22,
      fontFamily: "Lora",
      fill: "#57534e",
    });
    if (place) {
      addText(place, {
        left: W / 2,
        top: 680,
        width: W - 200,
        fontSize: 20,
        fontFamily: "Lora",
        fill: "#78716c",
      });
    }
    canvas.requestRenderAll();
    return;
  }

  if (templateId === "corporate_clean") {
    canvas.backgroundColor = "#eef2ff";
    canvas.add(
      new Rect({
        left: 64,
        top: 64,
        width: W - 128,
        height: H - 128,
        fill: "#ffffff",
        stroke: "#c7d2fe",
        strokeWidth: 2,
        rx: 16,
        ry: 16,
      })
    );
    canvas.add(
      new Textbox("YOU'RE INVITED", {
        left: 120,
        top: 200,
        width: W - 240,
        fontSize: 16,
        fontFamily: "Montserrat",
        fontWeight: "700",
        fill: "#2563eb",
        textAlign: "left",
      }),
      new Textbox(title, {
        left: 120,
        top: 260,
        width: W - 240,
        fontSize: 48,
        fontFamily: "Montserrat",
        fontWeight: "700",
        fill: "#1e293b",
        textAlign: "left",
      }),
      new Textbox(`${dateLine}\n${timeLine}${place ? `\n${place}` : ""}`, {
        left: 120,
        top: 460,
        width: W - 240,
        fontSize: 24,
        fontFamily: "DM Sans",
        fontWeight: "500",
        fill: "#64748b",
        textAlign: "left",
      })
    );
    if (message) {
      canvas.add(
        new Textbox(message, {
          left: 120,
          top: 640,
          width: W - 240,
          fontSize: 20,
          fontFamily: "DM Sans",
          fill: "#334155",
          textAlign: "left",
        })
      );
    }
    canvas.requestRenderAll();
    return;
  }

  // Gift-card / sample layouts with Hero Patterns + Twemoji accents
  const { addPatternUnderlay, createStickerObject } = await import(
    "@/lib/fabricInvitationActions"
  );
  const { INVITATION_PATTERNS } = await import("@/lib/invitationCardPatterns");
  const { INVITATION_STICKERS } = await import("@/lib/invitationCardStickers");

  const findPattern = (id: string) =>
    INVITATION_PATTERNS.find((p) => p.id === id) ?? INVITATION_PATTERNS[0]!;
  const findSticker = (id: string) =>
    INVITATION_STICKERS.find((s) => s.id === id);

  const placeSticker = async (
    stickerId: string,
    left: number,
    top: number,
    size = 96
  ) => {
    const meta = findSticker(stickerId);
    if (!meta) return;
    try {
      const obj = await createStickerObject(meta);
      const side = Math.max(obj.width || 1, obj.height || 1);
      if (side > 0) obj.scale(size / side);
      obj.set({ left, top, originX: "center", originY: "center" });
      canvas.add(obj);
    } catch {
      /* optional accent */
    }
  };

  if (templateId === "gift_blush") {
    await addPatternUnderlay(canvas, findPattern("polka-dots"));
    canvas.add(
      new Rect({
        left: 72,
        top: 120,
        width: W - 144,
        height: H - 240,
        fill: "rgba(255,255,255,0.88)",
        rx: 28,
        ry: 28,
      })
    );
    addText("A little something for you", {
      left: W / 2,
      top: 280,
      width: W - 240,
      fontSize: 22,
      fontFamily: "Great Vibes",
      fill: "#9f1239",
    });
    addText(title, {
      left: W / 2,
      top: 360,
      width: W - 240,
      fontSize: 48,
      fontFamily: "Playfair Display",
      fontWeight: "600",
      fill: "#881337",
    });
    addText(`${dateLine}\n${timeLine}`, {
      left: W / 2,
      top: 520,
      width: W - 240,
      fontSize: 22,
      fontFamily: "Lora",
      fill: "#9f1239",
    });
    if (place) {
      addText(place, {
        left: W / 2,
        top: 640,
        width: W - 240,
        fontSize: 20,
        fontFamily: "DM Sans",
        fill: "#be123c",
      });
    }
    await placeSticker("tw-1f381", W / 2, 820, 110);
    await placeSticker("tw-2764", 200, 220, 64);
    await placeSticker("tw-2764", W - 200, 220, 64);
    canvas.requestRenderAll();
    return;
  }

  if (templateId === "gift_midnight") {
    await addPatternUnderlay(canvas, findPattern("formal-invitation"));
    canvas.add(
      new Rect({
        left: 64,
        top: 100,
        width: W - 128,
        height: H - 200,
        fill: "rgba(15,23,42,0.82)",
        stroke: "#d4a574",
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      })
    );
    addText("GIFT CARD", {
      left: W / 2,
      top: 220,
      width: W - 220,
      fontSize: 16,
      fontFamily: "Montserrat",
      fontWeight: "700",
      fill: "#d4a574",
      charSpacing: 280,
    });
    addText(title, {
      left: W / 2,
      top: 320,
      width: W - 220,
      fontSize: 52,
      fontFamily: "Playfair Display",
      fontStyle: "italic",
      fill: "#fafaf9",
    });
    addText(`${dateLine}  ·  ${timeLine}`, {
      left: W / 2,
      top: 520,
      width: W - 220,
      fontSize: 20,
      fontFamily: "Montserrat",
      fill: "#a8a29e",
    });
    if (place) {
      addText(place, {
        left: W / 2,
        top: 590,
        width: W - 220,
        fontSize: 18,
        fontFamily: "Montserrat",
        fill: "#78716c",
      });
    }
    await placeSticker("tw-1f48e", W / 2, 780, 100);
    canvas.requestRenderAll();
    return;
  }

  if (templateId === "party_confetti") {
    await addPatternUnderlay(canvas, findPattern("four-point-stars"));
    canvas.add(
      new Rect({
        left: 80,
        top: 160,
        width: W - 160,
        height: H - 320,
        fill: "rgba(30,27,75,0.75)",
        rx: 32,
        ry: 32,
      })
    );
    addText("LET'S CELEBRATE", {
      left: W / 2,
      top: 280,
      width: W - 240,
      fontSize: 18,
      fontFamily: "Montserrat",
      fontWeight: "700",
      fill: "#fde68a",
      charSpacing: 200,
    });
    addText(title, {
      left: W / 2,
      top: 360,
      width: W - 240,
      fontSize: 56,
      fontFamily: "Montserrat",
      fontWeight: "800",
      fill: "#ffffff",
    });
    addText(`${dateLine}\n${timeLine}`, {
      left: W / 2,
      top: 560,
      width: W - 240,
      fontSize: 24,
      fontFamily: "DM Sans",
      fill: "#e0e7ff",
    });
    if (place) {
      addText(place, {
        left: W / 2,
        top: 680,
        width: W - 240,
        fontSize: 20,
        fontFamily: "DM Sans",
        fill: "#c7d2fe",
      });
    }
    await placeSticker("tw-1f389", 180, 900, 90);
    await placeSticker("tw-1f388", W / 2, 920, 100);
    await placeSticker("tw-1f38a", W - 180, 900, 90);
    canvas.requestRenderAll();
    return;
  }

  // wedding_ivory
  await addPatternUnderlay(canvas, findPattern("paper-linen"), {
    backdrop: "#faf7f2",
  });
  canvas.add(
    new Rect({
      left: 96,
      top: 140,
      width: W - 192,
      height: H - 280,
      fill: "rgba(255,253,250,0.92)",
      stroke: "#d6d3d1",
      strokeWidth: 1,
    })
  );
  addText("Together with their families", {
    left: W / 2,
    top: 280,
    width: W - 280,
    fontSize: 20,
    fontFamily: "Cormorant Garamond",
    fontStyle: "italic",
    fill: "#78716c",
  });
  addText(title, {
    left: W / 2,
    top: 380,
    width: W - 280,
    fontSize: 48,
    fontFamily: "Playfair Display",
    fontWeight: "500",
    fill: "#44403c",
  });
  canvas.add(
    new Line([W / 2 - 80, 520, W / 2 + 80, 520], {
      stroke: "#a8a29e",
      strokeWidth: 1,
    })
  );
  addText(`${dateLine}\n${timeLine}`, {
    left: W / 2,
    top: 560,
    width: W - 280,
    fontSize: 22,
    fontFamily: "Lora",
    fill: "#57534e",
  });
  if (place) {
    addText(place, {
      left: W / 2,
      top: 700,
      width: W - 280,
      fontSize: 18,
      fontFamily: "Lora",
      fill: "#78716c",
    });
  }
  await placeSticker("tw-1f490", W / 2, 860, 100);
  await placeSticker("tw-1f48d", W / 2, 980, 72);
  canvas.requestRenderAll();
}

export async function loadDocumentOntoCanvas(
  canvas: AnyFabricCanvas,
  doc: CardDocument
): Promise<void> {
  const bg = doc.background || "#ffffff";
  if (doc.engine === "fabric" && doc.fabric && typeof doc.fabric === "object") {
    await canvas.loadFromJSON(doc.fabric);
    // Keep gradient/object fills restored by fabric JSON; only fall back to solid string.
    if (canvas.backgroundColor == null || canvas.backgroundColor === "") {
      canvas.backgroundColor = bg;
    }
    canvas.requestRenderAll();
    return;
  }
  // Legacy custom elements — start blank; caller may apply a template
  canvas.clear();
  canvas.backgroundColor = bg;
  canvas.requestRenderAll();
}
