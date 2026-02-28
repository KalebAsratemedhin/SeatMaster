import Image from "next/image";
import { Calendar } from "lucide-react";
import Link from "next/link";

const AUTH_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBKAd0HBdE_XvmvYoI6tBj0NI86SJG_Nt5sL42w7SPQlbWruA3cvuyOxEt7AK0OC-vnJZc6vbuCVc4MqGuzLjdZ1vV-m4Jp024cugjO65aSskyLNIGbjnKOZR_OXZ1kP8zo9-WdtSpAcib7O-lMlhdWFC_ioRp7aOT1uR8cvpNlIcrJU_3xkKsY-j61cSE-ShJ1NbDnk0GLSx-B88p6A9A2LGuSmAhPI1n4RcAs_2wLypdWSGaPPfxmwJsviIKRjx2FlUlC9qx72aAM";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[var(--brand-navy)] overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--brand-amber)]/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-2.5 text-white">
          <div className="size-9 flex items-center justify-center rounded-lg bg-[var(--brand-amber)]/20">
            <Calendar className="size-5 text-[var(--brand-amber)]" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">SeatMaster</span>
        </div>
        <div className="relative z-10 mt-auto">
          <div className="relative mb-8 overflow-hidden rounded-xl shadow-2xl border border-white/10 aspect-video w-full">
            <Image
              src={AUTH_IMAGE}
              alt="Event planning and guest experience"
              fill
              className="object-cover"
              sizes="50vw"
              priority
            />
          </div>
          <h1 className="font-display text-3xl font-semibold text-white leading-tight mb-3">
            Craft Unforgettable Guest Experiences.
          </h1>
          <p className="text-slate-300 text-base max-w-md leading-relaxed">
            The standard for professional event planners to manage RSVPs, seating charts, and digital invitations.
          </p>
        </div>
        <div className="relative z-10 mt-12 flex gap-6 text-slate-400 text-sm">
          <span>© {new Date().getFullYear()} SeatMaster Inc.</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--surface-warm)] dark:bg-slate-900 p-6 sm:p-12 lg:p-20">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
