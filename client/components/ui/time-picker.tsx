"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);
const PERIODS = ["AM", "PM"] as const;

/** 24h "HH:MM:SS" -> { hour 1-12, minute, AM/PM }. */
function parseTime(
  value: string
): { hour12: string; minute: string; period: "AM" | "PM" } {
  const part = value.slice(0, 5);
  const [h, m] = part.split(":");
  const h24 = parseInt(h ?? "9", 10);
  const minute = (m ?? "00").padStart(2, "0");
  if (h24 === 0)
    return { hour12: "12", minute, period: "AM" };
  if (h24 === 12)
    return { hour12: "12", minute, period: "PM" };
  if (h24 < 12)
    return { hour12: String(h24), minute, period: "AM" };
  return { hour12: String(h24 - 12), minute, period: "PM" };
}

/** 12h hour + AM/PM -> 24h "HH". */
function to24h(hour12: string, period: "AM" | "PM"): string {
  const n = parseInt(hour12, 10);
  if (period === "AM") return n === 12 ? "00" : n.toString().padStart(2, "0");
  return n === 12 ? "12" : (n + 12).toString().padStart(2, "0");
}

/** Format "HH:MM" for display (e.g. "9:00 AM", "2:30 PM"). */
function formatTimeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = parseInt(h ?? "0", 10);
  const minute = (m ?? "00").padStart(2, "0");
  if (hour === 0) return `12:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  if (hour < 12) return `${hour}:${minute} AM`;
  return `${hour - 12}:${minute} PM`;
}

/** Value is time string "HH:MM:SS". */
export function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { hour12, minute, period } = parseTime(value);

  const commit = (h: string, m: string, p: "AM" | "PM") => {
    onChange(`${to24h(h, p)}:${m}:00`);
  };

  const handleHourChange = (h: string) => commit(h, minute, period);
  const handleMinuteChange = (m: string) => commit(hour12, m, period);
  const handlePeriodChange = (p: string) =>
    commit(hour12, minute, p as "AM" | "PM");

  const display = value ? formatTimeDisplay(value.slice(0, 5)) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 rounded-xl border-slate-200 dark:border-slate-600 shadow-sm pr-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <ClockIcon className="mr-2 size-4" />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Hour
            </span>
            <Select value={hour12} onValueChange={handleHourChange}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS_12.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Minute
            </span>
            <Select value={minute} onValueChange={handleMinuteChange}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              AM / PM
            </span>
            <div
              role="group"
              aria-label="AM or PM"
              className="flex rounded-md border border-input bg-muted/30 p-0.5"
            >
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodChange(p)}
                  className={cn(
                    "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                    period === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
