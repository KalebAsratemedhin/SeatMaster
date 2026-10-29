"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { HeaderSearch } from "@/components/layout/site-header";

/** Light chrome for guests browsing public events / RSVP (no app sidebar). */
export function PublicBrowseShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)] text-slate-800 dark:text-white">
      <header className="z-50 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-700/50 dark:bg-[var(--brand-navy)]/95 md:px-8">
        <Link href="/" className="shrink-0" aria-label="SeatMaster home">
          <Logo />
        </Link>
        <div className="mx-auto flex min-w-0 max-w-xl flex-1 justify-center">
          <HeaderSearch placeholder="Search events..." className="w-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/discover">Events</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth?mode=signin">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/auth?mode=signup">Get started</Link>
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 lg:px-4 lg:py-5">
        {children}
      </main>
    </div>
  );
}
