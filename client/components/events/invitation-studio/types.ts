// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FabricCanvas = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FabricObject = any;

export type BoardResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type LibraryPanel = "tools" | "stickers" | "patterns" | "fonts" | "templates";

export type Tool =
  | "select"
  | "text"
  | "rect"
  | "ellipse"
  | "triangle"
  | "line"
  | "curve"
  | "draw"
  | "upload";

export type BoardSize = { width: number; height: number };
