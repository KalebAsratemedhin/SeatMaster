import { useEffect, useRef } from "react";
import type { EventResponse, InvitationCardResponse } from "@/lib/api/eventsApi";
import { ensureInvitationFontsLoaded } from "@/lib/invitationCardFonts";
import { clearSnapGuides, setBrushStyle, snapMovingObject } from "@/lib/fabricInvitationActions";
import { loadInvitationOntoCanvas } from "@/lib/loadInvitationOntoCanvas";
import type { BoardSize, FabricCanvas, FabricObject, Tool } from "./types";

type UseFabricStudioArgs = {
  shellMounted: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fabricRef: React.MutableRefObject<FabricCanvas | null>;
  boardSize: BoardSize;
  zoom: number;
  tool: Tool;
  brushColor: string;
  brushWidth: number;
  ready: boolean;
  setReady: (v: boolean) => void;
  setInitError: (v: string | null) => void;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  setBgSolid: (v: string) => void;
  hydratedRef: React.MutableRefObject<boolean>;
  event: EventResponse | undefined;
  card: InvitationCardResponse | undefined;
  cardLoading: boolean;
  cardMissing: boolean;
  historyRef: React.MutableRefObject<string[]>;
  resetHistoryFromCanvas: () => void;
  runWithoutHistory: (fn: () => void | Promise<void>) => Promise<void>;
  pushHistory: () => void;
  onSelectionChange: (obj: FabricObject | null) => void;
  refreshLayers: () => void;
};

export function useFabricStudio({
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
  onSelectionChange,
  refreshLayers,
  pushHistory,
}: UseFabricStudioArgs) {
  const pushHistoryRef = useRef(pushHistory);
  pushHistoryRef.current = pushHistory;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    if (!shellMounted || !canvasRef.current || fabricRef.current) return;
    let disposed = false;

    (async () => {
      try {
        void ensureInvitationFontsLoaded();
        const { Canvas, PencilBrush } = await import("fabric");
        if (disposed || !canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
          width: boardSize.width,
          height: boardSize.height,
          backgroundColor: "#ffffff",
          preserveObjectStacking: true,
          selection: true,
        });
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = "#0f172a";
        canvas.freeDrawingBrush.width = 3;

        fabricRef.current = canvas;
        historyRef.current = [JSON.stringify(canvas.toObject())];

        const onSel = () => {
          onSelectionChangeRef.current(canvas.getActiveObject() ?? null);
        };
        const onClear = () => onSelectionChangeRef.current(null);
        const onMod = () => pushHistoryRef.current();

        const onMoving = (e: { target?: FabricObject }) => {
          if (e.target) snapMovingObject(canvas, e.target);
        };
        const onMoved = () => {
          clearSnapGuides(canvas);
          onMod();
        };

        canvas.on("selection:created", onSel);
        canvas.on("selection:updated", onSel);
        canvas.on("selection:cleared", onClear);
        canvas.on("object:modified", onMoved);
        canvas.on("path:created", onMod);
        canvas.on("object:moving", onMoving);
        canvas.on("mouse:up", () => clearSnapGuides(canvas));

        setReady(true);
        setInitError(null);
      } catch (err) {
        console.error("Fabric init failed", err);
        if (!disposed) setInitError("Could not start the design canvas.");
      }
    })();

    return () => {
      disposed = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
      setReady(false);
      hydratedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once when shell mounts
  }, [shellMounted]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!ready || !canvas || !event || hydratedRef.current) return;
    if (cardLoading && !card && !cardMissing) return;

    (async () => {
      await runWithoutHistory(async () => {
        const result = await loadInvitationOntoCanvas(canvas, event, card ?? null);
        setBoardSize({ width: result.width, height: result.height });
        if (typeof canvas.backgroundColor === "string") {
          setBgSolid(canvas.backgroundColor);
        }
      });
      resetHistoryFromCanvas();
      refreshLayers();
      hydratedRef.current = true;
      canvas.requestRenderAll();
    })();
  }, [
    ready,
    event,
    card,
    cardLoading,
    cardMissing,
    fabricRef,
    hydratedRef,
    refreshLayers,
    resetHistoryFromCanvas,
    runWithoutHistory,
    setBoardSize,
    setBgSolid,
  ]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({
      width: boardSize.width * zoom,
      height: boardSize.height * zoom,
    });
    canvas.requestRenderAll();
  }, [zoom, boardSize.width, boardSize.height, ready, fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const drawing = tool === "draw";
    canvas.isDrawingMode = drawing;
    canvas.selection = tool === "select";
    canvas.defaultCursor = tool === "select" ? "default" : "crosshair";
    canvas.forEachObject((o: FabricObject) => {
      o.selectable = tool === "select";
      o.evented = tool === "select";
    });
    if (tool !== "select") canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [tool, ready, fabricRef]);

  useEffect(() => {
    if (!ready || !fabricRef.current) return;
    setBrushStyle(fabricRef.current, { color: brushColor, width: brushWidth });
  }, [brushColor, brushWidth, ready, fabricRef]);
}
