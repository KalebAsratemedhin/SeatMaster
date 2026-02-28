"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";

export function AppLayoutGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (token !== undefined && !token) {
      const redirect = `/auth?mode=signin${pathname ? `&redirect=${encodeURIComponent(pathname)}` : ""}`;
      router.replace(redirect);
    }
  }, [token, router, pathname]);

  if (token !== undefined && !token) {
    return null;
  }

  return <>{children}</>;
}
