import { useCallback, useRef } from "react";
import type { FabricCanvas } from "./types";

type UseFabricHistoryArgs = {
  fabricRef: React.RefObject<FabricCanvas | null>;
  onStackChange: () => void;
};

export function useFabricHistory({ fabricRef, onStackChange }: UseFabricHistoryArgs) {
  const historyRef = useRef<string[]>([]);
  const futureRef = useRef<string[]>([]);
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback(() => {
    const c = fabricRef.current;
    if (!c || skipHistoryRef.current) return;
    const json = JSON.stringify(c.toObject(["name", "__locked"]));
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev === json) return;
    historyRef.current.push(json);
    if (historyRef.current.length > 40) historyRef.current.shift();
    futureRef.current = [];
    onStackChange();
  }, [fabricRef, onStackChange]);

  const resetHistoryFromCanvas = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    historyRef.current = [JSON.stringify(c.toObject(["name", "__locked"]))];
    futureRef.current = [];
  }, [fabricRef]);

  const undo = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || historyRef.current.length < 2) return;
    const current = historyRef.current.pop()!;
    futureRef.current.push(current);
    const prev = historyRef.current[historyRef.current.length - 1]!;
    skipHistoryRef.current = true;
    await canvas.loadFromJSON(JSON.parse(prev));
    skipHistoryRef.current = false;
    canvas.requestRenderAll();
    onStackChange();
  }, [fabricRef, onStackChange]);

  const redo = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(next);
    skipHistoryRef.current = true;
    await canvas.loadFromJSON(JSON.parse(next));
    skipHistoryRef.current = false;
    canvas.requestRenderAll();
    onStackChange();
  }, [fabricRef, onStackChange]);

  const runWithoutHistory = useCallback(async (fn: () => void | Promise<void>) => {
    skipHistoryRef.current = true;
    try {
      await fn();
    } finally {
      skipHistoryRef.current = false;
    }
  }, []);

  return {
    historyRef,
    futureRef,
    skipHistoryRef,
    pushHistory,
    resetHistoryFromCanvas,
    undo,
    redo,
    runWithoutHistory,
  };
}
