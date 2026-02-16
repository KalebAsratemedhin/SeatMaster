import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=a",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=b",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=c",
];

const HERO_IMAGE = "/images/landing-hero.png";

export function HeroSection() {
  return (
    <section className="px-6 md:px-20 py-12 md:py-20">
      <div className="flex flex-col gap-10 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-widest uppercase w-fit">
              <Star className="size-3.5" />
              Premium Event Planning
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-emerald-950 dark:text-white">
              Elevate Your{" "}
              <span className="text-[#044b36] dark:text-[#D4AF37]">Event Management</span> Experience
            </h1>
            <p className="text-slate-600 dark:text-emerald-100/60 text-lg max-w-[540px]">
              Sophisticated tools for invitations, real-time RSVP tracking, and professional seating charts. Create unforgettable guest experiences with effortless precision.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="min-w-[180px] h-14 rounded-xl bg-[#044b36] hover:bg-[#065f46] text-white shadow-xl shadow-[#044b36]/30 hover:scale-[1.02] transition-transform">
              <Link href="/events/discover">Start Your Event</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[180px] h-14 rounded-xl border-2 border-emerald-900/10 dark:border-emerald-800 hover:border-[#D4AF37]/50">
              <Link href="/events/discover">Watch Demo</Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-emerald-900/50 dark:text-emerald-100/40">
            <div className="flex -space-x-2">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className="size-8 rounded-full border-2 border-white dark:border-[#022c22] bg-slate-300 bg-cover bg-center"
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))}
            </div>
            <span>Joined by 5,000+ elite event organizers</span>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#044b36]/30 to-[#D4AF37]/20 blur-3xl rounded-full" />
          <div className="relative w-full aspect-[4/3] rounded-2xl shadow-2xl overflow-hidden border-8 border-white dark:border-emerald-900/50">
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