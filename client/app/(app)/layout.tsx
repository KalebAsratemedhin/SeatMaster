"use client";

import { AppLayoutGuard } from "@/components/auth/app-layout-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutGuard>{children}</AppLayoutGuard>;
}
