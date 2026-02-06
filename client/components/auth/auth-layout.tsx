import Image from "next/image";
import { Calendar } from "lucide-react";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#10b981] overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-100 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3 text-white">
          <Calendar className="size-8" />
          <h2 className="text-2xl font-bold tracking-tight">SeatMaster</h2>
        </div>
        <div className="relative z-10 mt-auto">
          <div className="mb-8 overflow-hidden rounded-2xl shadow-2xl border-4 border-white/10 aspect-video w-full bg-cover bg-center"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1540575467063-178bf50e2eae?w=800&q=80)" }}
          />
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Craft Unforgettable Guest Experiences.
          </h1>
          <p className="text-emerald-50/90 text-lg max-w-md">
            The emerald standard for professional event planners to manage RSVPs, seating charts, and digital invitations.
          </p>
        </div>
        <div className="relative z-10 mt-12 flex gap-6 text-emerald-100/60 text-sm">
          <span>© 2024 SeatMaster Inc.</span>
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-900 p-6 sm:p-12 lg:p-20">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}