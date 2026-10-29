"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useGetEventQuery,
  useGetInvitationCardQuery,
  useUpsertInvitationCardMutation,
} from "@/lib/api/eventsApi";
import { getErrorMessage } from "@/lib/api/errors";
import type { RootState } from "@/lib/store";
import {
  CARD_ARTBOARD,
  applyVirtualTemplateToCanvas,
  documentFromFabricCanvas,
  type VirtualTemplateId,
} from "@/lib/invitationCardDocument";
import {
  alignObjects,
  applyImageCrop,
  applyImageFilter,
  applyObjectGradientFill,
  applyPatternFill,
  applyPatternToCanvasBackground,
  applyShadow,
  applyStrokeDash,
  addPatternUnderlay,
  bringToFront,
  clearImageCrop,
  createStickerObject,
  distributeObjects,
  flipObject,
  getLayerItems,
  isObjectLocked,
  loadImageFromFile,
  moveLayer,
  objectFromJson,
  rotateObjectBy,
  selectLayerObject,
  sendToBack,
  setCanvasBackgroundGradient,
  setCanvasBackgroundSolid,
  setObjectLocked,
  cloneObjectJson,
} from "@/lib/fabricInvitationActions";
import type { PatternItem } from "@/lib/invitationCardPatterns";
import type { StickerItem } from "@/lib/invitationCardStickers";
import { downloadInvitationCardPng } from "@/lib/renderInvitationCardPng";
import { uploadInvitationPreview } from "@/lib/api/uploadApi";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StudioHeader } from "./StudioHeader";
import { StudioInspector } from "./StudioInspector";
import { StudioLibraryPanel, StudioLibraryRail } from "./StudioLibrary";
import { StudioStage } from "./StudioStage";
import type { BoardSize, FabricCanvas, FabricObject, LibraryPanel, Tool } from "./types";
import { useBoardResize } from "./useBoardResize";
import { useFabricHistory } from "./useFabricHistory";
import { useFabricStudio } from "./useFabricStudio";
import { useStudioKeyboard } from "./useStudioKeyboard";

