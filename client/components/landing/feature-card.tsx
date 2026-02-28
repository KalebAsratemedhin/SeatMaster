import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  iconBgClass?: string;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href = "#",
  iconBgClass = "bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] dark:bg-[var(--brand-amber)]/20 dark:text-[var(--brand-amber)] group-hover:bg-[var(--brand-navy)] group-hover:text-white dark:group-hover:bg-[var(--brand-amber)] dark:group-hover:text-[var(--brand-navy)]",
}: FeatureCardProps) {
  return (
    <Card className="group rounded-xl border-slate-200/80 dark:border-slate-600/50 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md hover:border-[var(--brand-amber)]/30 dark:hover:border-[var(--brand-amber)]/40 transition-all duration-200">
      <CardContent className="p-6 flex flex-col gap-5">
        <div className={`size-12 rounded-lg flex items-center justify-center transition-colors duration-200 ${iconBgClass}`}>
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-semibold text-[var(--brand-navy)] dark:text-white">
            {title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-amber)] dark:text-[var(--brand-amber)] group-hover:underline"
        >
          Learn more <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  );
}
