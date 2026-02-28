"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AppLayoutGuard } from "@/components/auth/app-layout-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayoutGuard>
      <AppShell>{children}</AppShell>
    </AppLayoutGuard>
  );
}
