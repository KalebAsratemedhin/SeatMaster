"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventTableResponse } from "@/lib/api/eventsApi";
import {
  estimateTableFootprintPct,
  footprintsOverlap,
  rectSeatPositions,
  roundSeatPositions,
  tableVisualSizePx,
  type TableFootprint,
} from "@/lib/seatingLayout";

type SeatingChartFloorProps = {
  tables: EventTableResponse[];
  selectable?: boolean;
  selectedSeatIds?: string[];
  onSeatSelect?: (seatId: string) => void;
  currentInviteId?: string | null;
  showDelete?: boolean;
  onDeleteTable?: (tableId: string) => void;
  onReorder?: (orderedTableIds: string[]) => void;
  onPositionChange?: (tableId: string, x: number, y: number) => void;
  /** Duplicate a table (shape/capacity); parent creates via API. */
  onDuplicateTable?: (source: EventTableResponse) => void;
};

type TableClipboard = {
  shape: EventTableResponse["shape"];
  capacity: number;
  rows?: number | null;
  columns?: number | null;
};

type DragState = {
  tableId: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  /** Table center − pointer at grab, so large grids don’t jump to the cursor. */
  grabOffsetX: number;
  grabOffsetY: number;
  valid: boolean;
};

function sortedSeats(t: EventTableResponse) {
  return [...t.seats].sort((a, b) => a.display_order - b.display_order);
}

function tableVisualSize(t: EventTableResponse) {
  const full = tableVisualSizePx(
    t.shape,
    Math.max(t.capacity, t.seats.length, 1),
    t.rows,
    t.columns
  );
  // Card body only (footprint helper includes status row).
  return { width: full.width, height: full.height - 22 };
}

