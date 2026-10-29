"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { HeaderSearch } from "@/components/layout/site-header";

/** Light chrome for guests browsing public events / RSVP (no app sidebar). */
export function PublicBrowseShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)] text-slate-800 dark:text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/50 bg-white/95 dark:bg-[var(--brand-navy)]/95 backdrop-blur-sm px-4 md:px-8 py-3">
        <Link href="/" className="shrink-0" aria-label="SeatMaster home">
          <Logo />
        </Link>
        <div className="flex flex-1 justify-center min-w-0 max-w-xl mx-auto">
          <HeaderSearch placeholder="Search events..." className="w-full" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/discover">Events</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth?mode=signin">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            <Link href="/auth?mode=signup">Get started</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 px-3 py-4 lg:px-4 lg:py-5">{children}</main>
    </div>
  );
}
