"use client";

import { useCallback, useRef, useState } from "react";
import type { EventTableResponse } from "@/lib/api/eventsApi";

/** Seat centers on the round table dotted border (circle). % is of container. Order: N, S, E, W, NE, NW, SE, SW. */
const ROUND_POSITIONS = [
  { className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
  { className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" },
  { className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2" },
  { className: "left-[85.36%] top-[14.64%] -translate-x-1/2 -translate-y-1/2" },
  { className: "left-[14.64%] top-[14.64%] -translate-x-1/2 -translate-y-1/2" },
  { className: "left-[85.36%] top-[85.36%] -translate-x-1/2 -translate-y-1/2" },
  { className: "left-[14.64%] top-[85.36%] -translate-x-1/2 -translate-y-1/2" },
];

/** Seat centers on the rectangular table dotted border. Order: top L, top C, top R, bottom L, bottom C, bottom R, left, right. */
const RECT_POSITIONS = [
  { className: "top-0 left-[12.5%] -translate-x-1/2 -translate-y-1/2" },
  { className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { className: "top-0 left-[87.5%] -translate-x-1/2 -translate-y-1/2" },
  { className: "bottom-0 left-[12.5%] -translate-x-1/2 translate-y-1/2" },
  { className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
  { className: "bottom-0 left-[87.5%] -translate-x-1/2 translate-y-1/2" },
  { className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" },
  { className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2" },
];

type SeatingChartFloorProps = {
  tables: EventTableResponse[];
  /** For RSVP: when set, seats are clickable */
  selectable?: boolean;
  selectedSeatId?: number | null;
  onSeatSelect?: (seatId: number) => void;
  /** When selectable, seats assigned to this invite id are still clickable (current user's seat) */
  currentInviteId?: number | null;
  /** When true, show delete on tables (event detail owner view) */
  showDelete?: boolean;
  onDeleteTable?: (tableId: number) => void;
  /** When set, tables/sitting areas can be dragged to reorder. Called with new ordered table ids. */
  onReorder?: (orderedTableIds: number[]) => void;
  /** When set, tables/sitting areas can be dragged to place anywhere. Called with table id and position (0-100%). */
  onPositionChange?: (tableId: number, x: number, y: number) => void;
};

export function SeatingChartFloor({
  tables,
  selectable = false,
  selectedSeatId = null,
  onSeatSelect,
  currentInviteId = null,
  showDelete = false,
  onDeleteTable,
  onReorder,
  onPositionChange,
}: SeatingChartFloorProps) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const canMove = showDelete && !!onPositionChange;
  const canReorder = showDelete && !!onReorder && !onPositionChange;

  const handleDragStart = useCallback(
    (e: React.DragEvent, tableId: number) => {
      if (!canMove && !canReorder) return;
      e.dataTransfer.setData("application/json", JSON.stringify({ tableId }));
      e.dataTransfer.effectAllowed = "move";
      setDraggedId(tableId);
    },
    [canMove, canReorder]
  );

  const handleFloorDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleFloorDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggedId(null);
      if (!onPositionChange) return;
      const payload = e.dataTransfer.getData("application/json");
      if (!payload) return;
      let tableId: number;
      try {
        const { tableId: id } = JSON.parse(payload) as { tableId: number };
        tableId = id;
      } catch {
        return;
      }
      const el = floorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      onPositionChange(tableId, clampedX, clampedY);
    },
    [onPositionChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const isGridShape = (t: EventTableResponse) =>
    (t.shape ?? "").toLowerCase() === "grid";

  // All items for free placement, sorted by display_order; position from API or default grid
  const items = [...tables].sort((a, b) => a.display_order - b.display_order).map((t, index) => {
    const hasPosition = (t.position_x != null && t.position_y != null) && (t.position_x !== 0 || t.position_y !== 0);
    const px = hasPosition ? t.position_x! : 20 + (index % 4) * 22;
    const py = hasPosition ? t.position_y! : 25 + Math.floor(index / 4) * 25;
    return { t, index, x: px, y: py };
  });

  // Grow floor so the grey area always contains all tables (and has room for more)
  const maxX = items.length > 0 ? Math.max(...items.map((i) => i.x), 60) : 60;
  const maxY = items.length > 0 ? Math.max(...items.map((i) => i.y), 50) : 50;
  const floorMinHeight = Math.max(380, (maxY / 100) * 1000);
  const floorMinWidth = Math.max(400, (maxX / 100) * 800);

  const renderTableCard = (t: EventTableResponse) => {
    const assigned = t.seats.filter((s) => s.invite_id != null).length;
    const isFull = assigned >= t.capacity;
    const shape = (t.shape ?? "").toLowerCase();
    const isRect = shape === "rectangular";
    const isGrid = shape === "grid";
    const isRound = !isRect && !isGrid;
    const positions = isRound ? ROUND_POSITIONS : RECT_POSITIONS;
    const tableLabel = (
      <>
        <span className={`text-xs font-bold ${isFull ? "text-[#10b981]" : "text-[#111418] dark:text-white group-hover:text-[#10b981]"}`}>
          {t.name.toUpperCase()}
        </span>
        <span className="text-[10px] text-[#617589]">
          Capacity: {assigned}/{t.capacity}
        </span>
      </>
    );

    return (
      <div
        key={t.id}
        className={`flex flex-col items-center gap-2 transition-all ${draggedId === t.id ? "opacity-60" : ""}`}
        draggable={canMove || canReorder}
        onDragStart={(e) => handleDragStart(e, t.id)}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`relative flex flex-col items-center justify-center group transition-all ${canMove || canReorder ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
            ${isRound ? "size-24 sm:size-32 rounded-full" : isGrid ? "rounded-lg p-2 min-w-[80px] min-h-[60px]" : "w-36 sm:w-48 h-16 sm:h-24 rounded-lg"}
            ${isFull ? "bg-[#10b981]/10 dark:bg-emerald-900/30 border-2 border-[#10b981] ring-4 ring-[#10b981]/10 shadow-lg" : "bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-[#10b981]"}
          `}
          style={
            isGrid
              ? {
                  width: "auto",
                  minWidth: `${Math.max(2, t.columns ?? 2) * 24 + 24}px`,
                  minHeight: `${Math.max(2, t.rows ?? 2) * 24 + 32}px`,
                }
              : undefined
          }
        >
          {!isGrid && tableLabel}
          {isGrid ? (
            <>
              <div className="absolute top-1 left-1 right-1 flex justify-between items-center pointer-events-none z-10">
                <span className={`text-[10px] font-bold ${isFull ? "text-[#10b981]" : "text-[#111418] dark:text-white"}`}>
                  {t.name.toUpperCase()}
                </span>
                <span className="text-[9px] text-[#617589]">{assigned}/{t.capacity}</span>
              </div>
              <div
                className="grid gap-0.5 w-full flex-1 place-items-center mt-8"
                style={{
                  gridTemplateColumns: `repeat(${t.columns ?? Math.ceil(Math.sqrt(t.capacity))}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${t.rows ?? Math.ceil(t.capacity / (t.columns ?? Math.ceil(Math.sqrt(t.capacity))))}, minmax(0, 1fr))`,
                }}
              >
                {t.seats.map((s) => {
                  const isMySeat = currentInviteId != null && s.invite_id === currentInviteId;
                  const assignedSeat = s.invite_id != null && !isMySeat;
                  const isSelected = selectable && selectedSeatId === s.id;
                  const canSelect = selectable && (!assignedSeat || isMySeat);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`size-4 sm:size-5 rounded-full border-2 border-slate-400 dark:border-slate-500 shrink-0 shadow-sm
                                ${assignedSeat ? "bg-[#10b981]" : isSelected ? "bg-[#10b981] ring-2 ring-[#10b981]" : canSelect ? "bg-gray-200 dark:bg-gray-700 cursor-pointer hover:ring-2 hover:ring-[#10b981]/50" : "bg-gray-100 dark:bg-gray-700"}
                              `}
                      disabled={!canSelect}
                      onClick={() => canSelect && onSeatSelect?.(s.id)}
                      title={t.name + " - Seat " + s.label}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            t.seats.slice(0, 8).map((s, idx) => {
              const pos = positions[idx];
              if (!pos) return null;
              const isMySeat = currentInviteId != null && s.invite_id === currentInviteId;
              const assignedSeat = s.invite_id != null && !isMySeat;
              const isSelected = selectable && selectedSeatId === s.id;
              const canSelect = selectable && (!assignedSeat || isMySeat);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`absolute size-5 sm:size-6 rounded-full border-2 border-slate-400 dark:border-slate-500 shrink-0 shadow-sm
                    ${pos.className}
                    ${assignedSeat ? "bg-[#10b981]" : isSelected ? "bg-[#10b981] ring-2 ring-[#10b981]" : canSelect ? "bg-gray-200 dark:bg-gray-700 cursor-pointer hover:ring-2 hover:ring-[#10b981]/50" : "bg-gray-100 dark:bg-gray-700"}
                  `}
                  disabled={!canSelect}
                  onClick={() => canSelect && onSeatSelect?.(s.id)}
                  title={t.name + " - Seat " + s.label}
                />
              );
            })
          )}
          {showDelete && onDeleteTable && (
            <button
              type="button"
              className="absolute -top-1 -right-1 size-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onDeleteTable(t.id); }}
              aria-label={`Delete ${t.name}`}
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full shrink-0 ${isFull ? "bg-[#10b981]" : assigned > 0 ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"}`}
          />
          <span className="text-[11px] font-medium text-[#617589]">
            {isFull ? "Full" : assigned > 0 ? `${t.capacity - assigned} left` : "Empty"}
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
        {/* Wrapper grows with table positions so grey area always contains all tables */}
        <div
          className="w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-size-[20px_20px] flex flex-col"
          style={{
            backgroundColor: "var(--chart-bg, #f6f7f8)",
            minHeight: Math.max(400, floorMinHeight + 60),
            minWidth: floorMinWidth,
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
            className="relative flex-1 w-full pb-8"
            style={{ minHeight: floorMinHeight }}
            onDragOver={handleFloorDragOver}
            onDrop={handleFloorDrop}
          >
            {items.map(({ t, x, y }) => (
              <div
                key={t.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {renderTableCard(t)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-between items-center gap-4 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-[#617589] text-xs">
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#10b981]" />
            <span>Assigned Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <span>Available Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border-2 border-dashed border-[#10b981]/50" />
            <span>Table</span>
          </div>
        </div>
        {selectable && (
          <p className="text-[#617589] text-xs">Click an available seat to select it.</p>
        )}
        {(canMove || canReorder) && (
          <p className="text-[#617589] text-xs">
            {canMove ? "Drag tables or sitting areas to move them anywhere on the floor." : "Drag tables or sitting areas to reorder."}
          </p>
        )}
      </div>
    </div>
  );
}
