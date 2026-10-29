"use client";

import {
  CaseSensitive,
  Circle,
  LayoutTemplate,
  Minus,
  MousePointer2,
  Pencil,
  Shapes,
  Sparkles,
  Spline,
  Square,
  Sticker,
  Triangle,
  Type,
  Upload,
} from "lucide-react";
import { VIRTUAL_TEMPLATES, type VirtualTemplateId } from "@/lib/invitationCardDocument";
import { INVITATION_FONTS } from "@/lib/invitationCardFonts";
import {
  INVITATION_STICKERS,
  STICKER_ATTRIBUTION,
  STICKER_CATEGORIES,
  STICKER_PACK_FILTERS,
  stickerPreviewSrc,
  type StickerItem,
} from "@/lib/invitationCardStickers";
import {
  INVITATION_PATTERNS,
  PATTERN_ATTRIBUTION,
  PATTERN_CATEGORIES,
  patternDataUrl,
  type PatternItem,
} from "@/lib/invitationCardPatterns";
import { InvitationTemplatePreview } from "@/components/events/invitation-template-preview";
import { BrushControls, FilterChips } from "./studioUi";
import type { LibraryPanel, Tool } from "./types";

const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 className="size-4" /> },
  { id: "text", label: "Text", icon: <Type className="size-4" /> },
  { id: "rect", label: "Rectangle", icon: <Square className="size-4" /> },
  { id: "ellipse", label: "Ellipse", icon: <Circle className="size-4" /> },
  { id: "triangle", label: "Triangle", icon: <Triangle className="size-4" /> },
  { id: "line", label: "Line", icon: <Minus className="size-4" /> },
  { id: "curve", label: "Curve", icon: <Spline className="size-4" /> },
  { id: "draw", label: "Draw", icon: <Pencil className="size-4" /> },
  { id: "upload", label: "Upload image", icon: <Upload className="size-4" /> },
];

const libraryNav: { id: LibraryPanel; label: string; icon: React.ReactNode }[] = [
  { id: "templates", label: "Starters", icon: <LayoutTemplate className="size-5" /> },
  { id: "tools", label: "Tools", icon: <Shapes className="size-5" /> },
  { id: "stickers", label: "Stickers", icon: <Sticker className="size-5" /> },
  { id: "patterns", label: "Patterns", icon: <Sparkles className="size-5" /> },
  { id: "fonts", label: "Fonts", icon: <CaseSensitive className="size-5" /> },
];

export type StudioLibraryProps = {
  panel: LibraryPanel;
  libraryOpen: boolean;
  tool: Tool;
  stickerCat: string;
  stickerPack: string;
  patternCat: string;
  brushColor: string;
  brushWidth: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenLibrary: (panel: LibraryPanel) => void;
  onCloseLibrary: () => void;
  onToolClick: (t: Tool) => void;
  onSelectTool: () => void;
  onStickerCat: (id: string) => void;
  onStickerPack: (id: string) => void;
  onPatternCat: (id: string) => void;
  onBrushColor: (c: string) => void;
  onBrushWidth: (w: number) => void;
  onUploadFile: (file: File | undefined) => void;
  onAddSticker: (s: StickerItem) => void;
  onApplyPattern: (pattern: PatternItem, mode: "background" | "underlay" | "fill") => void;
  onApplyFont: (family: string) => void;
  onApplyTemplate: (id: VirtualTemplateId) => void;
};

export function StudioLibraryRail({
  panel,
  libraryOpen,
  tool,
  libraryNavItems = libraryNav,
  onOpenLibrary,
  onSelectTool,
}: Pick<
  StudioLibraryProps,
  "panel" | "libraryOpen" | "tool" | "onOpenLibrary" | "onSelectTool"
> & { libraryNavItems?: typeof libraryNav }) {
  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-black/5 bg-[#f7f4ee] py-3 dark:border-white/10 dark:bg-slate-900">
      {libraryNavItems.map((item) => {
        const active = libraryOpen && panel === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            onClick={() => onOpenLibrary(item.id)}
            className={`flex size-10 flex-col items-center justify-center rounded-xl transition ${
              active
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                : "text-slate-500 hover:bg-black/5 hover:text-slate-800 dark:hover:bg-white/10"
            }`}
          >
            {item.icon}
          </button>
        );
      })}
      <div className="mt-auto flex flex-col gap-1 pb-1">
        <button
          type="button"
          title="Select"
          onClick={onSelectTool}
          className={`flex size-10 items-center justify-center rounded-xl ${
            tool === "select" ? "bg-primary/15 text-primary" : "text-slate-400 hover:bg-black/5"
          }`}
        >
          <MousePointer2 className="size-4" />
        </button>
      </div>
    </nav>
  );
}

