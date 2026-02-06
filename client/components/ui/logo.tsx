import { Calendar } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-[#044b36] dark:text-[#D4AF37] ${className ?? ""}`}>
      <div className="size-8 flex items-center justify-center bg-[#044b36]/10 dark:bg-[#D4AF37]/10 rounded-lg">
        <Calendar className="size-5 text-[#044b36] dark:text-[#D4AF37]" />
      </div>
      <span className="text-xl font-extrabold tracking-tight text-emerald-900 dark:text-white">
        SeatMaster
      </span>
    </div>
  );
}