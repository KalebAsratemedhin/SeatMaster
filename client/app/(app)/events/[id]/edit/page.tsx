"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useGetEventQuery } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { EventCreateWizard } from "@/components/events/event-create-wizard";

function WizardFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl py-12">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: event, isLoading } = useGetEventQuery(id, {
    skip: !id || !token,
  });

  useEffect(() => {
    if (!token) router.replace("/auth?mode=signin");
  }, [token, router]);

  useEffect(() => {
    if (!event || !user) return;
    if (event.owner_id !== user.id) router.replace(`/events/${id}`);
  }, [event, user, id, router]);

  if (!token) return null;
  if (isLoading || !event) return <WizardFallback />;
  if (user && event.owner_id !== user.id) return null;

  return (
    <Suspense fallback={<WizardFallback />}>
      <EventCreateWizard mode="edit" eventId={id} />
    </Suspense>
  );
}
