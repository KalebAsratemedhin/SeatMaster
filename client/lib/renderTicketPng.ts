import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { TicketResponse } from "@/lib/api/ticketApi";

/** Hex-only palette — never touches CSS color functions. */
const C = {
  white: "#ffffff",
  paper: "#f8fafc",
  ink: "#0f172a",
  muted: "#64748b",
  soft: "#94a3b8",
  line: "#e2e8f0",
  primary: "#b45309",
  primarySoft: "#fff7ed",
} as const;

export type TicketPngInput = Omit<TicketResponse, "seat_label" | "guest_seat_label"> & {
  /** Prefer event display name when it differs from ticket.event_name */
  display_event_name?: string;
  /** Seat assignment line(s), resolved client-side until ticket API includes seats (REQ-005). */
  seat_label?: string | null;
  guest_seat_label?: string | null;
  seats_display?: string | null;
};

async function renderQrCanvas(value: string, size: number): Promise<HTMLCanvasElement> {
  const { QRCodeCanvas } = await import("qrcode.react");
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none;";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    await new Promise<void>((resolve, reject) => {
      try {
        root.render(
          createElement(QRCodeCanvas, {
            value,
            size,
            level: "M",
            includeMargin: false,
            bgColor: C.white,
            fgColor: C.ink,
          })
        );
      } catch (e) {
        reject(e);
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const qr = host.querySelector("canvas");
    if (!qr) throw new Error("QR code canvas was not created");

    const copy = document.createElement("canvas");
    copy.width = size;
    copy.height = size;
    const ctx = copy.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context for QR copy");
    ctx.drawImage(qr, 0, 0);
    return copy;
  } finally {
    root.unmount();
    host.remove();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = C.muted;
  ctx.font = "600 11px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.letterSpacing = "0.12em";
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.letterSpacing = "0px";
}

/**
 * Renders a downloadable admission ticket as PNG via Canvas 2D only.
 * No DOM screenshot / CSS color parsing — immune to oklch/lab theme issues.
 */
export async function renderTicketPng(ticket: TicketPngInput): Promise<Blob> {
  const width = 900;
  const height = 420;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");
  ctx.scale(scale, scale);

  const eventTitle = ticket.display_event_name?.trim() || ticket.event_name;
  const stubX = width * 0.68;
  const qrSize = 120;
  const qrCanvas = await renderQrCanvas(ticket.ticket_id, qrSize);

  // Card background
  ctx.fillStyle = C.white;
  roundRect(ctx, 0, 0, width, height, 16);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, width - 2, height - 2, 16);
  ctx.stroke();

  // Stub panel
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.moveTo(stubX, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(stubX, height);
  ctx.closePath();
  ctx.fill();

  // Perforation (dashed vertical)
  ctx.save();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(stubX, 16);
  ctx.lineTo(stubX, height - 16);
  ctx.stroke();
  ctx.restore();

  // Notch circles on perforation
  for (const cy of [70, 150, 230, 310]) {
    ctx.beginPath();
    ctx.fillStyle = C.paper;
    ctx.arc(stubX, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Header badge
  ctx.fillStyle = C.primarySoft;
  roundRect(ctx, 36, 32, 48, 48, 10);
  ctx.fill();
  ctx.strokeStyle = C.primary;
  ctx.lineWidth = 2;
  // Simple calendar glyph
  roundRect(ctx, 46, 44, 28, 26, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(46, 52);
  ctx.lineTo(74, 52);
  ctx.stroke();
  ctx.fillStyle = C.primary;
  ctx.fillRect(52, 40, 3, 8);
  ctx.fillRect(65, 40, 3, 8);

  drawLabel(ctx, ticket.event_name, 100, 48);
  ctx.fillStyle = C.ink;
  ctx.font = "800 22px system-ui, -apple-system, Segoe UI, sans-serif";
  const title = eventTitle.length > 42 ? `${eventTitle.slice(0, 40)}…` : eventTitle;
  ctx.fillText(title, 100, 76);

  // Guest
  drawLabel(ctx, "Guest Name", 36, 160);
  ctx.fillStyle = C.primary;
  ctx.font = "900 36px system-ui, -apple-system, Segoe UI, sans-serif";
  const guest =
    ticket.guest_name.length > 28
      ? `${ticket.guest_name.slice(0, 26)}…`
      : ticket.guest_name;
  ctx.fillText(guest, 36, 200);

  // Date / time / seat
  drawLabel(ctx, "Date", 36, 250);
  ctx.fillStyle = C.ink;
  ctx.font = "700 16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(ticket.event_date || "—", 36, 274);

  drawLabel(ctx, "Time", 220, 250);
  ctx.fillStyle = C.ink;
  ctx.font = "700 16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`${ticket.start_time} - ${ticket.end_time}`, 220, 274);

  const seatsLine =
    ticket.seats_display?.trim() ||
    [ticket.seat_label, ticket.guest_seat_label].filter(Boolean).join(" · ");
  if (seatsLine) {
    drawLabel(ctx, "Seat", 420, 250);
    ctx.fillStyle = C.ink;
    ctx.font = "700 16px system-ui, -apple-system, Segoe UI, sans-serif";
    const seatText = seatsLine.length > 28 ? `${seatsLine.slice(0, 26)}…` : seatsLine;
    ctx.fillText(seatText, 420, 274);
  }

  if (ticket.location) {
    drawLabel(ctx, "Location", 36, 320);
    ctx.fillStyle = C.muted;
    ctx.font = "600 14px system-ui, -apple-system, Segoe UI, sans-serif";
    const loc =
      ticket.location.length > 48
        ? `${ticket.location.slice(0, 46)}…`
        : ticket.location;
    ctx.fillText(loc, 36, 344);
  }

  // QR block on stub
  const qrX = stubX + (width - stubX - qrSize) / 2;
  const qrY = 70;
  ctx.fillStyle = C.white;
  roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 10);
  ctx.fill();
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  drawLabel(ctx, "Ticket ID", stubX + (width - stubX) / 2 - 28, qrY + qrSize + 36);
  ctx.fillStyle = C.ink;
  ctx.font = "700 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText(`#${ticket.ticket_id.slice(0, 8)}`, stubX + (width - stubX) / 2, qrY + qrSize + 58);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to encode ticket PNG"));
        else resolve(blob);
      },
      "image/png",
      1
    );
  });
}

export async function downloadTicketPng(
  ticket: TicketPngInput,
  fileName: string
): Promise<void> {
  const blob = await renderTicketPng(ticket);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
    link.href = url;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
