"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  useGetEventQuery,
  useGetEventInvitesQuery,
  useInviteToEventMutation,
} from "@/lib/api/eventsApi";
import type { EventResponse } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { getInitialsFromEmail } from "@/lib/user-display";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  X,
  Loader2,
} from "lucide-react";

const LocationPickerMapDynamic = dynamic(
  () =>
    import("@/components/map/location-picker-map").then((m) => ({
      default: m.LocationPickerMap,
    })),
  { ssr: false }
);

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "party", label: "Birthday Party" },
  { value: "workshop", label: "Workshop/Seminar" },
  { value: "other", label: "Other" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public — listed for everyone" },
  { value: "private", label: "Private — invite only" },
] as const;

export const WIZARD_STEPS = [
  { id: "details", label: "Details" },
  { id: "guest_list", label: "Guests" },
  { id: "invitations", label: "Invite" },
  { id: "review", label: "Review" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

type EventFormState = {
  name: string;
  banner_url: string;
  visibility: string;
  event_type: string;
  message: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
};

const EMPTY_FORM: EventFormState = {
  name: "",
  banner_url: "",
  visibility: "public",
  event_type: "",
  message: "",
  event_date: "",
  start_time: "09:00:00",
  end_time: "17:00:00",
  location: "",
  latitude: 9.03,
  longitude: 38.74,
};

const fieldClass =
  "rounded-xl border-border bg-card shadow-none text-foreground";

function isWizardStep(value: string | null): value is WizardStepId {
  return WIZARD_STEPS.some((s) => s.id === value);
}

function stepIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id);
}

function formFromEvent(event: EventResponse): EventFormState {
  return {
    name: event.name,
    banner_url: event.banner_url || "",
    visibility: event.visibility || "public",
    event_type: event.event_type || "",
    message: event.message || "",
    event_date: event.event_date || "",
    start_time: event.start_time || "09:00:00",
    end_time: event.end_time || "17:00:00",
    location: event.location || "",
    latitude: event.latitude ?? 9.03,
    longitude: event.longitude ?? 38.74,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    typeof (error as { data?: { error?: string } }).data?.error === "string"
  ) {
    return (error as { data: { error: string } }).data.error;
  }
  return fallback;
}

