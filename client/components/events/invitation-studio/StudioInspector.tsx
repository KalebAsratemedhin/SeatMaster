"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVITATION_FONTS } from "@/lib/invitationCardFonts";
import type { LayerItem } from "@/lib/fabricInvitationActions";
import { isObjectLocked } from "@/lib/fabricInvitationActions";
import { BrushControls, GradientPairButtons } from "./studioUi";
import type { BoardSize, FabricObject, Tool } from "./types";

export type StudioInspectorProps = {
  open: boolean;
  boardSize: BoardSize;
  applyBoardSize: (width: number, height: number) => void;
  pushHistory: () => void;
  bgSolid: string;
  setBgSolid: (v: string) => void;
  bgGradFrom: string;
  bgGradTo: string;
  setBgGradFrom: (v: string) => void;
  setBgGradTo: (v: string) => void;
  onBgSolidChange: (color: string) => void;
  onBgGradientLinear: () => void;
  onBgGradientRadial: () => void;
  layers: LayerItem[];
  selected: FabricObject | null;
  inspectorRev: number;
  onSelectLayer: (object: FabricObject) => void;
  onMoveLayer: (object: FabricObject, dir: "up" | "down") => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringFront: () => void;
  sendBack: () => void;
  duplicateSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleLockSelected: () => void;
  deleteSelected: () => void;
  patchActive: (patch: Record<string, unknown>) => void;
  fillGradFrom: string;
  fillGradTo: string;
  setFillGradFrom: (v: string) => void;
  setFillGradTo: (v: string) => void;
  onFillGradientLinear: () => void;
  onFillGradientRadial: () => void;
  onFlip: (axis: "x" | "y") => void;
  onRotate: (deg: number) => void;
  onAlign: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistribute: (axis: "horizontal" | "vertical") => void;
  onShadowToggle: (enabled: boolean) => void;
  onStrokeDash: (style: "solid" | "dashed" | "dotted" | "long") => void;
  onImageFilter: (filter: "none" | "grayscale" | "sepia" | "brightness" | "contrast") => void;
  cropInset: number;
  setCropInset: (v: number) => void;
  onApplyCrop: () => void;
  onClearCrop: () => void;
  tool: Tool;
  brushColor: string;
  brushWidth: number;
  setBrushColor: (v: string) => void;
  setBrushWidth: (v: number) => void;
};

