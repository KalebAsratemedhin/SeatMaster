"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowLeft,
  Download,
  Loader2,
  PanelRight,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type StudioHeaderProps = {
  eventId: string;
  /** When opened from create wizard, return here instead of the event page. */
  backHref?: string | null;
  backLabel?: string;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onDownload: () => void;
  downloading: boolean;
  onSave: () => void;
  isSaving: boolean;
  ready: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function StudioHeader({
  eventId,
  backHref,
  backLabel,
  zoom,
  onZoomOut,
  onZoomIn,
  inspectorOpen,
  onToggleInspector,
  onDownload,
  downloading,
  onSave,
  isSaving,
  ready,
  onUndo,
  onRedo,
}: StudioHeaderProps) {
  const eventBack = backHref?.startsWith("/") ? backHref : `/events/${eventId}`;
  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-5 border-b border-black/5 bg-[#f7f4ee]/95 px-5 font-sans backdrop-blur sm:gap-7 sm:px-7 dark:border-white/10 dark:bg-slate-900/95">
      <Link
        href="/dashboard"
        className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-amber)]/50"
        aria-label="SeatMaster home"
      >
        <Logo />
      </Link>

      <div className="hidden h-5 w-px shrink-0 bg-slate-300/80 sm:block dark:bg-slate-700" />

      <div className="flex items-center gap-4 sm:gap-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 px-3 font-sans text-slate-700 dark:text-slate-200"
        >
          <Link href={eventBack}>
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{backLabel || "Event"}</span>
          </Link>
        </Button>
        <p className="hidden text-sm font-medium text-slate-600 md:block dark:text-slate-300">
          Invitation studio
        </p>
      </div>

      <div className="ml-1 flex items-center gap-0.5 rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/10">
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onUndo} title="Undo">
          <Undo2 className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onRedo} title="Redo">
          <Redo2 className="size-3.5" />
        </Button>
        <div className="mx-1.5 h-4 w-px bg-slate-200 dark:bg-slate-600" />
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onZoomOut}>
          <ZoomOut className="size-3.5" />
        </Button>
        <span className="w-10 text-center text-[11px] tabular-nums text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onZoomIn}>
          <ZoomIn className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          title={inspectorOpen ? "Hide inspector" : "Show inspector"}
          onClick={onToggleInspector}
        >
          <PanelRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white/80 font-sans"
          onClick={onDownload}
          disabled={downloading}
        >
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          <span className="hidden md:inline">PNG</span>
        </Button>
        <Button size="sm" className="h-8 font-sans" onClick={onSave} disabled={isSaving || !ready}>
          {isSaving ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </header>
  );
}
