import { StatCard } from "./stat-card";

const STATS = [
  { label: "Events Managed", value: "10k+", accentColor: "primary" as const },
  { label: "RSVPs Tracked", value: "250k+", accentColor: "gold" as const },
  { label: "Satisfaction Rate", value: "99.9%", accentColor: "emerald" as const },
];

export function StatsSection() {
  return (
    <section className="px-6 md:px-20 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}