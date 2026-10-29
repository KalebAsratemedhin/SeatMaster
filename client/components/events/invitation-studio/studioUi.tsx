"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FilterChip = { id: string; label: string };

export function FilterChips({
  items,
  value,
  onChange,
  activeClassName = "bg-primary text-primary-foreground",
  inactiveClassName = "bg-slate-100 dark:bg-slate-800",
}: {
  items: readonly FilterChip[];
  value: string;
  onChange: (id: string) => void;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={`text-[10px] px-2 py-0.5 rounded-full ${
            value === p.id ? activeClassName : inactiveClassName
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function BrushControls({
  brushColor,
  brushWidth,
  onColorChange,
  onWidthChange,
  compact,
}: {
  brushColor: string;
  brushWidth: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2"
          : "mt-2 space-y-2 rounded-xl bg-white p-3 ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10"
      }
    >
      {!compact && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Brush</p>
      )}
      {compact && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Brush</p>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Color</Label>
        <Input
          type="color"
          className="h-8 p-1"
          value={brushColor}
          onChange={(e) => onColorChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Width · {brushWidth}px</Label>
        <Input
          type="range"
          min={1}
          max={48}
          value={brushWidth}
          onChange={(e) => onWidthChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export function GradientPairButtons({
  from,
  to,
  onFromChange,
  onToChange,
  onLinear,
  onRadial,
  label,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onLinear: () => void;
  onRadial: () => void;
  label?: string;
}) {
  return (
    <>
      {label ? <p className="text-[10px] text-slate-400">{label}</p> : null}
      <div className="grid grid-cols-2 gap-1">
        <Input type="color" className="h-8 p-1" value={from} onChange={(e) => onFromChange(e.target.value)} />
        <Input type="color" className="h-8 p-1" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onLinear}>
          Linear
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onRadial}>
          Radial
        </Button>
      </div>
    </>
  );
}