export function StudioLibraryPanel({
  panel,
  tool,
  stickerCat,
  stickerPack,
  patternCat,
  brushColor,
  brushWidth,
  fileInputRef,
  onCloseLibrary,
  onToolClick,
  onStickerCat,
  onStickerPack,
  onPatternCat,
  onBrushColor,
  onBrushWidth,
  onUploadFile,
  onAddSticker,
  onApplyPattern,
  onApplyFont,
  onApplyTemplate,
}: Omit<
  StudioLibraryProps,
  "libraryOpen" | "onOpenLibrary" | "onSelectTool"
>) {
  const stickers = INVITATION_STICKERS.filter((s) => {
    if (stickerCat !== "all" && s.category !== stickerCat) return false;
    if (stickerPack !== "all" && s.pack !== stickerPack) return false;
    return true;
  });

  const patterns =
    patternCat === "all"
      ? INVITATION_PATTERNS
      : INVITATION_PATTERNS.filter((p) => p.category === patternCat);

  return (
    <aside className="flex w-[min(100%,300px)] shrink-0 flex-col border-r border-black/5 bg-[#fbfaf7] dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-black/5 px-3 py-2.5 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {libraryNav.find((n) => n.id === panel)?.label}
        </p>
        <button
          type="button"
          className="text-[11px] text-slate-400 hover:text-slate-700"
          onClick={onCloseLibrary}
        >
          Close
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onUploadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {panel === "tools" && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {tools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToolClick(t.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] ${
                    tool === t.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-white text-slate-600 ring-1 ring-black/5 hover:ring-black/15 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
            {tool === "draw" && (
              <BrushControls
                brushColor={brushColor}
                brushWidth={brushWidth}
                onColorChange={onBrushColor}
                onWidthChange={onBrushWidth}
              />
            )}
          </>
        )}

        {panel === "stickers" && (
          <>
            <FilterChips items={STICKER_PACK_FILTERS} value={stickerPack} onChange={onStickerPack} />
            <FilterChips
              items={STICKER_CATEGORIES}
              value={stickerCat}
              onChange={onStickerCat}
              activeClassName="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            />
            <div className="grid grid-cols-3 gap-2">
              {stickers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={`${s.label} (${s.pack})`}
                  onClick={() => void onAddSticker(s)}
                  className="aspect-square rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 hover:border-primary/50 bg-slate-50 dark:bg-slate-800/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stickerPreviewSrc(s)}
                    alt={s.label}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-snug text-slate-500 px-0.5">
              {STICKER_ATTRIBUTION.short}. Full notices in{" "}
              <code className="text-[9px]">/stickers/ATTRIBUTION.md</code>.
            </p>
          </>
        )}

        {panel === "patterns" && (
          <>
            <p className="text-[11px] text-slate-500 px-1 mb-2">
              Click a pattern: background, underlay, or fill the selected shape.
            </p>
            <FilterChips items={PATTERN_CATEGORIES} value={patternCat} onChange={onPatternCat} />
            <div className="grid grid-cols-2 gap-2">
              {patterns.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800"
                >
                  <button
                    type="button"
                    title={`${p.label} — click for underlay`}
                    onClick={() => void onApplyPattern(p, "underlay")}
                    className="block w-full aspect-[4/3] border-b border-slate-100 dark:border-slate-700"
                    style={{
                      backgroundColor: p.backdrop,
                      backgroundImage: `url("${patternDataUrl(p)}")`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "auto",
                    }}
                  />
                  <div className="px-1.5 py-1 space-y-1">
                    <p className="text-[10px] font-medium truncate">{p.label}</p>
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        className="flex-1 text-[9px] py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200"
                        onClick={() => void onApplyPattern(p, "background")}
                      >
                        BG
                      </button>
                      <button
                        type="button"
                        className="flex-1 text-[9px] py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200"
                        onClick={() => void onApplyPattern(p, "underlay")}
                      >
                        Layer
                      </button>
                      <button
                        type="button"
                        className="flex-1 text-[9px] py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200"
                        onClick={() => void onApplyPattern(p, "fill")}
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-snug text-slate-500 px-0.5">{PATTERN_ATTRIBUTION}</p>
          </>
        )}

        {panel === "fonts" && (
          <>
            <p className="mb-2 text-[11px] text-slate-500">
              Preview each face. Click to apply to selected text, or add a new text box.
            </p>
            <div className="space-y-1.5">
              {INVITATION_FONTS.map((f) => (
                <button
                  key={f.family}
                  type="button"
                  onClick={() => void onApplyFont(f.family)}
                  className="w-full rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-black/5 transition hover:ring-slate-400 dark:bg-slate-800 dark:ring-white/10"
                >
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">{f.label}</p>
                  <p
                    className="mt-0.5 truncate text-[22px] leading-tight text-slate-800 dark:text-slate-100"
                    style={{ fontFamily: `"${f.family}", serif` }}
                  >
                    Invitation
                  </p>
                  <p
                    className="truncate text-xs text-slate-500"
                    style={{ fontFamily: `"${f.family}", serif` }}
                  >
                    The quick brown fox
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {panel === "templates" && (
          <>
            <p className="mb-2 text-[11px] text-slate-500">
              Visual starters — tap a card to replace the current design.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {VIRTUAL_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onApplyTemplate(t.id)}
                  className="group overflow-hidden rounded-xl bg-white text-left ring-1 ring-black/5 transition hover:ring-slate-400 dark:bg-slate-800 dark:ring-white/10"
                >
                  <InvitationTemplatePreview template={t} />
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-100">{t.label}</p>
                    <p className="text-[10px] leading-snug text-slate-500 line-clamp-2">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
