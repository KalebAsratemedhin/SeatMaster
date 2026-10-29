/**
 * Invitation stickers from safe free packs vendored under /public/stickers.
 *
 * - Twemoji — CC-BY 4.0 (attribution required)
 * - Noto Emoji SVG — Apache 2.0
 *
 * See public/stickers/ATTRIBUTION.md
 */

export type StickerPack = "twemoji" | "noto";

export type StickerCategory =
  | "celebration"
  | "floral"
  | "love"
  | "food"
  | "nature"
  | "people";

export type StickerItem = {
  id: string;
  label: string;
  category: StickerCategory;
  pack: StickerPack;
  /** Hex codepoint file stem, e.g. "1f338" → /stickers/{pack}/1f338.svg */
  code: string;
};

function tw(
  code: string,
  label: string,
  category: StickerCategory
): StickerItem {
  return { id: `tw-${code}`, label, category, pack: "twemoji", code };
}

function noto(
  code: string,
  label: string,
  category: StickerCategory
): StickerItem {
  return { id: `noto-${code}`, label, category, pack: "noto", code };
}

/** Public URL for a vendored sticker SVG. */
export function stickerSrc(sticker: StickerItem): string {
  return `/stickers/${sticker.pack}/${sticker.code}.svg`;
}

/** Gallery preview (same as canvas source for SVG packs). */
export function stickerPreviewSrc(sticker: StickerItem): string {
  return stickerSrc(sticker);
}

export const INVITATION_STICKERS: StickerItem[] = [
  // —— Twemoji (CC-BY 4.0) ——
  tw("2764", "Red heart", "love"),
  tw("1f495", "Two hearts", "love"),
  tw("1f496", "Sparkling heart", "love"),
  tw("1f49d", "Heart ribbon", "love"),
  tw("1f49c", "Purple heart", "love"),
  tw("1f9e1", "Orange heart", "love"),
  tw("1f48d", "Ring", "love"),
  tw("1f48e", "Gem", "love"),
  tw("1f48b", "Kiss mark", "love"),
  tw("1f54a", "Dove", "love"),
  tw("1f490", "Bouquet", "floral"),
  tw("1f338", "Cherry blossom", "floral"),
  tw("1f339", "Rose", "floral"),
  tw("1f33a", "Hibiscus", "floral"),
  tw("1f33b", "Sunflower", "floral"),
  tw("1f337", "Tulip", "floral"),
  tw("1f33c", "Blossom", "floral"),
  tw("1f33f", "Herb", "nature"),
  tw("1f340", "Four leaf clover", "nature"),
  tw("1f341", "Maple leaf", "nature"),
  tw("1f342", "Fallen leaf", "nature"),
  tw("1f344", "Mushroom", "nature"),
  tw("1f31e", "Sun", "nature"),
  tw("1f319", "Crescent moon", "nature"),
  tw("1f370", "Shortcake", "food"),
  tw("1f382", "Birthday cake", "food"),
  tw("1f9c1", "Cupcake", "food"),
  tw("1f353", "Strawberry", "food"),
  tw("1f347", "Grapes", "food"),
  tw("1f377", "Wine glass", "food"),
  tw("1f378", "Cocktail", "food"),
  tw("1f37e", "Champagne", "celebration"),
  tw("1f942", "Clinking glasses", "celebration"),
  tw("1f37f", "Popcorn", "celebration"),
  tw("1f388", "Balloon", "celebration"),
  tw("1f389", "Party popper", "celebration"),
  tw("1f38a", "Confetti ball", "celebration"),
  tw("1f381", "Gift", "celebration"),
  tw("1f380", "Ribbon", "celebration"),
  tw("2728", "Sparkles", "celebration"),
  tw("1f4ab", "Dizzy", "celebration"),
  tw("1f3b5", "Music note", "celebration"),
  tw("1f3a4", "Microphone", "celebration"),
  tw("1f3a8", "Art palette", "celebration"),
  tw("1f4f7", "Camera", "celebration"),
  tw("1f451", "Crown", "celebration"),
  tw("1f3c6", "Trophy", "celebration"),
  tw("1f9f8", "Teddy bear", "celebration"),

  // —— Noto Emoji (Apache 2.0) — alternate style ——
  noto("1f338", "Cherry blossom", "floral"),
  noto("1f339", "Rose", "floral"),
  noto("1f33a", "Hibiscus", "floral"),
  noto("1f337", "Tulip", "floral"),
  noto("1f33b", "Sunflower", "floral"),
  noto("1f490", "Bouquet", "floral"),
  noto("1f341", "Maple leaf", "nature"),
  noto("1f31e", "Sun", "nature"),
  noto("1f48d", "Ring", "love"),
  noto("1f496", "Sparkling heart", "love"),
  noto("1f54a", "Dove", "love"),
  noto("1f370", "Shortcake", "food"),
  noto("1f382", "Birthday cake", "food"),
  noto("1f9c1", "Cupcake", "food"),
  noto("1f353", "Strawberry", "food"),
  noto("1f37e", "Champagne", "celebration"),
  noto("1f942", "Clinking glasses", "celebration"),
  noto("1f388", "Balloon", "celebration"),
  noto("1f389", "Party popper", "celebration"),
  noto("1f381", "Gift", "celebration"),
  noto("1f380", "Ribbon", "celebration"),
  noto("2728", "Sparkles", "celebration"),
  noto("1f3b5", "Music note", "celebration"),
  noto("1f4f7", "Camera", "celebration"),
];

export const STICKER_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "love", label: "Love" },
  { id: "floral", label: "Floral" },
  { id: "celebration", label: "Party" },
  { id: "food", label: "Food" },
  { id: "nature", label: "Nature" },
] as const;

export const STICKER_PACK_FILTERS = [
  { id: "all", label: "All packs" },
  { id: "twemoji", label: "Twemoji" },
  { id: "noto", label: "Noto" },
] as const;

export const STICKER_ATTRIBUTION = {
  twemoji:
    "Twemoji graphics © Twitter, Inc and contributors — CC-BY 4.0",
  noto: "Noto Emoji SVG © Google — Apache 2.0",
  short: "Stickers: Twemoji (CC-BY 4.0) · Noto Emoji (Apache 2.0)",
} as const;
