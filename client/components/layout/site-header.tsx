"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#case-studies", label: "Case Studies" },
  { href: "#support", label: "Support" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-900/10 dark:border-emerald-800/30 bg-white dark:bg-[#022c22] px-6 md:px-20 py-4">
      <Logo />
      <div className="flex flex-1 justify-end items-center gap-8">
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-3">
        <Button asChild className="bg-[#044b36] hover:bg-[#065f46] text-white shadow-lg shadow-[#044b36]/20">
          <Link href="/auth?mode=signup">Get Started</Link>
        </Button>
        <Button asChild variant="outline" className="hidden sm:flex border-slate-200 dark:border-emerald-800/50 bg-slate-100 dark:bg-emerald-900/40">
          <Link href="/auth?mode=signin">Login</Link>
        </Button>
        </div>
      </div>
    </header>
  );
}