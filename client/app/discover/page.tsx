"use client";

import { Suspense } from "react";
import Link from "next/link";
import { DiscoverContent, DiscoverFallback } from "@/components/events/discover-view";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { HeaderSearch } from "@/components/layout/site-header";

export default function PublicDiscoverPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f8] dark:bg-[#101922] text-[#111418] dark:text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#022c22] px-6 md:px-20 py-4">
        <Link href="/" className="shrink-0" aria-label="SeatMaster home">
          <Logo />
        </Link>
        <div className="flex flex-1 justify-center min-w-0 max-w-xl mx-auto">
          <HeaderSearch placeholder="Search events..." className="w-full" />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
            <Link href="/auth?mode=signin">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-[#044b36] hover:bg-[#065f46] text-white">
            <Link href="/auth?mode=signup">Get started</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 lg:p-8">
        <Suspense fallback={<DiscoverFallback />}>
          <DiscoverContent />
        </Suspense>
      </main>
    </div>
  );
}
