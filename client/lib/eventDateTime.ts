import { format, parseISO } from "date-fns";

/**
 * Format "HH:MM:SS" or "HH:MM" to 12-hour human-readable (e.g. "9:00 AM", "5:30 PM").
 */
export function formatEventTime(time: string): string {
  if (!time || typeof time !== "string") return "";
  const part = time.slice(0, 5); // "HH:MM"
  const [h, m] = part.split(":");
  const hour = parseInt(h ?? "0", 10);
  const minute = (m ?? "00").padStart(2, "0");
  if (hour === 0) return `12:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  if (hour < 12) return `${hour}:${minute} AM`;
  return `${hour - 12}:${minute} PM`;
}

/**
 * Format event start and end time range (e.g. "9:00 AM – 5:00 PM").
 */
export function formatEventTimeRange(startTime: string, endTime: string): string {
  const start = formatEventTime(startTime);
  if (!start) return "";
  if (!endTime) return start;
  const end = formatEventTime(endTime);
  return end ? `${start} – ${end}` : start;
}

/**
 * Format ISO date string "YYYY-MM-DD" to human-readable (e.g. "Feb 19, 2025").
 */
export function formatEventDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Format event date with weekday (e.g. "Wednesday, Feb 19, 2025").
 */
export function formatEventDateLong(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, MMM d, yyyy");
  } catch {
    return dateStr;
  }
}
