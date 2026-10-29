import { useEffect, useRef } from "react";

export type StudioKeyboardActions = {
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
  copySelected: () => void;
  pasteClipboard: () => void | Promise<void>;
  duplicateSelected: () => void | Promise<void>;
  deleteSelected: () => void;
};

export function useStudioKeyboard(ready: boolean, actions: StudioKeyboardActions) {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        void actionsRef.current.undo();
      } else if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        void actionsRef.current.redo();
      } else if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        actionsRef.current.copySelected();
      } else if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        void actionsRef.current.pasteClipboard();
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        void actionsRef.current.duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        actionsRef.current.deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);
}
