import { useCallback, useRef } from "react";
import {
  BOARD_MAX_HEIGHT,
  BOARD_MAX_WIDTH,
  BOARD_MIN_HEIGHT,
  BOARD_MIN_WIDTH,
} from "./constants";
import type { BoardResizeHandle, BoardSize } from "./types";

type UseBoardResizeArgs = {
  boardSize: BoardSize;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  zoom: number;
  onResizeCommit: () => void;
};

export function useBoardResize({
  boardSize,
  setBoardSize,
  zoom,
  onResizeCommit,
}: UseBoardResizeArgs) {
  const resizeDragRef = useRef<{
    handle: BoardResizeHandle;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const applyBoardSize = useCallback(
    (width: number, height: number) => {
      const nextW = Math.min(BOARD_MAX_WIDTH, Math.max(BOARD_MIN_WIDTH, Math.round(width)));
      const nextH = Math.min(BOARD_MAX_HEIGHT, Math.max(BOARD_MIN_HEIGHT, Math.round(height)));
      setBoardSize({ width: nextW, height: nextH });
    },
    [setBoardSize]
  );

  const onResizeHandlePointerDown =
    (handle: BoardResizeHandle) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeDragRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startW: boardSize.width,
        startH: boardSize.height,
      };
    };

  const onResizeHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / zoom;
    const dy = (e.clientY - drag.startY) / zoom;
    const { handle, startW, startH } = drag;
    let nextW = startW;
    let nextH = startH;
    if (handle.includes("e")) nextW = startW + dx;
    if (handle.includes("w")) nextW = startW - dx;
    if (handle.includes("s")) nextH = startH + dy;
    if (handle.includes("n")) nextH = startH - dy;
    applyBoardSize(nextW, nextH);
  };

  const onResizeHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragRef.current) return;
    resizeDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    onResizeCommit();
  };

  return {
    applyBoardSize,
    onResizeHandlePointerDown,
    onResizeHandlePointerMove,
    onResizeHandlePointerUp,
  };
}