export function StudioInspector(props: StudioInspectorProps) {
  const {
    open,
    boardSize,
    applyBoardSize,
    pushHistory,
    bgSolid,
    bgGradFrom,
    bgGradTo,
    setBgGradFrom,
    setBgGradTo,
    onBgSolidChange,
    onBgGradientLinear,
    onBgGradientRadial,
    layers,
    selected,
    inspectorRev,
    onSelectLayer,
    onMoveLayer,
    bringForward,
    sendBackward,
    bringFront,
    sendBack,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    toggleLockSelected,
    deleteSelected,
    patchActive,
    fillGradFrom,
    fillGradTo,
    setFillGradFrom,
    setFillGradTo,
    onFillGradientLinear,
    onFillGradientRadial,
    onFlip,
    onRotate,
    onAlign,
    onDistribute,
    onShadowToggle,
    onStrokeDash,
    onImageFilter,
    cropInset,
    setCropInset,
    onApplyCrop,
    onClearCrop,
    tool,
    brushColor,
    brushWidth,
    setBrushColor,
    setBrushWidth,
  } = props;

  if (!open) return null;

  const isText =
    selected &&
    (selected.type === "textbox" || selected.type === "i-text" || selected.type === "text");
  const isShape =
    selected && ["rect", "ellipse", "triangle", "path", "line"].includes(selected.type || "");

  return (
    <aside className="w-[min(100%,288px)] shrink-0 overflow-y-auto border-l border-black/5 bg-[#fbfaf7] p-3 space-y-4 dark:border-white/10 dark:bg-slate-900">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Artboard</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              min={400}
              max={2400}
              step={10}
              value={boardSize.width}
              onChange={(e) =>
                applyBoardSize(Number(e.target.value) || boardSize.width, boardSize.height)
              }
              onBlur={() => pushHistory()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              min={400}
              max={3200}
              step={10}
              value={boardSize.height}
              onChange={(e) =>
                applyBoardSize(boardSize.width, Number(e.target.value) || boardSize.height)
              }
              onBlur={() => pushHistory()}
            />
          </div>
        </div>
        <Label className="text-xs">Background</Label>
        <Input
          type="color"
          className="h-9 p-1"
          value={bgSolid}
          onChange={(e) => onBgSolidChange(e.target.value)}
        />
        <GradientPairButtons
          label="Gradient"
          from={bgGradFrom}
          to={bgGradTo}
          onFromChange={setBgGradFrom}
          onToChange={setBgGradTo}
          onLinear={onBgGradientLinear}
          onRadial={onBgGradientRadial}
        />
      </div>

      <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Layers</p>
        {layers.length === 0 ? (
          <p className="text-[10px] text-slate-500">No objects yet.</p>
        ) : (
          <ul className="max-h-40 overflow-y-auto space-y-0.5">
            {layers.map((layer) => (
              <li key={layer.key}>
                <button
                  type="button"
                  onClick={() => onSelectLayer(layer.object)}
                  className={`w-full flex items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] ${
                    selected === layer.object
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate flex-1">
                    {layer.locked ? "[L] " : ""}
                    {layer.label}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-[10px] text-slate-400 px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.object, "up");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onMoveLayer(layer.object, "up");
                      }
                    }}
                  >
                    ↑
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-[10px] text-slate-400 px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.object, "down");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onMoveLayer(layer.object, "down");
                      }
                    }}
                  >
                    ↓
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected ? (
        <div
          key={inspectorRev}
          className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Inspector · {selected.type}
          </p>
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={bringForward}>
              Forward
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={sendBackward}>
              Back
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={bringFront}>
              To front
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={sendBack}>
              To back
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void duplicateSelected()}
            >
              Duplicate
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={groupSelected}>
              Group
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={ungroupSelected}>
              Ungroup
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={toggleLockSelected}>
              {isObjectLocked(selected) ? "Unlock" : "Lock"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs text-destructive"
              onClick={deleteSelected}
            >
              Delete
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onFlip("x")}>
              Flip H
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onFlip("y")}>
              Flip V
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onRotate(-90)}>
              −90°
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onRotate(90)}>
              +90°
            </Button>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-slate-400">Align to artboard / selection</Label>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["left", "Left"],
                  ["center", "Center"],
                  ["right", "Right"],
                  ["top", "Top"],
                  ["middle", "Middle"],
                  ["bottom", "Bottom"],
                ] as const
              ).map(([mode, label]) => (
                <Button
                  key={mode}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => onAlign(mode)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px] flex-1"
                onClick={() => onDistribute("horizontal")}
              >
                Dist. H
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px] flex-1"
                onClick={() => onDistribute("vertical")}
              >
                Dist. V
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Opacity</Label>
            <Input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selected.opacity ?? 1}
              onChange={(e) => patchActive({ opacity: Number(e.target.value) })}
              onMouseUp={() => pushHistory()}
            />
          </div>

          <div className="space-y-1 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={Boolean(selected.shadow)}
                onChange={(e) => onShadowToggle(e.target.checked)}
              />
              Drop shadow
            </label>
          </div>

          {isText && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Font</Label>
                <Select
                  value={String(selected.fontFamily || "DM Sans")}
                  onValueChange={(v) => {
                    patchActive({ fontFamily: v });
                    pushHistory();
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {INVITATION_FONTS.map((f) => (
                      <SelectItem key={f.family} value={f.family}>
                        <span className="flex flex-col items-start gap-0.5 py-0.5">
                          <span className="text-[10px] text-muted-foreground">{f.label}</span>
                          <span
                            className="text-base leading-none"
                            style={{ fontFamily: `"${f.family}", serif` }}
                          >
                            Invitation
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={selected.fontSize ?? 24}
                    onChange={(e) => patchActive({ fontSize: Number(e.target.value) || 12 })}
                    onBlur={() => pushHistory()}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weight</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    step={100}
                    value={Number(selected.fontWeight) || 400}
                    onChange={(e) =>
                      patchActive({ fontWeight: String(Number(e.target.value) || 400) })
                    }
                    onBlur={() => pushHistory()}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    className="h-8 p-1"
                    value={
                      String(selected.fill || "#000000").startsWith("#")
                        ? String(selected.fill)
                        : "#000000"
                    }
                    onChange={(e) => patchActive({ fill: e.target.value })}
                    onBlur={() => pushHistory()}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Align</Label>
                  <Select
                    value={selected.textAlign || "left"}
                    onValueChange={(v) => {
                      patchActive({ textAlign: v });
                      pushHistory();
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selected.fontStyle === "italic"}
                    onChange={(e) => {
                      patchActive({ fontStyle: e.target.checked ? "italic" : "normal" });
                      pushHistory();
                    }}
                  />
                  Italic
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.underline)}
                    onChange={(e) => {
                      patchActive({ underline: e.target.checked });
                      pushHistory();
                    }}
                  />
                  Underline
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.linethrough)}
                    onChange={(e) => {
                      patchActive({ linethrough: e.target.checked });
                      pushHistory();
                    }}
                  />
                  Strike
                </label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Letter spacing</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.charSpacing ?? 0}
                  onChange={(e) => patchActive({ charSpacing: Number(e.target.value) || 0 })}
                  onBlur={() => pushHistory()}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Line height</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  step={0.05}
                  value={selected.lineHeight ?? 1.16}
                  onChange={(e) => patchActive({ lineHeight: Number(e.target.value) || 1 })}
                  onBlur={() => pushHistory()}
                />
              </div>
            </>
          )}

          {(isShape || isText) && (
            <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              <Label className="text-xs">Fill gradient</Label>
              <GradientPairButtons
                from={fillGradFrom}
                to={fillGradTo}
                onFromChange={setFillGradFrom}
                onToChange={setFillGradTo}
                onLinear={onFillGradientLinear}
                onRadial={onFillGradientRadial}
              />
            </div>
          )}

          {isShape && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Fill</Label>
                <Input
                  type="color"
                  className="h-8 p-1"
                  value={
                    String(selected.fill || "#cccccc").startsWith("#")
                      ? String(selected.fill)
                      : "#cccccc"
                  }
                  onChange={(e) => patchActive({ fill: e.target.value })}
                  onBlur={() => pushHistory()}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stroke</Label>
                <Input
                  type="color"
                  className="h-8 p-1"
                  value={
                    String(selected.stroke || "#000000").startsWith("#")
                      ? String(selected.stroke)
                      : "#000000"
                  }
                  onChange={(e) => patchActive({ stroke: e.target.value })}
                  onBlur={() => pushHistory()}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stroke width</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={selected.strokeWidth ?? 1}
                  onChange={(e) => patchActive({ strokeWidth: Number(e.target.value) || 0 })}
                  onBlur={() => pushHistory()}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stroke style</Label>
                <Select
                  value={
                    !selected.strokeDashArray?.length
                      ? "solid"
                      : selected.strokeDashArray[0] === 2
                        ? "dotted"
                        : selected.strokeDashArray[0] === 24
                          ? "long"
                          : "dashed"
                  }
                  onValueChange={(v) => onStrokeDash(v as "solid" | "dashed" | "dotted" | "long")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="long">Long dash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selected.type === "image" && (
            <div className="space-y-2">
              <Label className="text-xs">Image filter</Label>
              <Select
                value="none"
                onValueChange={(v) =>
                  onImageFilter(v as "none" | "grayscale" | "sepia" | "brightness" | "contrast")
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="grayscale">Grayscale</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                  <SelectItem value="brightness">Brighten</SelectItem>
                  <SelectItem value="contrast">Contrast</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs">Crop inset · {Math.round(cropInset * 100)}%</Label>
              <Input
                type="range"
                min={0.05}
                max={0.4}
                step={0.01}
                value={cropInset}
                onChange={(e) => setCropInset(Number(e.target.value))}
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] flex-1"
                  onClick={onApplyCrop}
                >
                  Apply crop
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] flex-1"
                  onClick={onClearCrop}
                >
                  Clear crop
                </Button>
              </div>
            </div>
          )}

          {tool === "draw" && (
            <p className="text-xs text-slate-500">Freehand draw is on — brush controls are in the Tools panel.</p>
          )}
          <p className="text-[10px] text-slate-400">
            Shortcuts: ⌘/Ctrl+C/V/D, Del, ⌘Z / ⌘⇧Z. Snap to edges &amp; center while dragging.
          </p>
        </div>
      ) : (
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          {tool === "draw" && (
            <BrushControls
              compact
              brushColor={brushColor}
              brushWidth={brushWidth}
              onColorChange={setBrushColor}
              onWidthChange={setBrushWidth}
            />
          )}
          <p className="text-xs text-slate-500">
            Select an object to edit, or pick Fonts / Stickers / Patterns from the rail.
          </p>
        </div>
      )}
    </aside>
  );
}
