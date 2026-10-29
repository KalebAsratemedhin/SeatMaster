import type { BoardResizeHandle } from "./types";

export const BOARD_RESIZE_HANDLES: {
  id: BoardResizeHandle;
  className: string;
  cursor: string;
}[] = [
  { id: "n", className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
  { id: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { id: "e", className: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2", cursor: "ew-resize" },
  { id: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { id: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { id: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { id: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
  { id: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
];

export const BOARD_MIN_WIDTH = 400;
export const BOARD_MAX_WIDTH = 2400;
export const BOARD_MIN_HEIGHT = 400;
export const BOARD_MAX_HEIGHT = 3200;
