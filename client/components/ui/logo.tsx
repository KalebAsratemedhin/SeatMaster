import { Calendar } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 text-[var(--brand-navy)] dark:text-[var(--brand-amber)] ${className ?? ""}`}>
      <div className="size-8 flex items-center justify-center bg-[var(--brand-navy)]/10 dark:bg-[var(--brand-amber)]/20 rounded-lg">
        <Calendar className="size-4 text-[var(--brand-navy)] dark:text-[var(--brand-amber)]" />
      </div>
      <span className="font-display text-xl font-semibold tracking-tight text-[var(--brand-navy)] dark:text-white">
        SeatMaster
      </span>
    </div>
  );
}
