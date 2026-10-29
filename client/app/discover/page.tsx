"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { DiscoverContent, DiscoverFallback } from "@/components/events/discover-view";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { HeaderSearch } from "@/components/layout/site-header";
import type { RootState } from "@/lib/store";

function AuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const hasHydrated = useSelector((state: RootState) => state.auth.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    const qs = searchParams.toString();
    router.replace(qs ? `/events/discover?${qs}` : "/events/discover");
  }, [hasHydrated, token, router, searchParams]);

  return null;
}

export default function PublicDiscoverPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const hasHydrated = useSelector((state: RootState) => state.auth.hasHydrated);

  if (hasHydrated && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)]">
        <Suspense fallback={null}>
          <AuthRedirect />
        </Suspense>
        <p className="text-muted-foreground text-sm">Taking you to Events…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)] text-slate-800 dark:text-white">
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/50 bg-white/95 dark:bg-[var(--brand-navy)]/95 backdrop-blur-sm px-6 md:px-20 py-4">
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
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
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
