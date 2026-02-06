import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  accentColor: "primary" | "gold" | "emerald";
};

const ACCENT_CLASS = {
  primary: "bg-[#044b36]",
  gold: "bg-[#D4AF37]",
  emerald: "bg-[#065f46]",
};

export function StatCard({ label, value, accentColor }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-emerald-900/10 dark:border-emerald-800/50 bg-white dark:bg-emerald-950/30 shadow-sm">
      <CardContent className="p-8 flex flex-col gap-2">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-800/60 dark:text-emerald-100/40">
          {label}
        </p>
        <p className="text-4xl font-black leading-tight text-emerald-950 dark:text-white">{value}</p>
        <div className={`h-1 w-12 rounded-full ${ACCENT_CLASS[accentColor]}`} />
      </CardContent>
    </Card>
  );
}