export function SeatingChartFloor({
  tables,
  selectable = false,
  selectedSeatIds = [],
  onSeatSelect,
  currentInviteId = null,
  showDelete = false,
  onDeleteTable,
  onReorder,
  onPositionChange,
  onDuplicateTable,
}: SeatingChartFloorProps) {
  const floorRef = useRef<HTMLDivElement>(null);
  const [floorSize, setFloorSize] = useState({ w: 800, h: 500 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [positionOverrides, setPositionOverrides] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<TableClipboard | null>(null);
  const canMove = showDelete && !!onPositionChange;
  const canReorder = showDelete && !!onReorder && !onPositionChange;
  const canEditLayout = showDelete && (!!onPositionChange || !!onDuplicateTable);

  const dragActiveRef = useRef(false);
  const restingFootprintsRef = useRef<Map<string, TableFootprint>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragRef = useRef<DragState | null>(null);

  useEffect(() => {
    dragActiveRef.current = drag != null;
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    const el = floorRef.current;
    if (!el) return;
    const update = () => {
      // Resizing mid-drag changes % math and makes large (grid) tables flicker.
      if (dragActiveRef.current) return;
      const r = el.getBoundingClientRect();
      setFloorSize((prev) => {
        if (Math.abs(prev.w - r.width) < 2 && Math.abs(prev.h - r.height) < 2) {
          return prev;
        }
        return { w: r.width, h: r.height };
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drop optimistic overrides once server positions catch up (queue to avoid sync setState-in-effect lint)
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setPositionOverrides((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const t of tables) {
          const o = next[t.id];
          if (!o) continue;
          if (
            t.position_x != null &&
            t.position_y != null &&
            Math.abs(t.position_x - o.x) < 0.05 &&
            Math.abs(t.position_y - o.y) < 0.05
          ) {
            delete next[t.id];
            changed = true;
          }
        }
        const ids = new Set(tables.map((t) => t.id));
        for (const id of Object.keys(next)) {
          if (!ids.has(id)) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [tables]);

  const baseItems = useMemo(() => {
    return [...tables]
      .sort((a, b) => a.display_order - b.display_order)
      .map((t, index) => {
        const override = positionOverrides[t.id];
        const hasPosition =
          t.position_x != null &&
          t.position_y != null &&
          (t.position_x !== 0 || t.position_y !== 0);
        const x = override?.x ?? (hasPosition ? t.position_x! : 20 + (index % 4) * 22);
        const y = override?.y ?? (hasPosition ? t.position_y! : 25 + Math.floor(index / 4) * 25);
        return { t, index, x, y };
      });
  }, [tables, positionOverrides]);

  const items = useMemo(() => {
    if (!drag) return baseItems;
    return baseItems.map((item) =>
      item.t.id === drag.tableId ? { ...item, x: drag.x, y: drag.y } : item
    );
  }, [baseItems, drag]);

  /** Footprints at resting positions (ignore live drag) for stable collision checks. */
  const restingFootprints = useMemo(() => {
    const map = new Map<string, TableFootprint>();
    for (const { t, x, y } of baseItems) {
      const size = estimateTableFootprintPct(
        t.shape,
        t.capacity,
        t.rows,
        t.columns,
        floorSize.w,
        floorSize.h
      );
      map.set(t.id, { x, y, w: size.w, h: size.h });
    }
    return map;
  }, [baseItems, floorSize]);

  useEffect(() => {
    restingFootprintsRef.current = restingFootprints;
  }, [restingFootprints]);

  const clampFloorPct = useCallback((x: number, y: number) => {
    return {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  }, []);

  const clientToFloorPct = useCallback(
    (clientX: number, clientY: number) => {
      const el = floorRef.current;
      if (!el) return { x: 50, y: 50 };
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      return clampFloorPct(x, y);
    },
    [clampFloorPct]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, tableId: string, x: number, y: number) => {
      e.stopPropagation();
      if (!canMove) {
        if (canEditLayout) setSelectedTableId(tableId);
        return;
      }
      if ((e.target as HTMLElement).closest("button")) {
        if (canEditLayout) setSelectedTableId(tableId);
        return;
      }
      e.preventDefault();
      const pointer = clientToFloorPct(e.clientX, e.clientY);
      setSelectedTableId(tableId);
      setDrag({
        tableId,
        x,
        y,
        originX: x,
        originY: y,
        grabOffsetX: x - pointer.x,
        grabOffsetY: y - pointer.y,
        valid: true,
      });
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [canMove, canEditLayout, clientToFloorPct]
  );

  const clearSelection = useCallback(() => {
    setSelectedTableId(null);
  }, []);

  const copySelected = useCallback(() => {
    const t = tables.find((x) => x.id === selectedTableId);
    if (!t) return;
    setClipboard({
      shape: t.shape,
      capacity: t.capacity,
      rows: t.rows,
      columns: t.columns,
    });
  }, [tables, selectedTableId]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard || !onDuplicateTable) return;
    const source = tables.find((x) => x.id === selectedTableId) ?? tables[0];
    if (!source) return;
    onDuplicateTable({
      ...source,
      shape: clipboard.shape,
      capacity: clipboard.capacity,
      rows: clipboard.rows ?? undefined,
      columns: clipboard.columns ?? undefined,
    });
  }, [clipboard, onDuplicateTable, tables, selectedTableId]);

  useEffect(() => {
    if (!canEditLayout) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "Escape") {
        setSelectedTableId(null);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
      }
      if (mod && e.key.toLowerCase() === "d" && selectedTableId && onDuplicateTable) {
        e.preventDefault();
        const t = tables.find((x) => x.id === selectedTableId);
        if (t) onDuplicateTable(t);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEditLayout, copySelected, pasteClipboard, selectedTableId, onDuplicateTable, tables]);

  const dragTableId = drag?.tableId ?? null;

  useEffect(() => {
    if (!dragTableId || !canMove) return;

    const overlaps = (tableId: string, x: number, y: number) => {
      const map = restingFootprintsRef.current;
      const moving = map.get(tableId);
      if (!moving) return false;
      const candidate: TableFootprint = { ...moving, x, y };
      for (const [id, other] of map) {
        if (id === tableId) continue;
        if (footprintsOverlap(candidate, other)) return true;
      }
      return false;
    };

    const flushDrag = () => {
      dragRafRef.current = null;
      const next = pendingDragRef.current;
      if (!next) return;
      setDrag(next);
    };

    const onMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const pointer = clientToFloorPct(e.clientX, e.clientY);
      const next = clampFloorPct(
        pointer.x + current.grabOffsetX,
        pointer.y + current.grabOffsetY
      );
      const valid = !overlaps(current.tableId, next.x, next.y);
      pendingDragRef.current = { ...current, x: next.x, y: next.y, valid };
      if (dragRafRef.current == null) {
        dragRafRef.current = requestAnimationFrame(flushDrag);
      }
    };

    const onUp = () => {
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
        if (pendingDragRef.current) setDrag(pendingDragRef.current);
      }
      const current = pendingDragRef.current ?? dragRef.current;
      pendingDragRef.current = null;
      setDrag(null);
      if (!current) return;
      if (!current.valid) return;
      if (
        Math.abs(current.x - current.originX) < 0.2 &&
        Math.abs(current.y - current.originY) < 0.2
      ) {
        return;
      }
      setPositionOverrides((prev) => ({
        ...prev,
        [current.tableId]: { x: current.x, y: current.y },
      }));
      onPositionChange?.(current.tableId, current.x, current.y);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragTableId, canMove, clientToFloorPct, clampFloorPct, onPositionChange]);

  // Fixed canvas size — growing the floor with table positions reflows % math and
  // makes large grids feel like they’re shoving space around.
  const floorMinHeight = 560;
  const floorMinWidth = 720;

  const renderTableCard = (t: EventTableResponse, isDragging: boolean, dragValid: boolean) => {
    const seats = sortedSeats(t);
    const assigned = seats.filter((s) => s.invite_id != null).length;
    const isFull = assigned >= t.capacity;
    const shape = (t.shape ?? "").toLowerCase();
    const isRect = shape === "rectangular";
    const isGrid = shape === "grid";
    const isRound = !isRect && !isGrid;
    const visual = tableVisualSize(t);
    const aspectW = visual.width;
    const aspectH = visual.height;
    const seatPositions = isRound
      ? roundSeatPositions(seats.length, 50)
      : isRect
        ? rectSeatPositions(seats.length, aspectW, aspectH)
        : [];

    const cols = Math.max(
      1,
      t.columns ?? Math.ceil(Math.sqrt(Math.max(seats.length, 1)))
    );
    const rows = Math.max(
      1,
      t.rows ?? Math.ceil(Math.max(seats.length, 1) / cols)
    );

    // Keep seat dots readable but not piled when capacity is high
    const borderSeatPx = Math.max(
      12,
      Math.min(22, Math.floor((isRound ? visual.width : Math.min(visual.width, visual.height)) / (Math.max(seats.length, 1) * 0.45 + 4)))
    );
    const gridSeatPx = Math.max(
      12,
      Math.min(20, Math.floor(Math.min(visual.width / cols, visual.height / rows) * 0.55))
    );

    const tableLabel = (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[1] px-2">
        <span
          className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${
            isFull ? "text-primary" : "text-[#111418] dark:text-white group-hover:text-primary"
          }`}
        >
          {t.name.toUpperCase()}
        </span>
        <span className="text-[9px] sm:text-[10px] text-[#617589] text-center">
          {assigned}/{t.capacity}
        </span>
      </div>
    );

    const seatClass = (s: (typeof seats)[0]) => {
      const isMySeat = currentInviteId != null && s.invite_id === currentInviteId;
      const assignedSeat = s.invite_id != null && !isMySeat;
      const isSelected = selectable && selectedSeatIds.includes(s.id);
      const canSelect = selectable && (!assignedSeat || isMySeat);
      return {
        canSelect,
        className: `rounded-full border-2 border-slate-400 dark:border-slate-500 shrink-0 shadow-sm
          ${assignedSeat ? "bg-primary" : isSelected ? "bg-primary ring-2 ring-primary" : canSelect ? "bg-gray-200 dark:bg-gray-700 cursor-pointer hover:ring-2 hover:ring-primary/50" : "bg-gray-100 dark:bg-gray-700"}`,
      };
    };

    return (
      <div
        className={`flex flex-col items-center gap-2 select-none ${
          isDragging ? "opacity-90" : ""
        }`}
      >
        <div
          className={`relative group transition-shadow
            ${canMove || canReorder ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
            ${isRound ? "rounded-full" : "rounded-lg"}
            ${
              isDragging && !dragValid
                ? "bg-red-500/10 border-2 border-red-500 ring-4 ring-red-500/20"
                : isFull
                  ? "bg-primary/10 border-2 border-primary ring-4 ring-primary/10 shadow-lg"
                  : "bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-primary"
            }
          `}
          style={{
            width: visual.width,
            height: visual.height,
          }}
        >
          {!isGrid && tableLabel}
          {isGrid ? (
            <>
              <div className="absolute top-1 left-1.5 right-1.5 flex justify-between items-center pointer-events-none z-10">
                <span
                  className={`text-[10px] font-bold truncate ${
                    isFull ? "text-primary" : "text-[#111418] dark:text-white"
                  }`}
                >
                  {t.name.toUpperCase()}
                </span>
                <span className="text-[9px] text-[#617589] shrink-0 ml-1">
                  {assigned}/{t.capacity}
                </span>
              </div>
              <div
                className="absolute inset-0 grid pt-6 px-1.5 pb-1.5"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                  gap: "3px",
                }}
              >
                {seats.map((s) => {
                  const meta = seatClass(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`justify-self-center self-center ${meta.className}`}
                      style={{ width: gridSeatPx, height: gridSeatPx }}
                      disabled={!meta.canSelect}
                      onClick={() => meta.canSelect && onSeatSelect?.(s.id)}
                      title={`${t.name} - Seat ${s.label}`}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            seats.map((s, idx) => {
              const pos = seatPositions[idx];
              if (!pos) return null;
              const meta = seatClass(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`absolute z-[2] -translate-x-1/2 -translate-y-1/2 ${meta.className}`}
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    width: borderSeatPx,
                    height: borderSeatPx,
                  }}
                  disabled={!meta.canSelect}
                  onClick={() => meta.canSelect && onSeatSelect?.(s.id)}
                  title={`${t.name} - Seat ${s.label}`}
                />
              );
            })
          )}
          {showDelete && onDeleteTable && (
            <button
              type="button"
              className="absolute -top-1 -right-1 size-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTable(t.id);
              }}
              aria-label={`Delete ${t.name}`}
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full shrink-0 ${
              isFull
                ? "bg-primary"
                : assigned > 0
                  ? "bg-primary/70"
                  : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
          <span className="text-[11px] font-medium text-[#617589]">
            {isFull
              ? "Full"
              : assigned > 0
                ? `${t.capacity - assigned} left`
                : "Empty"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-inner overflow-hidden flex flex-col">
      <div
        className="overflow-auto flex-1 min-h-0 scrollbar-thin"
        style={{ maxHeight: "min(70vh, 600px)" }}
      >
        <div
          className="flex w-full flex-col bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"
          style={{
            backgroundColor: "var(--chart-bg, #f6f7f8)",
            minHeight: Math.max(400, floorMinHeight + 60),
            minWidth: floorMinWidth,
          }}
          onPointerDown={(e) => {
            if (!canEditLayout) return;
            if ((e.target as HTMLElement).closest("[data-table-id]")) return;
            clearSelection();
          }}
        >
          <div className="sticky top-0 left-0 right-0 z-20 flex justify-center shrink-0 py-2 px-4 sm:px-6 bg-[#f6f7f8] dark:bg-[#111318]">
            <div className="w-72 sm:w-96 h-10 sm:h-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#617589]">
                Main Stage / Head Table
              </span>
            </div>
          </div>
          <div
            ref={floorRef}
            className="relative w-full flex-1 touch-none pb-8"
            style={{ minHeight: floorMinHeight }}
          >
            {items.map(({ t, x, y }) => {
              const isDragging = drag?.tableId === t.id;
              const dragValid = drag?.valid ?? true;
              const isSelected = selectedTableId === t.id;
              return (
                <div
                  key={t.id}
                  data-table-id={t.id}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
                    isDragging ? "z-30" : ""
                  } ${
                    drag || isDragging
                      ? ""
                      : "transition-[left,top] duration-150 ease-out"
                  } ${isSelected && canEditLayout ? "ring-2 ring-primary/60 ring-offset-2 rounded-xl" : ""}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onPointerDown={(e) => handlePointerDown(e, t.id, x, y)}
                >
                  {renderTableCard(t, isDragging, dragValid)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-[#617589] text-xs">
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" />
            <span>Assigned Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <span>Available Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border-2 border-dashed border-primary/50" />
            <span>Table</span>
          </div>
        </div>
        {selectable && (
          <p className="text-[#617589] text-xs">Click an available seat to select it.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {canEditLayout && onDuplicateTable && (
            <>
              <button
                type="button"
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                disabled={!selectedTableId}
                onClick={copySelected}
              >
                Copy
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                disabled={!clipboard}
                onClick={pasteClipboard}
              >
                Paste
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                disabled={!selectedTableId}
                onClick={() => {
                  const t = tables.find((x) => x.id === selectedTableId);
                  if (t) onDuplicateTable(t);
                }}
              >
                Duplicate
              </button>
            </>
          )}
          {(canMove || canReorder) && (
            <p className="text-[#617589] text-xs">
              {canMove
                ? "Drag to place · click empty floor or Esc to deselect · ⌘/Ctrl+C/V copy-paste"
                : "Drag tables or sitting areas to reorder."}
            </p>
          )}
          {drag && !drag.valid && (
            <p className="text-red-600 text-xs font-medium">Too close to another table</p>
          )}
        </div>
      </div>
    </div>
  );
}
