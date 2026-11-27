"use client";

import { Suspense } from "react";
import { EventCreateWizard } from "@/components/events/event-create-wizard";

function WizardFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-12 sm:px-5 lg:px-2">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<WizardFallback />}>
      <EventCreateWizard />
    </Suspense>
  );
}
