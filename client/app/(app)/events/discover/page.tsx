"use client";

import { Suspense } from "react";
import { DiscoverContent, DiscoverFallback } from "@/components/events/discover-view";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <DiscoverContent />
    </Suspense>
  );
}
