import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-6 md:px-20 py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-[var(--brand-navy)]">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-10 text-center max-w-[720px] mx-auto">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Ready to plan your next gala?
          </h2>
          <p className="text-slate-300 dark:text-slate-400 text-lg leading-relaxed">
            Join thousands of professional organizers who trust SeatMaster with their most important events. Start your free trial today.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 w-full">
          <Button
            asChild
            size="lg"
            className="min-w-[200px] h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg transition-all"
          >
            <Link href="/auth?mode=signup">Get Started Now</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-w-[200px] h-12 rounded-lg bg-white/10 text-white border-white/30 hover:bg-white hover:text-[var(--brand-navy)] hover:border-white transition-all"
          >
            <Link href="/contact">Talk to Sales</Link>
          </Button>
        </div>
        <p className="text-sm text-slate-400">No credit card required. Cancel anytime.</p>
      </div>
    </section>
  );
}
