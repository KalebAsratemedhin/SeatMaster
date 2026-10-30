export type SeatPos = { left: number; top: number };

/** Evenly place seats on a circle (percent of table box). Starts at top, clockwise. */
export function roundSeatPositions(count: number, radiusPct = 50): SeatPos[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      left: 50 + radiusPct * Math.cos(angle),
      top: 50 + radiusPct * Math.sin(angle),
    };
  });
}

/**
 * Split `n` seats across 4 sides in proportion to side lengths, integers summing to n.
 * Returns [top, right, bottom, left].
 */
export function distributeRectSideCounts(
  n: number,
  aspectW: number,
  aspectH: number
): [number, number, number, number] {
  if (n <= 0) return [0, 0, 0, 0];
  const w = Math.max(aspectW, 0.01);
  const h = Math.max(aspectH, 0.01);
  const weights = [w, h, w, h]; // top, right, bottom, left
  const totalW = 2 * (w + h);
  const raw = weights.map((wt) => (n * wt) / totalW);
  const counts = raw.map((x) => Math.floor(x));
  const rem = n - counts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rem; k++) {
    counts[order[k % order.length].i]++;
  }
  return counts as [number, number, number, number];
}

/**
 * Place seats evenly on each rectangle edge, inset from corners so they don't cluster.
 * `aspectW`/`aspectH` should match the rendered table width:height.
 */
export function rectSeatPositions(
  count: number,
  aspectW = 2,
  aspectH = 1
): SeatPos[] {
  if (count <= 0) return [];

  const [topN, rightN, bottomN, leftN] = distributeRectSideCounts(
    count,
    aspectW,
    aspectH
  );
  const positions: SeatPos[] = [];

  // Inset from corners as a fraction of the edge (keeps seats off corners).
  const placeOnEdge = (
    n: number,
    edge: "top" | "right" | "bottom" | "left"
  ) => {
    if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      // Spread across the open middle of the edge: (i+1)/(n+1)
      const t = (i + 1) / (n + 1);
      if (edge === "top") positions.push({ left: t * 100, top: 0 });
      else if (edge === "right") positions.push({ left: 100, top: t * 100 });
      else if (edge === "bottom") positions.push({ left: (1 - t) * 100, top: 100 });
      else positions.push({ left: 0, top: (1 - t) * 100 });
    }
  };

  placeOnEdge(topN, "top");
  placeOnEdge(rightN, "right");
  placeOnEdge(bottomN, "bottom");
  placeOnEdge(leftN, "left");
  return positions;
}

export type TableFootprint = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Pixel box for a table card (must stay in sync with seating-chart-floor visuals).
 * Includes the status row under the table (~22px) so collision matches what you see.
 */
export function tableVisualSizePx(
  shape: string,
  capacity: number,
  rows: number | null | undefined,
  columns: number | null | undefined
): { width: number; height: number } {
  const s = (shape ?? "").toLowerCase();
  const n = Math.max(capacity, 1);
  let width: number;
  let height: number;
  if (s === "grid") {
    const cols = Math.max(1, columns ?? Math.ceil(Math.sqrt(n)));
    const r = Math.max(1, rows ?? Math.ceil(n / cols));
    const cell = 26;
    width = Math.max(88, cols * cell + 20);
    height = Math.max(72, r * cell + 28);
  } else if (s === "rectangular") {
    width = Math.min(300, Math.max(160, 120 + n * 12));
    height = Math.round(width / 2);
  } else {
    const size = Math.min(200, Math.max(96, 56 + n * 8));
    width = size;
    height = size;
  }
  // Status label under the card
  return { width, height: height + 22 };
}

/** Approximate on-floor size (%) for collision, based on shape and floor pixel size. */
export function estimateTableFootprintPct(
  shape: string,
  capacity: number,
  rows: number | null | undefined,
  columns: number | null | undefined,
  floorWidthPx: number,
  floorHeightPx: number
): { w: number; h: number } {
  const safeW = Math.max(floorWidthPx, 1);
  const safeH = Math.max(floorHeightPx, 1);
  const { width: pxW, height: pxH } = tableVisualSizePx(shape, capacity, rows, columns);
  // Small clearance so tables can sit near each other without jumpy rejection.
  const gapPx = 10;
  return {
    w: ((pxW + gapPx) / safeW) * 100,
    h: ((pxH + gapPx) / safeH) * 100,
  };
}

export function footprintsOverlap(
  a: TableFootprint,
  b: TableFootprint,
  paddingPct = 0.25
): boolean {
  const ax1 = a.x - a.w / 2 - paddingPct;
  const ax2 = a.x + a.w / 2 + paddingPct;
  const ay1 = a.y - a.h / 2 - paddingPct;
  const ay2 = a.y + a.h / 2 + paddingPct;
  const bx1 = b.x - b.w / 2;
  const bx2 = b.x + b.w / 2;
  const by1 = b.y - b.h / 2;
  const by2 = b.y + b.h / 2;
  return !(ax2 <= bx1 || ax1 >= bx2 || ay2 <= by1 || ay1 >= by2);
}
