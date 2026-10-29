"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

const SIDEBAR_COLLAPSED_KEY = "sm-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Invitation studio is a full-viewport editor — drop app sidebar + header chrome.
  const immersive = Boolean(pathname?.includes("/invitation-card"));
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (immersive) {
    return (
      <div className="h-dvh overflow-hidden bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)] text-slate-800 dark:text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--surface-warm)] dark:bg-[var(--brand-navy)] text-slate-800 dark:text-white">
      <AppSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${
          collapsed ? "lg:ml-[4.5rem]" : "lg:ml-72"
        }`}
      >
        <SiteHeader />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 lg:px-4 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
