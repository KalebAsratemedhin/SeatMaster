import { CARD_ARTBOARD } from "@/lib/invitationCardDocument";
import {
  patternDataUrl,
  type PatternItem,
} from "@/lib/invitationCardPatterns";
import { stickerSrc, type StickerItem } from "@/lib/invitationCardStickers";

/** eslint-disable @typescript-eslint/no-explicit-any — Fabric instances are dynamic-imported */

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load pattern: ${src.slice(0, 64)}`));
    img.src = src;
  });
}

/** Apply a repeating pattern as the canvas background (with solid backdrop). */
export async function applyPatternToCanvasBackground(
  canvas: any,
  pattern: PatternItem,
  opts?: { color?: string; opacity?: number; backdrop?: string }
) {
  const { Pattern } = await import("fabric");
  const backdrop = opts?.backdrop ?? pattern.backdrop;
  const dataUrl = patternDataUrl(pattern, opts?.color, opts?.opacity);
  const source = await loadHtmlImage(dataUrl);
  canvas.backgroundColor = new Pattern({
    source,
    repeat: "repeat",
  });
  canvas.__patternBackdrop = backdrop;
  canvas.requestRenderAll();
}

/** Apply pattern as fill on the active object (or a full-bleed underlay rect). */
export async function applyPatternFill(
  target: any,
  pattern: PatternItem,
  opts?: { color?: string; opacity?: number }
) {
  const { Pattern } = await import("fabric");
  const dataUrl = patternDataUrl(pattern, opts?.color, opts?.opacity);
  const source = await loadHtmlImage(dataUrl);
  target.set(
    "fill",
    new Pattern({
      source,
      repeat: "repeat",
    })
  );
  target.setCoords?.();
}

/** Full-bleed patterned underlay (locked) behind existing objects. */
export async function addPatternUnderlay(
  canvas: any,
  pattern: PatternItem,
  opts?: { color?: string; opacity?: number; backdrop?: string }
) {
  const { Rect, Pattern } = await import("fabric");
  const dataUrl = patternDataUrl(pattern, opts?.color, opts?.opacity);
  const source = await loadHtmlImage(dataUrl);
  const fill = new Pattern({ source, repeat: "repeat" });
  const underlay = new Rect({
    left: 0,
    top: 0,
    width: CARD_ARTBOARD.width,
    height: CARD_ARTBOARD.height,
    fill,
    selectable: false,
    evented: false,
    name: `pattern:${pattern.id}`,
  });
  const bg = new Rect({
    left: 0,
    top: 0,
    width: CARD_ARTBOARD.width,
    height: CARD_ARTBOARD.height,
    fill: opts?.backdrop ?? pattern.backdrop,
    selectable: false,
    evented: false,
    name: `pattern-backdrop:${pattern.id}`,
  });
  canvas.insertAt(0, bg);
  canvas.insertAt(1, underlay);
  canvas.backgroundColor = opts?.backdrop ?? pattern.backdrop;
  canvas.requestRenderAll();
  return underlay;
}

export async function createStickerObject(sticker: StickerItem) {
  const { loadSVGFromURL, util, Group, FabricImage } = await import("fabric");
  const url = stickerSrc(sticker);

  let obj: any;
  try {
    const parsed = await loadSVGFromURL(url);
    const objects = (parsed.objects || []).filter(Boolean) as object[];
    if (objects.length === 0) {
      throw new Error("SVG produced no objects");
    }
    if (typeof util.groupSVGElements === "function") {
      obj = util.groupSVGElements(objects as any[], parsed.options);
    } else if (objects.length === 1) {
      obj = objects[0];
    } else {
      obj = new Group(objects as any[], {
        ...parsed.options,
      });
    }
  } catch {
    obj = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  }

  obj.set({
    name: `sticker:${sticker.id}`,
    left: CARD_ARTBOARD.width / 2,
    top: CARD_ARTBOARD.height / 2,
    originX: "center",
    originY: "center",
  });

  const maxSide = Math.max(obj.width || 1, obj.height || 1);
  if (maxSide > 0) {
    obj.scale(160 / maxSide);
  }
  obj.setCoords?.();
  return obj;
}

export function cloneObjectJson(obj: any): Record<string, unknown> {
  return obj.toObject(["name"]) as Record<string, unknown>;
}

export async function objectFromJson(json: Record<string, unknown>) {
  const { util } = await import("fabric");
  const enliven = util.enlivenObjects as (
    objects: unknown[]
  ) => Promise<any[]>;
  const [obj] = await enliven([json]);
  return obj;
}

export function applyShadow(
  obj: any,
  opts: { enabled: boolean; blur: number; offsetX: number; offsetY: number; color: string }
) {
  if (!opts.enabled) {
    obj.set("shadow", null);
    return;
  }
  obj.set("shadow", {
    color: opts.color,
    blur: opts.blur,
    offsetX: opts.offsetX,
    offsetY: opts.offsetY,
  });
}

export function alignObjects(
  canvas: any,
  mode: "left" | "center" | "right" | "top" | "middle" | "bottom"
) {
  const active = canvas.getActiveObject();
  if (!active) return;

  const targets =
    active.type === "activeselection" || active.type === "activeSelection"
      ? active.getObjects()
      : [active];

  if (targets.length === 1) {
    const o = targets[0];
    const bound = o.getBoundingRect();
    switch (mode) {
      case "left":
        o.set({ left: o.left - bound.left });
        break;
      case "center":
        o.set({ left: o.left + (CARD_ARTBOARD.width / 2 - (bound.left + bound.width / 2)) });
        break;
      case "right":
        o.set({ left: o.left + (CARD_ARTBOARD.width - (bound.left + bound.width)) });
        break;
      case "top":
        o.set({ top: o.top - bound.top });
        break;
      case "middle":
        o.set({ top: o.top + (CARD_ARTBOARD.height / 2 - (bound.top + bound.height / 2)) });
        break;
      case "bottom":
        o.set({ top: o.top + (CARD_ARTBOARD.height - (bound.top + bound.height)) });
        break;
    }
    o.setCoords();
    canvas.requestRenderAll();
    return;
  }

  const bounds = targets.map((o: any) => o.getBoundingRect());
  const minL = Math.min(...bounds.map((b: any) => b.left));
  const maxR = Math.max(...bounds.map((b: any) => b.left + b.width));
  const minT = Math.min(...bounds.map((b: any) => b.top));
  const maxB = Math.max(...bounds.map((b: any) => b.top + b.height));
  const midX = (minL + maxR) / 2;
  const midY = (minT + maxB) / 2;

  targets.forEach((o: any, i: number) => {
    const b = bounds[i];
    switch (mode) {
      case "left":
        o.set({ left: o.left + (minL - b.left) });
        break;
      case "center":
        o.set({ left: o.left + (midX - (b.left + b.width / 2)) });
        break;
      case "right":
        o.set({ left: o.left + (maxR - (b.left + b.width)) });
        break;
      case "top":
        o.set({ top: o.top + (minT - b.top) });
        break;
      case "middle":
        o.set({ top: o.top + (midY - (b.top + b.height / 2)) });
        break;
      case "bottom":
        o.set({ top: o.top + (maxB - (b.top + b.height)) });
        break;
    }
    o.setCoords();
  });
  canvas.requestRenderAll();
}

export function distributeObjects(canvas: any, axis: "horizontal" | "vertical") {
  const active = canvas.getActiveObject();
  if (!active || (active.type !== "activeselection" && active.type !== "activeSelection")) {
    return;
  }
  const targets = active.getObjects().slice() as any[];
  if (targets.length < 3) return;

  if (axis === "horizontal") {
    targets.sort((a, b) => a.getBoundingRect().left - b.getBoundingRect().left);
    const first = targets[0].getBoundingRect();
    const last = targets[targets.length - 1].getBoundingRect();
    const span = last.left + last.width - first.left;
    const totalW = targets.reduce((s, o) => s + o.getBoundingRect().width, 0);
    const gap = (span - totalW) / (targets.length - 1);
    let cursor = first.left;
    targets.forEach((o) => {
      const b = o.getBoundingRect();
      o.set({ left: o.left + (cursor - b.left) });
      o.setCoords();
      cursor += b.width + gap;
    });
  } else {
    targets.sort((a, b) => a.getBoundingRect().top - b.getBoundingRect().top);
    const first = targets[0].getBoundingRect();
    const last = targets[targets.length - 1].getBoundingRect();
    const span = last.top + last.height - first.top;
    const totalH = targets.reduce((s, o) => s + o.getBoundingRect().height, 0);
    const gap = (span - totalH) / (targets.length - 1);
    let cursor = first.top;
    targets.forEach((o) => {
      const b = o.getBoundingRect();
      o.set({ top: o.top + (cursor - b.top) });
      o.setCoords();
      cursor += b.height + gap;
    });
  }
  canvas.requestRenderAll();
}

const SNAP = 8;

/** Clear dashed snap guides painted on the canvas overlay. */
export function clearSnapGuides(canvas: any) {
  if (!canvas) return;
  canvas._snapGuideLines = null;
  canvas.requestRenderAll();
}

/**
 * Snap object to artboard edges/center and draw temporary magenta guide lines.
 * Call clearSnapGuides on object:modified / mouse:up.
 */
export function snapMovingObject(canvas: any, obj: any) {
  if (!obj) return;
  const b = obj.getBoundingRect(true);
  const w = CARD_ARTBOARD.width;
  const h = CARD_ARTBOARD.height;
  const cx = b.left + b.width / 2;
  const cy = b.top + b.height / 2;
  let dx = 0;
  let dy = 0;
  const guides: { x1: number; y1: number; x2: number; y2: number }[] = [];

  if (Math.abs(b.left) < SNAP) {
    dx = -b.left;
    guides.push({ x1: 0, y1: 0, x2: 0, y2: h });
  } else if (Math.abs(b.left + b.width - w) < SNAP) {
    dx = w - (b.left + b.width);
    guides.push({ x1: w, y1: 0, x2: w, y2: h });
  } else if (Math.abs(cx - w / 2) < SNAP) {
    dx = w / 2 - cx;
    guides.push({ x1: w / 2, y1: 0, x2: w / 2, y2: h });
  }

  if (Math.abs(b.top) < SNAP) {
    dy = -b.top;
    guides.push({ x1: 0, y1: 0, x2: w, y2: 0 });
  } else if (Math.abs(b.top + b.height - h) < SNAP) {
    dy = h - (b.top + b.height);
    guides.push({ x1: 0, y1: h, x2: w, y2: h });
  } else if (Math.abs(cy - h / 2) < SNAP) {
    dy = h / 2 - cy;
    guides.push({ x1: 0, y1: h / 2, x2: w, y2: h / 2 });
  }

  if (dx || dy) {
    obj.set({ left: obj.left + dx, top: obj.top + dy });
    obj.setCoords();
  }

  canvas._snapGuideLines = guides;
  if (!canvas._snapGuideHooked) {
    canvas._snapGuideHooked = true;
    canvas.on("after:render", () => {
      const lines = canvas._snapGuideLines as
        | { x1: number; y1: number; x2: number; y2: number }[]
        | null;
      if (!lines?.length) return;
      const ctx = canvas.getContext();
      if (!ctx) return;
      ctx.save();
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      lines.forEach((l) => {
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      });
      ctx.restore();
    });
  }
}

export async function applyImageFilter(
  img: any,
  kind: "none" | "grayscale" | "sepia" | "brightness" | "contrast",
  amount = 0.2
) {
  const { filters } = await import("fabric");
  img.filters = [];
  if (kind === "grayscale") img.filters.push(new filters.Grayscale());
  if (kind === "sepia") img.filters.push(new filters.Sepia());
  if (kind === "brightness") img.filters.push(new filters.Brightness({ brightness: amount }));
  if (kind === "contrast") img.filters.push(new filters.Contrast({ contrast: amount }));
  img.applyFilters();
}

export const STROKE_DASH_PRESETS: Record<string, number[] | null> = {
  solid: null,
  dashed: [12, 8],
  dotted: [2, 6],
  long: [24, 10],
};

export function applyStrokeDash(obj: any, preset: keyof typeof STROKE_DASH_PRESETS) {
  const dash = STROKE_DASH_PRESETS[preset];
  obj.set("strokeDashArray", dash);
}

export function setBrushStyle(
  canvas: any,
  opts: { color?: string; width?: number }
) {
  const brush = canvas?.freeDrawingBrush;
  if (!brush) return;
  if (opts.color != null) brush.color = opts.color;
  if (opts.width != null) brush.width = opts.width;
}

export async function createLinearGradient(opts: {
  colorStops: { offset: number; color: string }[];
  coords?: { x1: number; y1: number; x2: number; y2: number };
}) {
  const { Gradient } = await import("fabric");
  return new Gradient({
    type: "linear",
    gradientUnits: "percentage",
    coords: opts.coords ?? { x1: 0, y1: 0, x2: 0, y2: 1 },
    colorStops: opts.colorStops,
  });
}

export async function createRadialGradient(opts: {
  colorStops: { offset: number; color: string }[];
}) {
  const { Gradient } = await import("fabric");
  return new Gradient({
    type: "radial",
    gradientUnits: "percentage",
    coords: { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5, r1: 0, r2: 0.7 },
    colorStops: opts.colorStops,
  });
}

export async function applyObjectGradientFill(
  obj: any,
  kind: "linear" | "radial",
  from: string,
  to: string
) {
  const stops = [
    { offset: 0, color: from },
    { offset: 1, color: to },
  ];
  const fill =
    kind === "radial"
      ? await createRadialGradient({ colorStops: stops })
      : await createLinearGradient({ colorStops: stops });
  obj.set("fill", fill);
}

export async function setCanvasBackgroundSolid(canvas: any, color: string) {
  canvas.backgroundColor = color;
  canvas.requestRenderAll();
}

export async function setCanvasBackgroundGradient(
  canvas: any,
  from: string,
  to: string,
  kind: "linear" | "radial" = "linear"
) {
  const stops = [
    { offset: 0, color: from },
    { offset: 1, color: to },
  ];
  canvas.backgroundColor =
    kind === "radial"
      ? await createRadialGradient({ colorStops: stops })
      : await createLinearGradient({ colorStops: stops });
  canvas.requestRenderAll();
}

export function flipObject(obj: any, axis: "x" | "y") {
  if (axis === "x") obj.set("flipX", !obj.flipX);
  else obj.set("flipY", !obj.flipY);
  obj.setCoords();
}

export function rotateObjectBy(obj: any, degrees: number) {
  obj.set("angle", ((obj.angle || 0) + degrees) % 360);
  obj.setCoords();
}

export function setObjectLocked(obj: any, locked: boolean) {
  obj.set({
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    __locked: locked,
  });
}

export function isObjectLocked(obj: any): boolean {
  if (obj?.__locked != null) return Boolean(obj.__locked);
  return Boolean(obj?.lockMovementX && obj?.lockMovementY && obj?.hasControls === false);
}

export function bringToFront(canvas: any, obj: any) {
  canvas.bringObjectToFront(obj);
  canvas.requestRenderAll();
}

export function sendToBack(canvas: any, obj: any) {
  canvas.sendObjectToBack(obj);
  canvas.requestRenderAll();
}

/** Crop image with a centered rect clipPath. insetRatio 0.05–0.4 of each side. */
export async function applyImageCrop(img: any, insetRatio = 0.15) {
  const { Rect } = await import("fabric");
  const w = img.width || 100;
  const h = img.height || 100;
  const clip = new Rect({
    width: Math.max(8, w * (1 - insetRatio * 2)),
    height: Math.max(8, h * (1 - insetRatio * 2)),
    originX: "center",
    originY: "center",
    absolutePositioned: false,
  });
  img.set("clipPath", clip);
  img.setCoords();
}

export function clearImageCrop(img: any) {
  img.set("clipPath", undefined);
  img.setCoords();
}

/** Place a mid-size image from a permanent URL (never blob: — those break after save). */
export async function loadImageFromUrl(url: string, name = "upload") {
  const { FabricImage } = await import("fabric");
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  img.scaleToWidth(Math.min(480, CARD_ARTBOARD.width * 0.6));
  img.set({
    left: CARD_ARTBOARD.width / 2,
    top: CARD_ARTBOARD.height / 2,
    originX: "center",
    originY: "center",
    name: `upload:${name}`,
  });
  return img;
}

/**
 * Full-bleed invitation photo from a permanent URL (issue #12).
 * Covers the board, sits at the back, locked so it behaves as the card itself.
 */
export async function loadFullBleedCardImage(
  url: string,
  board: { width: number; height: number } = CARD_ARTBOARD,
  name = "card-photo"
) {
  const { FabricImage } = await import("fabric");
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  const iw = Math.max(1, img.width || 1);
  const ih = Math.max(1, img.height || 1);
  const scale = Math.max(board.width / iw, board.height / ih);
  img.set({
    left: board.width / 2,
    top: board.height / 2,
    originX: "center",
    originY: "center",
    scaleX: scale,
    scaleY: scale,
    name: `card-photo:${name}`,
    selectable: true,
    evented: true,
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    hasControls: false,
  });
  setObjectLocked(img, true);
  return img;
}

function isEphemeralImageSrc(src: unknown): src is string {
  return typeof src === "string" && (src.startsWith("blob:") || src.startsWith("data:"));
}

/**
 * Upload any canvas image still using blob:/data: srcs so the saved document stays loadable
 * on the invite page and after refresh.
 */
export async function persistEphemeralFabricImages(
  canvas: any,
  upload: (blob: Blob, fileName: string) => Promise<string>
): Promise<number> {
  if (!canvas) return 0;
  const objects = (canvas.getObjects?.() ?? []) as any[];
  let fixed = 0;
  for (const obj of objects) {
    if (obj?.type !== "image") continue;
    const src = obj.getSrc?.() ?? obj.src ?? obj._element?.src;
    if (!isEphemeralImageSrc(src)) continue;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const ext =
        blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      const permanent = await upload(blob, `invitation-asset.${ext}`);
      if (typeof obj.setSrc === "function") {
        await obj.setSrc(permanent, { crossOrigin: "anonymous" });
      } else {
        obj.set({ src: permanent });
      }
      obj.setCoords?.();
      fixed += 1;
    } catch (err) {
      console.error("Failed to persist fabric image", err);
    }
  }
  if (fixed > 0) canvas.requestRenderAll?.();
  return fixed;
}

/** True when a saved fabric document still points at session-only image URLs. */
export function fabricDocumentHasEphemeralImages(fabric: unknown): boolean {
  try {
    return JSON.stringify(fabric ?? "").includes('"blob:') || JSON.stringify(fabric ?? "").includes('"data:image');
  } catch {
    return false;
  }
}

export type LayerItem = {
  key: string;
  /** Index in canvas.getObjects() (0 = back). */
  index: number;
  label: string;
  type: string;
  locked: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object: any;
};

export function getLayerItems(canvas: any): LayerItem[] {
  if (!canvas) return [];
  const objects = canvas.getObjects() as any[];
  return objects
    .map((o, index) => ({
      key: `${index}-${o.type}-${o.name ?? ""}`,
      index,
      label: layerLabel(o, index),
      type: String(o.type || "object"),
      locked: isObjectLocked(o),
      object: o,
    }))
    .reverse();
}

export function layerLabel(obj: any, index: number): string {
  if (obj.name) {
    if (String(obj.name).startsWith("sticker:")) return String(obj.name).replace("sticker:", "Sticker ");
    if (String(obj.name).startsWith("upload:")) return String(obj.name).replace("upload:", "");
    return String(obj.name);
  }
  if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
    const t = String(obj.text || "Text").slice(0, 24);
    return t || "Text";
  }
  const type = String(obj.type || "Object");
  return `${type.charAt(0).toUpperCase()}${type.slice(1)} ${index + 1}`;
}

export function selectLayerObject(canvas: any, obj: any) {
  if (!canvas || !obj) return;
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
}

export function moveLayer(canvas: any, obj: any, direction: "up" | "down") {
  if (!canvas || !obj) return;
  if (direction === "up") canvas.bringObjectForward(obj);
  else canvas.sendObjectBackwards(obj);
  canvas.requestRenderAll();
}