export function InvitationCardWorkspace({ eventId }: { eventId: string }) {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);

  const { data: event, isLoading: eventLoading, error: eventError } = useGetEventQuery(eventId, {
    skip: !eventId || !token,
  });
  const {
    data: card,
    isLoading: cardLoading,
    error: cardError,
    isError: cardIsError,
  } = useGetInvitationCardQuery(eventId, { skip: !eventId || !token });
  const [upsertCard, { isLoading: isSaving }] = useUpsertInvitationCardMutation();

  const cardMissing =
    cardIsError &&
    typeof cardError === "object" &&
    cardError &&
    "status" in cardError &&
    (cardError as { status?: number }).status === 404;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const hydratedRef = useRef(false);
  const clipboardRef = useRef<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(0.4);
  const [boardSize, setBoardSize] = useState<BoardSize>({
    width: CARD_ARTBOARD.width,
    height: CARD_ARTBOARD.height,
  });
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [inspectorRev, setInspectorRev] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [stickerCat, setStickerCat] = useState<string>("all");
  const [stickerPack, setStickerPack] = useState<string>("all");
  const [panel, setPanel] = useState<LibraryPanel>("templates");
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [patternCat, setPatternCat] = useState<string>("all");
  const [initError, setInitError] = useState<string | null>(null);
  const [shellMounted, setShellMounted] = useState(false);
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [brushWidth, setBrushWidth] = useState(3);
  const [bgSolid, setBgSolid] = useState("#ffffff");
  const [bgGradFrom, setBgGradFrom] = useState("#ffffff");
  const [bgGradTo, setBgGradTo] = useState("#fce7f3");
  const [fillGradFrom, setFillGradFrom] = useState("#fbcfe8");
  const [fillGradTo, setFillGradTo] = useState("#fda4af");
  const [cropInset, setCropInset] = useState(0.15);
  const [layersTick, setLayersTick] = useState(0);

  const refreshLayers = useCallback(() => setLayersTick((n) => n + 1), []);

  const { pushHistory, resetHistoryFromCanvas, undo, redo, runWithoutHistory, historyRef } =
    useFabricHistory({
      fabricRef,
      onStackChange: refreshLayers,
    });

  const refreshSelection = useCallback(
    (obj?: FabricObject | null, options?: { commit?: boolean }) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.requestRenderAll();
      const next = obj !== undefined ? obj : (canvas.getActiveObject() ?? null);
      setSelected(next);
      setInspectorRev((n) => n + 1);
      if (options?.commit) pushHistory();
    },
    [pushHistory]
  );

  const handleSelectionFromCanvas = useCallback((obj: FabricObject | null) => {
    setSelected(obj);
    setInspectorRev((n) => n + 1);
    if (obj) setInspectorOpen(true);
  }, []);

  useFabricStudio({
    shellMounted,
    canvasRef,
    fabricRef,
    boardSize,
    zoom,
    tool,
    brushColor,
    brushWidth,
    ready,
    setReady,
    setInitError,
    setBoardSize,
    setBgSolid,
    hydratedRef,
    event,
    card,
    cardLoading,
    cardMissing,
    historyRef,
    resetHistoryFromCanvas,
    runWithoutHistory,
    pushHistory,
    onSelectionChange: handleSelectionFromCanvas,
    refreshLayers,
  });

  const snapshotDocument = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    return {
      ...documentFromFabricCanvas(canvas),
      width: boardSize.width,
      height: boardSize.height,
    };
  }, [boardSize.width, boardSize.height]);

  const handleUndo = useCallback(async () => {
    await undo();
    setSelected(null);
  }, [undo]);

  const handleRedo = useCallback(async () => {
    await redo();
    setSelected(null);
  }, [redo]);

  const addObjectAndSelect = useCallback(
    (obj: FabricObject) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.add(obj);
      canvas.setActiveObject(obj);
      refreshSelection(obj, { commit: true });
      setTool("select");
    },
    [refreshSelection]
  );

  const placeAtCenter = useCallback(
    async (factory: () => Promise<FabricObject> | FabricObject) => {
      const obj = await factory();
      obj.set({
        left: boardSize.width / 2,
        top: boardSize.height / 2,
        originX: "center",
        originY: "center",
      });
      addObjectAndSelect(obj);
    },
    [addObjectAndSelect, boardSize.height, boardSize.width]
  );

  const handleToolClick = useCallback(
    async (t: Tool) => {
      setTool(t);
      if (t === "select" || t === "draw") return;

      const fabric = await import("fabric");
      if (t === "text") {
        await placeAtCenter(
          () =>
            new fabric.Textbox("Your text", {
              width: 400,
              fontSize: 36,
              fontFamily: "Playfair Display",
              fill: "#0f172a",
              textAlign: "center",
            })
        );
        return;
      }
      if (t === "rect") {
        await placeAtCenter(
          () =>
            new fabric.Rect({
              width: 240,
              height: 160,
              fill: "#e2e8f0",
              stroke: "#94a3b8",
              strokeWidth: 2,
              rx: 12,
              ry: 12,
            })
        );
        return;
      }
      if (t === "ellipse") {
        await placeAtCenter(
          () =>
            new fabric.Ellipse({
              rx: 100,
              ry: 80,
              fill: "#fbcfe8",
              stroke: "#db2777",
              strokeWidth: 2,
            })
        );
        return;
      }
      if (t === "triangle") {
        await placeAtCenter(
          () =>
            new fabric.Triangle({
              width: 180,
              height: 160,
              fill: "#bbf7d0",
              stroke: "#16a34a",
              strokeWidth: 2,
            })
        );
        return;
      }
      if (t === "line") {
        const line = new fabric.Line([0, 0, 320, 0], {
          stroke: "#64748b",
          strokeWidth: 4,
        });
        line.set({
          left: boardSize.width / 2,
          top: boardSize.height / 2,
          originX: "center",
          originY: "center",
        });
        addObjectAndSelect(line);
        return;
      }
      if (t === "curve") {
        const path = new fabric.Path("M 0 40 Q 160 -40 320 40", {
          fill: "",
          stroke: "#0f172a",
          strokeWidth: 3,
          left: boardSize.width / 2 - 160,
          top: boardSize.height / 2,
        });
        addObjectAndSelect(path);
        return;
      }
      if (t === "upload") {
        fileInputRef.current?.click();
        setTool("select");
      }
    },
    [addObjectAndSelect, boardSize.height, boardSize.width, placeAtCenter]
  );

  const handleUploadFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) {
        toast.error("Please choose an image file");
        return;
      }
      try {
        const img = await loadImageFromFile(file);
        addObjectAndSelect(img);
      } catch {
        toast.error("Could not load uploaded image");
      }
    },
    [addObjectAndSelect]
  );

  const addSticker = useCallback(
    async (sticker: StickerItem) => {
      try {
        const obj = await createStickerObject(sticker);
        addObjectAndSelect(obj);
      } catch (err) {
        console.error(err);
        toast.error(`Could not add sticker: ${sticker.label}`);
      }
    },
    [addObjectAndSelect]
  );

  const duplicateSelected = useCallback(async () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const json = cloneObjectJson(obj);
    const clone = await objectFromJson(json);
    clone.set({
      left: (obj.left || 0) + 24,
      top: (obj.top || 0) + 24,
    });
    addObjectAndSelect(clone);
  }, [addObjectAndSelect]);

  const copySelected = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    clipboardRef.current = cloneObjectJson(obj);
  }, []);

  const pasteClipboard = useCallback(async () => {
    if (!clipboardRef.current || !fabricRef.current) return;
    const clone = await objectFromJson(clipboardRef.current);
    clone.set({
      left: (clone.left || 0) + 24,
      top: (clone.top || 0) + 24,
    });
    addObjectAndSelect(clone);
  }, [addObjectAndSelect]);

  const groupSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    if (active.type === "activeselection" || active.type === "activeSelection") {
      active.toGroup();
      refreshSelection(canvas.getActiveObject(), { commit: true });
    }
  }, [refreshSelection]);

  const ungroupSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || active.type !== "group") return;
    active.toActiveSelection();
    refreshSelection(canvas.getActiveObject(), { commit: true });
  }, [refreshSelection]);

  const applyTemplate = useCallback(
    async (id: VirtualTemplateId) => {
      const canvas = fabricRef.current;
      if (!canvas || !event) return;
      if (
        canvas.getObjects().length > 0 &&
        !window.confirm("Replace the current design with this starter?")
      ) {
        return;
      }
      await runWithoutHistory(async () => {
        await applyVirtualTemplateToCanvas(canvas, id, event);
      });
      pushHistory();
      setSelected(null);
      setTool("select");
    },
    [event, pushHistory, runWithoutHistory]
  );

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((o: FabricObject) => canvas.remove(o));
    canvas.discardActiveObject();
    refreshSelection(null, { commit: true });
  }, [refreshSelection]);

  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.bringObjectForward(obj);
    refreshSelection(obj, { commit: true });
  }, [refreshSelection]);

  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.sendObjectBackwards(obj);
    refreshSelection(obj, { commit: true });
  }, [refreshSelection]);

  const bringFront = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    bringToFront(canvas, obj);
    pushHistory();
  }, [pushHistory]);

  const sendBack = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    sendToBack(canvas, obj);
    pushHistory();
  }, [pushHistory]);

  const toggleLockSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const next = !isObjectLocked(obj);
    setObjectLocked(obj, next);
    refreshSelection(obj, { commit: true });
  }, [refreshSelection]);

  const patchActive = useCallback(
    (patch: Record<string, unknown>) => {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!canvas || !obj) return;
      obj.set(patch);
      obj.setCoords();
      refreshSelection(obj);
    },
    [refreshSelection]
  );

  const clearSelection = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    refreshSelection(null);
  }, [refreshSelection]);

  const { applyBoardSize, onResizeHandlePointerDown, onResizeHandlePointerMove, onResizeHandlePointerUp } =
    useBoardResize({
      boardSize,
      setBoardSize,
      zoom,
      onResizeCommit: pushHistory,
    });

  const layers = useMemo(() => {
    void layersTick;
    return ready ? getLayerItems(fabricRef.current) : [];
  }, [ready, layersTick]);

  const handleSave = useCallback(async () => {
    const doc = snapshotDocument();
    if (!doc) return;
    try {
      let previewUrl: string | null = null;
      const canvas = fabricRef.current;
      try {
        if (canvas) {
          const dataUrl = canvas.toDataURL({
            format: "png",
            multiplier: 0.45,
            enableRetinaScaling: false,
          }) as string;
          const previewBlob = await (await fetch(dataUrl)).blob();
          previewUrl = await uploadInvitationPreview(previewBlob);
        }
      } catch {
        /* preview optional */
      }
      await upsertCard({
        eventId,
        body: {
          template_id: "canvas_v1",
          headline: null,
          host_line: null,
          body_message: null,
          accent_key: null,
          show_banner: false,
          published: true,
          document: doc,
          preview_url: previewUrl,
        },
      }).unwrap();
      toast.success("Invitation saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [eventId, snapshotDocument, upsertCard]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    const doc = snapshotDocument();
    if (!doc) return;
    setDownloading(true);
    try {
      await downloadInvitationCardPng(doc, `invitation-${event?.name ?? eventId}`);
    } catch {
      toast.error("PNG download failed");
    } finally {
      setDownloading(false);
    }
  }, [downloading, event?.name, eventId, snapshotDocument]);

  const applyPattern = useCallback(
    async (pattern: PatternItem, mode: "background" | "underlay" | "fill") => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      try {
        if (mode === "background") {
          await applyPatternToCanvasBackground(canvas, pattern);
          setBgSolid(pattern.backdrop);
        } else if (mode === "underlay") {
          await addPatternUnderlay(canvas, pattern);
          setBgSolid(pattern.backdrop);
        } else {
          const obj = canvas.getActiveObject();
          if (!obj) {
            toast.error("Select a shape to fill with a pattern");
            return;
          }
          await applyPatternFill(obj, pattern);
          refreshSelection(obj);
        }
        pushHistory();
        canvas.requestRenderAll();
      } catch (err) {
        console.error(err);
        toast.error("Could not apply pattern");
      }
    },
    [pushHistory, refreshSelection]
  );

  const openLibrary = useCallback(
    (next: LibraryPanel) => {
      if (panel === next && libraryOpen) {
        setLibraryOpen(false);
        return;
      }
      setPanel(next);
      setLibraryOpen(true);
    },
    [libraryOpen, panel]
  );

  const applyFont = useCallback(
    async (family: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (
        active &&
        (active.type === "textbox" || active.type === "i-text" || active.type === "text")
      ) {
        patchActive({ fontFamily: family });
        pushHistory();
        return;
      }
      const fabric = await import("fabric");
      await placeAtCenter(
        () =>
          new fabric.Textbox("Your text", {
            width: 420,
            fontSize: 40,
            fontFamily: family,
            fill: "#0f172a",
            textAlign: "center",
          })
      );
    },
    [patchActive, placeAtCenter, pushHistory]
  );

  useStudioKeyboard(ready, {
    undo: handleUndo,
    redo: handleRedo,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    deleteSelected,
  });

  useEffect(() => {
    if (!token) {
      router.replace(
        `/auth?mode=signin&redirect=${encodeURIComponent(`/events/${eventId}/invitation-card`)}`
      );
    }
  }, [token, router, eventId]);

  const isOwner = Boolean(user && event && event.owner_id === user.id);

  useLayoutEffect(() => {
    if (event && isOwner) setShellMounted(true);
  }, [event, isOwner]);

  if (!token) return null;

  if (eventLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="p-8">
        <p className="text-destructive">Event not found.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-8">
        <p className="text-destructive">Only the event owner can edit this card.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/events/${eventId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  const selectedObj = selected;

  return (
    <div className="flex h-dvh flex-col bg-[#e8e4dc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <StudioHeader
        eventId={eventId}
        zoom={zoom}
        onZoomOut={() => setZoom((z) => Math.max(0.2, +(z - 0.05).toFixed(2)))}
        onZoomIn={() => setZoom((z) => Math.min(1, +(z + 0.05).toFixed(2)))}
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
        onDownload={() => void handleDownload()}
        downloading={downloading}
        onSave={() => void handleSave()}
        isSaving={isSaving}
        ready={ready}
        onUndo={() => void handleUndo()}
        onRedo={() => void handleRedo()}
      />

      <div className="flex min-h-0 flex-1">
        <StudioLibraryRail
          panel={panel}
          libraryOpen={libraryOpen}
          tool={tool}
          onOpenLibrary={openLibrary}
          onSelectTool={() => void handleToolClick("select")}
        />

        {libraryOpen && (
          <StudioLibraryPanel
            panel={panel}
            tool={tool}
            stickerCat={stickerCat}
            stickerPack={stickerPack}
            patternCat={patternCat}
            brushColor={brushColor}
            brushWidth={brushWidth}
            fileInputRef={fileInputRef}
            onCloseLibrary={() => setLibraryOpen(false)}
            onToolClick={(t) => void handleToolClick(t)}
            onStickerCat={setStickerCat}
            onStickerPack={setStickerPack}
            onPatternCat={setPatternCat}
            onBrushColor={setBrushColor}
            onBrushWidth={setBrushWidth}
            onUploadFile={handleUploadFile}
            onAddSticker={addSticker}
            onApplyPattern={applyPattern}
            onApplyFont={applyFont}
            onApplyTemplate={(id) => void applyTemplate(id)}
          />
        )}

        <StudioStage
          canvasRef={canvasRef}
          boardSize={boardSize}
          zoom={zoom}
          ready={ready}
          initError={initError}
          onClearSelection={clearSelection}
          onResizeHandlePointerDown={onResizeHandlePointerDown}
          onResizeHandlePointerMove={onResizeHandlePointerMove}
          onResizeHandlePointerUp={onResizeHandlePointerUp}
        />

        <StudioInspector
          open={inspectorOpen}
          boardSize={boardSize}
          applyBoardSize={applyBoardSize}
          pushHistory={pushHistory}
          bgSolid={bgSolid}
          setBgSolid={setBgSolid}
          bgGradFrom={bgGradFrom}
          bgGradTo={bgGradTo}
          setBgGradFrom={setBgGradFrom}
          setBgGradTo={setBgGradTo}
          onBgSolidChange={(color) => {
            setBgSolid(color);
            void setCanvasBackgroundSolid(fabricRef.current, color);
            pushHistory();
          }}
          onBgGradientLinear={() => {
            void setCanvasBackgroundGradient(fabricRef.current, bgGradFrom, bgGradTo, "linear").then(
              () => pushHistory()
            );
          }}
          onBgGradientRadial={() => {
            void setCanvasBackgroundGradient(fabricRef.current, bgGradFrom, bgGradTo, "radial").then(
              () => pushHistory()
            );
          }}
          layers={layers}
          selected={selectedObj}
          inspectorRev={inspectorRev}
          onSelectLayer={(object) => {
            selectLayerObject(fabricRef.current, object);
            refreshSelection(object);
          }}
          onMoveLayer={(object, dir) => {
            moveLayer(fabricRef.current, object, dir);
            pushHistory();
          }}
          bringForward={bringForward}
          sendBackward={sendBackward}
          bringFront={bringFront}
          sendBack={sendBack}
          duplicateSelected={duplicateSelected}
          groupSelected={groupSelected}
          ungroupSelected={ungroupSelected}
          toggleLockSelected={toggleLockSelected}
          deleteSelected={deleteSelected}
          patchActive={patchActive}
          fillGradFrom={fillGradFrom}
          fillGradTo={fillGradTo}
          setFillGradFrom={setFillGradFrom}
          setFillGradTo={setFillGradTo}
          onFillGradientLinear={() => {
            if (!selectedObj) return;
            void applyObjectGradientFill(selectedObj, "linear", fillGradFrom, fillGradTo).then(() =>
              refreshSelection(selectedObj, { commit: true })
            );
          }}
          onFillGradientRadial={() => {
            if (!selectedObj) return;
            void applyObjectGradientFill(selectedObj, "radial", fillGradFrom, fillGradTo).then(() =>
              refreshSelection(selectedObj, { commit: true })
            );
          }}
          onFlip={(axis) => {
            if (!selectedObj) return;
            flipObject(selectedObj, axis);
            refreshSelection(selectedObj, { commit: true });
          }}
          onRotate={(deg) => {
            if (!selectedObj) return;
            rotateObjectBy(selectedObj, deg);
            refreshSelection(selectedObj, { commit: true });
          }}
          onAlign={(mode) => {
            alignObjects(fabricRef.current, mode);
            pushHistory();
          }}
          onDistribute={(axis) => {
            distributeObjects(fabricRef.current, axis);
            pushHistory();
          }}
          onShadowToggle={(enabled) => {
            if (!selectedObj) return;
            applyShadow(selectedObj, {
              enabled,
              blur: 12,
              offsetX: 4,
              offsetY: 4,
              color: "rgba(0,0,0,0.35)",
            });
            refreshSelection(selectedObj, { commit: true });
          }}
          onStrokeDash={(style) => {
            if (!selectedObj) return;
            applyStrokeDash(selectedObj, style);
            refreshSelection(selectedObj, { commit: true });
          }}
          onImageFilter={(filter) => {
            if (!selectedObj) return;
            void applyImageFilter(selectedObj, filter).then(() =>
              refreshSelection(selectedObj, { commit: true })
            );
          }}
          cropInset={cropInset}
          setCropInset={setCropInset}
          onApplyCrop={() => {
            if (!selectedObj) return;
            void applyImageCrop(selectedObj, cropInset).then(() =>
              refreshSelection(selectedObj, { commit: true })
            );
          }}
          onClearCrop={() => {
            if (!selectedObj) return;
            clearImageCrop(selectedObj);
            refreshSelection(selectedObj, { commit: true });
          }}
          tool={tool}
          brushColor={brushColor}
          brushWidth={brushWidth}
          setBrushColor={setBrushColor}
          setBrushWidth={setBrushWidth}
        />
      </div>
    </div>
  );
}