function WizardProgress({
  current,
  eventId,
  onSelect,
}: {
  current: WizardStepId;
  eventId: string | null;
  onSelect: (step: WizardStepId) => void;
}) {
  const index = stepIndex(current);
  return (
    <nav aria-label="Create event steps" className="mb-10">
      <ol className="flex items-center gap-1 sm:gap-2">
        {WIZARD_STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          const reachable = step.id === "details" || (Boolean(eventId) && i <= index + 1);
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(step.id)}
                className={`flex min-w-0 items-center gap-2 rounded-full px-2.5 py-2 text-left transition sm:px-3 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "text-foreground hover:bg-primary/10"
                      : reachable
                        ? "text-muted-foreground hover:bg-primary/10"
                        : "cursor-not-allowed text-muted-foreground/40"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                    active
                      ? "bg-primary-foreground/20"
                      : done
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="hidden truncate text-sm font-medium sm:inline">{step.label}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={`hidden h-px flex-1 sm:block ${
                    done ? "bg-primary/40" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function FooterActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
      {children}
    </div>
  );
}

export function EventCreateWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useSelector((state: RootState) => state.auth.token);

  const eventIdParam = searchParams.get("eventId");
  const stepParam = searchParams.get("step");

  const [eventId, setEventId] = useState<string | null>(eventIdParam);
  const [step, setStep] = useState<WizardStepId>(() => {
    if (eventIdParam && isWizardStep(stepParam)) return stepParam;
    return "details";
  });
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [formHydratedFor, setFormHydratedFor] = useState<string | null>(null);
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [guestDraft, setGuestDraft] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [inviteSendError, setInviteSendError] = useState<string | null>(null);
  const [sendResults, setSendResults] = useState<{ email: string; ok: boolean; message?: string }[]>(
    []
  );
  const [isSendingInvites, setIsSendingInvites] = useState(false);

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [inviteToEvent] = useInviteToEventMutation();

  const { data: event, isLoading: eventLoading } = useGetEventQuery(eventId ?? "", {
    skip: !eventId || !token,
  });
  const { data: invitesData, refetch: refetchInvites } = useGetEventInvitesQuery(
    { eventId: eventId ?? "", limit: 100, offset: 0 },
    { skip: !eventId || !token }
  );

  const invites = invitesData?.items ?? [];
  const invitedEmails = useMemo(
    () => new Set(invites.map((i) => normalizeEmail(i.email))),
    [invites]
  );

  useEffect(() => {
    if (!token) router.replace("/auth?mode=signin");
  }, [token, router]);

  useEffect(() => {
    if (!eventIdParam) return;
    setEventId(eventIdParam);
    if (isWizardStep(stepParam)) setStep(stepParam);
  }, [eventIdParam, stepParam]);

  useEffect(() => {
    if (!event || !eventId || formHydratedFor === eventId) return;
    setForm(formFromEvent(event));
    setFormHydratedFor(eventId);
  }, [event, eventId, formHydratedFor]);

  const syncUrl = (nextEventId: string | null, nextStep: WizardStepId) => {
    const params = new URLSearchParams();
    if (nextEventId) params.set("eventId", nextEventId);
    if (nextEventId || nextStep !== "details") params.set("step", nextStep);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const goToStep = (next: WizardStepId) => {
    setStep(next);
    syncUrl(eventId, next);
  };

  const canEnterStep = (target: WizardStepId) => {
    if (target === "details") return true;
    return Boolean(eventId);
  };

  const handleStepChipClick = (target: WizardStepId) => {
    if (!canEnterStep(target)) return;
    const targetIdx = stepIndex(target);
    const currentIdx = stepIndex(step);
    if (targetIdx > currentIdx + 1) return;
    goToStep(target);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    const payload = {
      name: form.name.trim(),
      banner_url: form.banner_url || "",
      visibility: form.visibility,
      event_type: form.event_type || "other",
      message: form.message || "",
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || "",
      latitude: form.latitude,
      longitude: form.longitude,
    };
    if (!payload.name || !payload.event_date) {
      setDetailsError("Name and date are required.");
      return;
    }
    try {
      if (eventId) {
        await updateEvent({ id: eventId, ...payload }).unwrap();
        goToStep("guest_list");
      } else {
        const created = await createEvent(payload).unwrap();
        setEventId(created.id);
        setFormHydratedFor(created.id);
        setStep("guest_list");
        syncUrl(created.id, "guest_list");
      }
    } catch (err) {
      setDetailsError(apiErrorMessage(err, "Failed to save event"));
    }
  };

  const addPendingEmail = () => {
    setGuestError(null);
    const email = normalizeEmail(guestDraft);
    if (!email) return;
    if (!isValidEmail(email)) {
      setGuestError("Enter a valid email address.");
      return;
    }
    if (invitedEmails.has(email) || pendingEmails.includes(email)) {
      setGuestError("That email is already on the list.");
      return;
    }
    setPendingEmails((prev) => [...prev, email]);
    setGuestDraft("");
  };

  const removePendingEmail = (email: string) => {
    setPendingEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSendInvitations = async () => {
    if (!eventId || pendingEmails.length === 0) {
      goToStep("review");
      return;
    }
    setIsSendingInvites(true);
    setInviteSendError(null);
    const results: { email: string; ok: boolean; message?: string }[] = [];
    for (const email of pendingEmails) {
      try {
        await inviteToEvent({ eventId, email }).unwrap();
        results.push({ email, ok: true });
      } catch (err) {
        results.push({
          email,
          ok: false,
          message: apiErrorMessage(err, "Failed to invite"),
        });
      }
    }
    setSendResults(results);
    const failed = results.filter((r) => !r.ok).map((r) => r.email);
    setPendingEmails(failed);
    await refetchInvites();
    setIsSendingInvites(false);
    if (failed.length === 0) {
      goToStep("review");
    } else {
      setInviteSendError(
        `${failed.length} invitation${failed.length === 1 ? "" : "s"} failed. Fix or remove them, then try again.`
      );
    }
  };

  if (!token) return null;

  if (eventId && eventLoading && !event) {
    return (
      <div className="mx-auto w-full max-w-3xl py-12">
        <p className="text-muted-foreground">Loading event…</p>
      </div>
    );
  }

  const activeStep: WizardStepId = step !== "details" && !eventId ? "details" : step;
  const savingDetails = isCreating || isUpdating;
  const typeLabel =
    EVENT_TYPES.find((t) => t.value === form.event_type)?.label || form.event_type || "—";
  const stepMeta = WIZARD_STEPS[stepIndex(activeStep)];

  return (
    <div className="mx-auto w-full max-w-3xl pb-12">
      <Link
        href="/events/discover?mine=1"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Events
      </Link>

      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
          Step {stepIndex(activeStep) + 1} of {WIZARD_STEPS.length}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          {eventId ? "Continue setup" : "Create event"}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {activeStep === "details" && "Name it, set the time and place, then continue."}
          {activeStep === "guest_list" && "Add guest emails now — you can invite more later."}
          {activeStep === "invitations" && "Send invites when you’re ready, or skip for now."}
          {activeStep === "review" && "A quick check before you open the event."}
        </p>
      </header>

      <WizardProgress current={activeStep} eventId={eventId} onSelect={handleStepChipClick} />

      {activeStep === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-10">
          <section className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Basics
            </h2>
            <Field label="Event name *" htmlFor="name">
              <Input
                id="name"
                required
                placeholder="Summer garden party"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Type" htmlFor="event_type">
                <Select
                  value={form.event_type || undefined}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, event_type: v }))}
                >
                  <SelectTrigger id="event_type" className={fieldClass}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Visibility" htmlFor="visibility">
                <Select
                  value={form.visibility}
                  onValueChange={(visibility) => setForm((prev) => ({ ...prev, visibility }))}
                >
                  <SelectTrigger id="visibility" className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Description" htmlFor="message" hint="Optional">
              <textarea
                id="message"
                className={`flex min-h-[96px] w-full border px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 ${fieldClass}`}
                placeholder="A short note for your guests"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </Field>
          </section>

          <section className="space-y-5 border-t border-border pt-10">
            <h2 className="font-display text-lg font-semibold text-foreground">
              When
            </h2>
            <Field label="Date *" htmlFor="event_date">
              <DatePicker
                value={form.event_date}
                onChange={(event_date) => setForm((prev) => ({ ...prev, event_date }))}
                placeholder="Pick a date"
                className={fieldClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Starts" htmlFor="start_time">
                <TimePicker
                  value={form.start_time}
                  onChange={(start_time) => setForm((prev) => ({ ...prev, start_time }))}
                  placeholder="Start time"
                  className={fieldClass}
                />
              </Field>
              <Field label="Ends" htmlFor="end_time">
                <TimePicker
                  value={form.end_time}
                  onChange={(end_time) => setForm((prev) => ({ ...prev, end_time }))}
                  placeholder="End time"
                  className={fieldClass}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-5 border-t border-border pt-10">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Where
            </h2>
            <Field label="Venue" htmlFor="location" hint="Optional">
              <Input
                id="location"
                placeholder="Venue or neighborhood"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <div className="overflow-hidden rounded-2xl ring-1 ring-border">
              <LocationPickerMapDynamic
                latitude={form.latitude}
                longitude={form.longitude}
                onLocationChange={(lat, lng, label) =>
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    ...(label && !prev.location.trim()
                      ? { location: label.split(",")[0]?.trim() || label }
                      : {}),
                  }))
                }
                height="240px"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tap the map to set the pin. You can refine the invitation card later.
            </p>
          </section>

          {detailsError && <p className="text-sm text-destructive">{detailsError}</p>}

          <FooterActions>
            <Button type="button" variant="ghost" asChild className="rounded-xl">
              <Link href="/events/discover?mine=1">Cancel</Link>
            </Button>
            <div className="flex-1" />
            <Button
              type="submit"
              disabled={savingDetails}
              className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {savingDetails ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 size-4" />
                </>
              )}
            </Button>
          </FooterActions>
        </form>
      )}

      {activeStep === "guest_list" && eventId && (
        <div className="space-y-8">
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Field label="Guest email" htmlFor="guest-email">
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder="guest@example.com"
                    value={guestDraft}
                    onChange={(e) => {
                      setGuestDraft(e.target.value);
                      setGuestError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPendingEmail();
                      }
                    }}
                    className={fieldClass}
                  />
                </Field>
              </div>
              <Button type="button" onClick={addPendingEmail} className="h-10 rounded-xl px-5">
                <UserPlus className="mr-2 size-4" />
                Add
              </Button>
            </div>
            {guestError && <p className="text-sm text-destructive">{guestError}</p>}

            {pendingEmails.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  Ready to invite · {pendingEmails.length}
                </p>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                  {pendingEmails.map((email) => (
                    <li key={email} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                          {getInitialsFromEmail(email)}
                        </div>
                        <span className="truncate text-sm">{email}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removePendingEmail(email)}
                        aria-label={`Remove ${email}`}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {invites.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Already invited · {invites.length}
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {invites.map((inv) => (
                    <li key={inv.id}>{inv.email}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <FooterActions>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => goToStep("details")}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => goToStep("invitations")}
            >
              Skip
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => goToStep("invitations")}
            >
              Continue
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </FooterActions>
        </div>
      )}

      {activeStep === "invitations" && eventId && (
        <div className="space-y-8">
          <section className="space-y-5">
            {pendingEmails.length === 0 ? (
              <div className="rounded-2xl bg-card px-5 py-8 text-sm text-muted-foreground ring-1 ring-border">
                {invites.length > 0
                  ? `${invites.length} guest${invites.length === 1 ? "" : "s"} already invited. You can continue.`
                  : "No emails queued. Add guests on the previous step, or continue and invite later."}
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                {pendingEmails.map((email) => {
                  const result = sendResults.find((r) => r.email === email);
                  return (
                    <li key={email} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span>{email}</span>
                      {result && !result.ok && (
                        <span className="text-xs text-destructive">{result.message}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {inviteSendError && <p className="text-sm text-destructive">{inviteSendError}</p>}
          </section>

          <FooterActions>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => goToStep("guest_list")}
              disabled={isSendingInvites}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => goToStep("review")}
              disabled={isSendingInvites}
            >
              Skip
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={handleSendInvitations}
              disabled={isSendingInvites}
            >
              {isSendingInvites ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  Sending…
                </>
              ) : pendingEmails.length > 0 ? (
                <>
                  Send {pendingEmails.length}
                  <ChevronRight className="ml-1 size-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 size-4" />
                </>
              )}
            </Button>
          </FooterActions>
        </div>
      )}

      {activeStep === "review" && eventId && (
        <div className="space-y-8">
          <section className="overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Your event
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {form.name || event?.name || "Untitled event"}
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/75">
              {formatEventDate(form.event_date)} ·{" "}
              {formatEventTimeRange(form.start_time, form.end_time)}
            </p>
            {form.location ? (
              <p className="mt-1 text-sm text-primary-foreground/75">{form.location}</p>
            ) : null}
          </section>

          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{typeLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Visibility
              </dt>
              <dd className="mt-1 text-sm font-medium capitalize text-foreground">
                {form.visibility}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Guests
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {invites.length} invited
                {pendingEmails.length > 0 ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {pendingEmails.length} not sent yet
                  </span>
                ) : null}
              </dd>
            </div>
            {form.message ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                  {form.message}
                </dd>
              </div>
            ) : null}
          </dl>

          {invites.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Guest list
              </p>
              <ul className="columns-1 gap-x-8 text-sm text-muted-foreground sm:columns-2">
                {invites.map((inv) => (
                  <li key={inv.id} className="break-inside-avoid py-0.5">
                    {inv.email}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Next, design an invitation card from the event page — that&apos;s what guests see first.
          </p>

          <FooterActions>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => goToStep("invitations")}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push(`/events/${eventId}`)}
            >
              Open event
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </FooterActions>
        </div>
      )}

      {/* Keep step label available for a11y/context even if unused visually beyond header */}
      <span className="sr-only">{stepMeta?.label}</span>
    </div>
  );
}
