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

export function FeatureCard({ icon: Icon, title, description, href = "#", iconBgClass = "bg-[#044b36]/10 text-[#044b36] hover:bg-[#044b36] hover:text-white" }: FeatureCardProps) {
  return (
    <Card className="group rounded-2xl border-emerald-900/10 dark:border-emerald-800/50 bg-white dark:bg-emerald-900/20 hover:shadow-xl hover:border-[#D4AF37]/20 transition-all">
      <CardContent className="p-8 flex flex-col gap-6">
        <div className={`size-14 rounded-xl flex items-center justify-center transition-colors ${iconBgClass}`}>
          <Icon className="size-8" />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-emerald-950 dark:text-white">{title}</h3>
          <p className="text-slate-500 dark:text-emerald-100/40 text-base leading-relaxed">{description}</p>
        </div>
        <Link
          href={href}
          className="flex items-center gap-2 text-sm font-bold text-[#044b36] dark:text-[#D4AF37] group-hover:underline"
        >
          Learn more <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  );
}