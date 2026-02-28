import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  accentColor: "primary" | "gold" | "emerald";
};

const ACCENT_CLASS = {
  primary: "bg-primary",
  gold: "bg-primary/80",
  emerald: "bg-muted",
};

export function StatCard({ label, value, accentColor }: StatCardProps) {
  return (
    <Card className="rounded-xl border-slate-200/80 dark:border-slate-600/50 bg-white/80 dark:bg-slate-800/50 shadow-sm backdrop-blur-sm">
      <CardContent className="p-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="font-display text-3xl font-semibold leading-tight text-[var(--brand-navy)] dark:text-white">
          {value}
        </p>
        <div className={`h-1 w-10 rounded-full ${ACCENT_CLASS[accentColor]}`} />
      </CardContent>
    </Card>
  );
}
