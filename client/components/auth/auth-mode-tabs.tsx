"use client";

import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthModeTabs({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex h-11 w-full items-center rounded-lg bg-slate-100 dark:bg-slate-800/50 p-1">
      <button
        type="button"
        onClick={() => onModeChange("signin")}
        className={cn(
          "flex h-full grow items-center justify-center rounded-md px-2 text-sm font-semibold transition-all",
          mode === "signin"
            ? "bg-white dark:bg-slate-700 shadow-sm text-[var(--brand-amber)] dark:text-[var(--brand-amber)]"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        )}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onModeChange("signup")}
        className={cn(
          "flex h-full grow items-center justify-center rounded-md px-2 text-sm font-semibold transition-all",
          mode === "signup"
            ? "bg-white dark:bg-slate-700 shadow-sm text-[var(--brand-amber)] dark:text-[var(--brand-amber)]"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        )}
      >
        Sign Up
      </button>
    </div>
  );
}
