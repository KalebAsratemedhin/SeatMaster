"use client";

import { Loader2 } from "lucide-react";
import { BOARD_RESIZE_HANDLES } from "./constants";
import type { BoardSize } from "./types";

type StudioStageProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  boardSize: BoardSize;
  zoom: number;
  ready: boolean;
  initError: string | null;
  onClearSelection: () => void;
  onResizeHandlePointerDown: (
    handle: (typeof BOARD_RESIZE_HANDLES)[number]["id"]
  ) => (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizeHandlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizeHandlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function StudioStage({
  canvasRef,
  boardSize,
  zoom,
  ready,
  initError,
  onClearSelection,
  onResizeHandlePointerDown,
  onResizeHandlePointerMove,
  onResizeHandlePointerUp,
}: StudioStageProps) {
  return (
    <div
      className="relative min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(28,25,23,0.12)_1px,transparent_0)] [background-size:18px_18px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClearSelection();
      }}
    >
      {!ready && !initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#e8e4dc]/80 dark:bg-slate-950/80">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}
      {initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <p className="text-sm text-destructive">{initError}</p>
        </div>
      )}
      <div
        className="flex min-h-full min-w-full items-start justify-center p-6 md:p-10"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClearSelection();
        }}
      >
        <div
          className="relative bg-white shadow-[0_24px_80px_-20px_rgba(28,25,23,0.45)] ring-1 ring-black/10"
          style={{
            width: boardSize.width * zoom,
            height: boardSize.height * zoom,
          }}
        >
          <canvas ref={canvasRef} />
          {BOARD_RESIZE_HANDLES.map((h) => (
            <div
              key={h.id}
              role="presentation"
              title="Resize card"
              className={`absolute z-20 size-3.5 rounded-sm border border-white bg-primary shadow-sm ${h.className}`}
              style={{ cursor: h.cursor }}
              onPointerDown={onResizeHandlePointerDown(h.id)}
              onPointerMove={onResizeHandlePointerMove}
              onPointerUp={onResizeHandlePointerUp}
              onPointerCancel={onResizeHandlePointerUp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
