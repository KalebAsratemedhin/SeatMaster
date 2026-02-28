import { Mail, LayoutGrid, BarChart3 } from "lucide-react";
import { FeatureCard } from "./feature-card";

const FEATURES = [
  {
    icon: Mail,
    title: "RSVP Tracking",
    description: "Real-time updates on guest attendance, dietary preferences, and custom registration fields.",
    iconBgClass: "bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] dark:bg-[var(--brand-amber)]/20 dark:text-[var(--brand-amber)] group-hover:bg-[var(--brand-navy)] group-hover:text-white dark:group-hover:bg-[var(--brand-amber)] dark:group-hover:text-[var(--brand-navy)]",
  },
  {
    icon: LayoutGrid,
    title: "Seating Charts",
    description: "Intuitive drag-and-drop seating management with custom venue layouts and table configurations.",
    iconBgClass: "bg-[var(--brand-amber)]/15 text-[var(--brand-amber)] dark:bg-[var(--brand-amber)]/20 dark:text-[var(--brand-amber)] group-hover:bg-[var(--brand-amber)] group-hover:text-[var(--brand-navy)]",
  },
  {
    icon: BarChart3,
    title: "Guest Analytics",
    description: "Gain deep insights into guest demographics, arrival patterns, and engagement metrics.",
    iconBgClass: "bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] dark:bg-[var(--brand-amber)]/20 dark:text-[var(--brand-amber)] group-hover:bg-[var(--brand-navy)] group-hover:text-white dark:group-hover:bg-[var(--brand-amber)] dark:group-hover:text-[var(--brand-navy)]",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 md:px-20 py-20 bg-slate-100/60 dark:bg-slate-900/40">
      <div className="flex flex-col gap-14">
        <div className="flex flex-col gap-4 max-w-[720px]">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--brand-navy)] dark:text-white">
            Powerful Features for{" "}
            <span className="text-[var(--brand-amber)]">Perfect Planning</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            Everything you need to manage your guest list from invitation to final seating, all in one elegant interface.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
