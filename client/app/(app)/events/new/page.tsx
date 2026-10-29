"use client";

import { Suspense } from "react";
import { EventCreateWizard } from "@/components/events/event-create-wizard";

function WizardFallback() {
  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <p className="text-muted-foreground">Loading...</p>
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
