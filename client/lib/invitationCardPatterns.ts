/**
 * Background / fill patterns from Hero Patterns (MIT).
 * Package: `hero-patterns` — https://github.com/lowmess/hero-patterns
 * Original designs: https://heropatterns.com (Steve Schoger)
 *
 * Also a few tiny original SVG “paper” textures (CC0 / SeatMaster).
 */

import * as hero from "hero-patterns";

export type PatternKind = "hero" | "paper";

export type PatternItem = {
  id: string;
  label: string;
  kind: PatternKind;
  /** hero-patterns export name */
  heroKey?: keyof typeof hero;
  /** Default pattern ink color */
  color: string;
  /** Fill opacity 0–1 */
  opacity: number;
  /** Suggested solid backdrop behind the pattern */
  backdrop: string;
  category: "formal" | "playful" | "nature" | "geometric" | "paper";
};

/** Strip `url('...')` wrapper from hero-patterns output → raw data URL. */
export function heroPatternDataUrl(
  key: keyof typeof hero,
  color: string,
  opacity: number
): string {
  const fn = hero[key];
  if (typeof fn !== "function") {
    throw new Error(`Unknown hero pattern: ${String(key)}`);
  }
  const wrapped = fn(color, opacity);
  const m = /^url\(['"]?(.*?)['"]?\)$/.exec(wrapped);
  return m?.[1] ?? wrapped;
}

/** Original paper textures as inline SVG data URLs (CC0). */
export function paperTextureDataUrl(id: string, ink = "#78716c", opacity = 0.35): string {
  const o = opacity;
  const bodies: Record<string, string> = {
    linen: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 12h24M12 0v24" stroke="${ink}" stroke-opacity="${o}" stroke-width="0.5"/></svg>`,
    dots: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1" fill="${ink}" fill-opacity="${o}"/></svg>`,
    grain: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="4" cy="8" r="0.6" fill="${ink}" fill-opacity="${o}"/><circle cx="18" cy="3" r="0.5" fill="${ink}" fill-opacity="${o * 0.8}"/><circle cx="30" cy="14" r="0.7" fill="${ink}" fill-opacity="${o}"/><circle cx="12" cy="22" r="0.5" fill="${ink}" fill-opacity="${o * 0.7}"/><circle cx="26" cy="28" r="0.6" fill="${ink}" fill-opacity="${o}"/><circle cx="8" cy="34" r="0.5" fill="${ink}" fill-opacity="${o * 0.9}"/><circle cx="35" cy="36" r="0.55" fill="${ink}" fill-opacity="${o}"/></svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M20 0H0v20" fill="none" stroke="${ink}" stroke-opacity="${o}" stroke-width="0.5"/></svg>`,
  };
  const svg = bodies[id] ?? bodies.dots;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function patternDataUrl(item: PatternItem, color?: string, opacity?: number): string {
  const c = color ?? item.color;
  const o = opacity ?? item.opacity;
  if (item.kind === "hero" && item.heroKey) {
    return heroPatternDataUrl(item.heroKey, c, o);
  }
  return paperTextureDataUrl(item.id.replace(/^paper-/, ""), c, o);
}

export const INVITATION_PATTERNS: PatternItem[] = [
  // Formal / invitation-flavored
  {
    id: "formal-invitation",
    label: "Formal invitation",
    kind: "hero",
    heroKey: "formalInvitation",
    color: "#a8a29e",
    opacity: 0.35,
    backdrop: "#1c1917",
    category: "formal",
  },
  {
    id: "topography",
    label: "Topography",
    kind: "hero",
    heroKey: "topography",
    color: "#d4a574",
    opacity: 0.25,
    backdrop: "#1c1917",
    category: "formal",
  },
  {
    id: "morphing-diamonds",
    label: "Diamonds",
    kind: "hero",
    heroKey: "morphingDiamonds",
    color: "#c4b5a0",
    opacity: 0.3,
    backdrop: "#292524",
    category: "formal",
  },
  {
    id: "bank-note",
    label: "Bank note",
    kind: "hero",
    heroKey: "bankNote",
    color: "#94a3b8",
    opacity: 0.2,
    backdrop: "#0f172a",
    category: "formal",
  },
  {
    id: "graph-paper",
    label: "Graph paper",
    kind: "hero",
    heroKey: "graphPaper",
    color: "#cbd5e1",
    opacity: 0.55,
    backdrop: "#f8fafc",
    category: "geometric",
  },
  {
    id: "diagonal-lines",
    label: "Diagonal lines",
    kind: "hero",
    heroKey: "diagonalLines",
    color: "#94a3b8",
    opacity: 0.35,
    backdrop: "#f1f5f9",
    category: "geometric",
  },
  {
    id: "tiny-checkers",
    label: "Tiny checkers",
    kind: "hero",
    heroKey: "tinyCheckers",
    color: "#a8a29e",
    opacity: 0.25,
    backdrop: "#fafaf9",
    category: "geometric",
  },
  {
    id: "polka-dots",
    label: "Polka dots",
    kind: "hero",
    heroKey: "polkaDots",
    color: "#f9a8d4",
    opacity: 0.45,
    backdrop: "#fff1f2",
    category: "playful",
  },
  {
    id: "bubbles",
    label: "Bubbles",
    kind: "hero",
    heroKey: "bubbles",
    color: "#93c5fd",
    opacity: 0.4,
    backdrop: "#eff6ff",
    category: "playful",
  },
  {
    id: "zigzag",
    label: "Zigzag",
    kind: "hero",
    heroKey: "zigZag",
    color: "#c4b5fd",
    opacity: 0.35,
    backdrop: "#f5f3ff",
    category: "playful",
  },
  {
    id: "tic-tac-toe",
    label: "Tic tac toe",
    kind: "hero",
    heroKey: "ticTacToe",
    color: "#fda4af",
    opacity: 0.35,
    backdrop: "#fff7ed",
    category: "playful",
  },
  {
    id: "leaf",
    label: "Leaf",
    kind: "hero",
    heroKey: "leaf",
    color: "#86efac",
    opacity: 0.4,
    backdrop: "#f0fdf4",
    category: "nature",
  },
  {
    id: "bamboo",
    label: "Bamboo",
    kind: "hero",
    heroKey: "bamboo",
    color: "#4ade80",
    opacity: 0.3,
    backdrop: "#ecfdf5",
    category: "nature",
  },
  {
    id: "overlapping-circles",
    label: "Overlapping circles",
    kind: "hero",
    heroKey: "overlappingCircles",
    color: "#f9a8d4",
    opacity: 0.3,
    backdrop: "#fdf2f8",
    category: "nature",
  },
  {
    id: "endless-clouds",
    label: "Clouds",
    kind: "hero",
    heroKey: "endlessClouds",
    color: "#bae6fd",
    opacity: 0.5,
    backdrop: "#f0f9ff",
    category: "nature",
  },
  {
    id: "four-point-stars",
    label: "Stars",
    kind: "hero",
    heroKey: "fourPointStars",
    color: "#fde68a",
    opacity: 0.45,
    backdrop: "#1e1b4b",
    category: "playful",
  },
  {
    id: "hideout",
    label: "Hideout",
    kind: "hero",
    heroKey: "hideout",
    color: "#e2e8f0",
    opacity: 0.4,
    backdrop: "#ffffff",
    category: "geometric",
  },
  {
    id: "plus",
    label: "Plus",
    kind: "hero",
    heroKey: "plus",
    color: "#cbd5e1",
    opacity: 0.45,
    backdrop: "#ffffff",
    category: "geometric",
  },
  // Original paper textures
  {
    id: "paper-linen",
    label: "Linen",
    kind: "paper",
    color: "#a8a29e",
    opacity: 0.35,
    backdrop: "#f5f0e8",
    category: "paper",
  },
  {
    id: "paper-dots",
    label: "Soft dots",
    kind: "paper",
    color: "#a8a29e",
    opacity: 0.3,
    backdrop: "#fafaf9",
    category: "paper",
  },
  {
    id: "paper-grain",
    label: "Paper grain",
    kind: "paper",
    color: "#78716c",
    opacity: 0.4,
    backdrop: "#f5f5f4",
    category: "paper",
  },
  {
    id: "paper-grid",
    label: "Fine grid",
    kind: "paper",
    color: "#d6d3d1",
    opacity: 0.5,
    backdrop: "#ffffff",
    category: "paper",
  },
];

export const PATTERN_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "formal", label: "Formal" },
  { id: "playful", label: "Playful" },
  { id: "nature", label: "Nature" },
  { id: "geometric", label: "Geo" },
  { id: "paper", label: "Paper" },
] as const;

export const PATTERN_ATTRIBUTION =
  "Patterns: Hero Patterns (MIT) via hero-patterns · paper textures original (CC0)";
