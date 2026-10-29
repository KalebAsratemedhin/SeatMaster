"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { isPublicAppPath } from "@/lib/publicAppRoutes";
import { AppShell } from "@/components/layout/app-shell";
import { PublicBrowseShell } from "@/components/layout/public-browse-shell";

export function AppLayoutGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth.token);
  const hasHydrated = useSelector((state: RootState) => state.auth.hasHydrated);
  const isPublic = isPublicAppPath(pathname);

  useEffect(() => {
    if (!hasHydrated || token || isPublic) return;
    const redirect = `/auth?mode=signin${pathname ? `&redirect=${encodeURIComponent(pathname)}` : ""}`;
    router.replace(redirect);
  }, [hasHydrated, token, router, pathname, isPublic]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)]">
        <div
          className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (token) {
    return <AppShell>{children}</AppShell>;
  }

  if (isPublic) {
    return <PublicBrowseShell>{children}</PublicBrowseShell>;
  }

  return null;
}
