import { Mail, LayoutGrid, BarChart3 } from "lucide-react";
import { FeatureCard } from "./feature-card";

const FEATURES = [
  {
    icon: Mail,
    title: "RSVP Tracking",
    description: "Real-time updates on guest attendance, dietary preferences, and custom registration fields.",
    iconBgClass: "bg-[#044b36]/10 text-[#044b36] group-hover:bg-[#044b36] group-hover:text-white",
  },
  {
    icon: LayoutGrid,
    title: "Seating Charts",
    description: "Intuitive drag-and-drop seating management with custom venue layouts and table configurations.",
    iconBgClass: "bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white",
  },
  {
    icon: BarChart3,
    title: "Guest Analytics",
    description: "Gain deep insights into guest demographics, arrival patterns, and engagement metrics.",
    iconBgClass: "bg-[#044b36]/10 text-[#044b36] group-hover:bg-[#044b36] group-hover:text-white",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 md:px-20 py-20 bg-emerald-50/50 dark:bg-emerald-950/20">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4 max-w-[800px]">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-emerald-950 dark:text-white">
            Powerful Features for <br />
            <span className="text-[#044b36] dark:text-[#D4AF37]">Perfect Planning</span>
          </h2>
          <p className="text-slate-600 dark:text-emerald-100/60 text-lg">
            Everything you need to manage your guest list from invitation to final seating, all in one elegant interface.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}