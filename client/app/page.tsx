import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-warm)] dark:bg-[var(--surface-warm)] text-slate-800 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}