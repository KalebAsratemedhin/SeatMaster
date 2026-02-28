import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=a",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=b",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=c",
];

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCvpfVxYmx08newmrLR94ViWDC4he3tVq9IpAxotuorxxuH-H4yUVhp9ORqvIdbrpG8FjYKijdAhfwKnLkHU5ohomk_KYc-0TMNYouFyWqbuSoRtpcPl8NLMw0ubo2-DM_Otds2TFUMPw6HF-EdHGy3E6mmxzNfI7vT4xezsPda7N3lCYHkc0h4247ZSCJYL0_sA76B35TTu55e92g1r1Ueb-0tcZgAtU8tZCdUgSQmesIHNR_92XyByytBdxR-tNjYw_-iXppOAdbw";

export function HeroSection() {
  return (
    <section className="px-6 md:px-20 py-16 md:py-24">
      <div className="flex flex-col gap-12 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.15] tracking-tight text-[var(--brand-navy)] dark:text-white">
              Elevate Your{" "}
              <span className="text-[var(--brand-amber)] dark:text-[var(--brand-amber)]">Event Management</span>{" "}
              Experience
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-[520px] leading-relaxed">
              Sophisticated tools for invitations, real-time RSVP tracking, and professional seating charts. Create unforgettable guest experiences with effortless precision.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="min-w-[180px] h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg transition-all"
            >
              <Link href="/discover">Start Your Event</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-[180px] h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <Link href="/discover">Watch Demo</Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex -space-x-2">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className="size-9 rounded-full border-2 border-[var(--surface-warm)] dark:border-slate-900 bg-slate-200 bg-cover bg-center ring-1 ring-slate-200 dark:ring-slate-700"
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))}
            </div>
            <span>Joined by 5,000+ elite event organizers</span>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--brand-amber)]/20 to-[var(--brand-navy)]/10 dark:from-[var(--brand-amber)]/15 dark:to-transparent blur-3xl rounded-2xl" />
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-600/50 shadow-2xl">
            <Image
              src={HERO_IMAGE}
              alt="SeatMaster event management"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
