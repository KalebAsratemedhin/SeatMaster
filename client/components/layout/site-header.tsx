"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/slices/authSlice";
import type { RootState } from "@/lib/store";
import { LogOut, User } from "lucide-react";

const PUBLIC_NAV_LINKS = [
  { href: "/events/discover", label: "Discover" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#case-studies", label: "Case Studies" },
  { href: "#support", label: "Support" },
];

export function SiteHeader() {
  const dispatch = useDispatch();
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!token;

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-900/10 dark:border-emerald-800/30 bg-white dark:bg-[#022c22] px-6 md:px-20 py-4">
      <Logo />
      <div className="flex flex-1 justify-end items-center gap-8">
        <nav className="hidden md:flex items-center gap-8">
          {isLoggedIn && (
            <Link
              href="/events"
              className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              Events
            </Link>
          )}
          {PUBLIC_NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <span className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-emerald-100/80">
                <User className="size-4" />
                {user?.email ?? "Account"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-slate-200 dark:border-emerald-800/50 bg-slate-100 dark:bg-emerald-900/40"
              >
                <LogOut className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="bg-[#044b36] hover:bg-[#065f46] text-white shadow-lg shadow-[#044b36]/20">
                <Link href="/auth?mode=signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" className="hidden sm:flex border-slate-200 dark:border-emerald-800/50 bg-slate-100 dark:bg-emerald-900/40">
                <Link href="/auth?mode=signin">Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}