/** Relative/time labels for chat message timestamps. */
export function formatChatTimestamp(iso: string, nowMs: number = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";

  const diffMs = Math.max(0, nowMs - t);
  const dayMs = 86_400_000;

  if (diffMs < dayMs) {
    return new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const days = Math.floor(diffMs / dayMs);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (days < 365) return `${months}m ago`;

  const years = Math.floor(days / 365);
  return `${Math.max(1, years)}y ago`;
}
