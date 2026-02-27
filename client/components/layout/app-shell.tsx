"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f6f7f8] dark:bg-[#101922] text-[#111418] dark:text-white">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0 lg:ml-72">
        <SiteHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
