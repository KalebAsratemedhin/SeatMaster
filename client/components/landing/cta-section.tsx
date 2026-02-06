import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-6 md:px-20 py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-[#022c22]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-10 text-center max-w-[800px] mx-auto">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Ready to plan your next gala?
          </h2>
          <p className="text-emerald-100/60 text-lg">
            Join thousands of professional organizers who trust SeatMaster with their most important events. Start your free trial today.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 w-full">
          <Button asChild size="lg" className="min-w-[200px] h-14 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-emerald-950 shadow-xl shadow-[#D4AF37]/20 hover:scale-[1.02] transition-transform">
            <Link href="#">Get Started Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-w-[200px] h-14 rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Link href="#">Talk to Sales</Link>
          </Button>
        </div>
        <p className="text-sm text-emerald-100/40">No credit card required. Cancel anytime.</p>
      </div>
    </section>
  );
}