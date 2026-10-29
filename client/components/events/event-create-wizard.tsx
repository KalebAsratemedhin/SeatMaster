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
import { BannerUpload } from "@/components/events/banner-upload";
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
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Lock,
  UserPlus,
  X,
  CheckCircle2,
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
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;

export const WIZARD_STEPS = [
  { id: "details", label: "Details" },
  { id: "guest_list", label: "Guest List" },
  { id: "invitations", label: "Invitations" },
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
  const pct = Math.round(((index + 1) / WIZARD_STEPS.length) * 100);
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">
        Step {index + 1}: {WIZARD_STEPS[index]?.label}
      </h2>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground shrink-0">
          {pct}% Complete
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          const reachable =
            step.id === "details" ||
            (Boolean(eventId) && i <= index + 1);
          return (
            <button
              key={step.id}
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(step.id)}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : reachable
                      ? "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
                      : "bg-slate-100 dark:bg-slate-800 text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              {done && <CheckCircle2 className="size-3.5" />}
              {step.label}
              {i < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="size-3.5 opacity-70" />
              )}
            </button>
          );
        })}
      </div>
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
  const [sendResults, setSendResults] = useState<{ email: string; ok: boolean; message?: string }[]>([]);
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
      <div className="w-full max-w-6xl mx-auto py-8">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  const activeStep: WizardStepId =
    step !== "details" && !eventId ? "details" : step;
  const savingDetails = isCreating || isUpdating;
  const typeLabel =
    EVENT_TYPES.find((t) => t.value === form.event_type)?.label ||
    form.event_type ||
    "—";

  return (
    <div className="w-full max-w-6xl mx-auto">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link
          href="/events/discover?mine=1"
          className="hover:text-foreground transition-colors"
        >
          Events
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">Create New Event</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Event</h1>
      <p className="text-muted-foreground mb-8">
        Create the event, add guests, send invitations, then review.
      </p>

      <WizardProgress
        current={activeStep}
        eventId={eventId}
        onSelect={handleStepChipClick}
      />

      {activeStep === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-10">
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Event Details
              </h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                required
                placeholder="e.g. Annual Tech Conference 2024"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={form.event_type || undefined}
                onValueChange={(v) => setForm((prev) => ({ ...prev, event_type: v }))}
              >
                <SelectTrigger
                  id="event_type"
                  className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
                >
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Venue Name</Label>
              <Input
                id="location"
                placeholder="e.g. Grand Plaza Hotel"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="event_date">Date *</Label>
                <DatePicker
                  value={form.event_date}
                  onChange={(event_date) => setForm((prev) => ({ ...prev, event_date }))}
                  placeholder="Pick event date"
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <TimePicker
                  value={form.start_time}
                  onChange={(start_time) => setForm((prev) => ({ ...prev, start_time }))}
                  placeholder="Start time"
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <TimePicker
                value={form.end_time}
                onChange={(end_time) => setForm((prev) => ({ ...prev, end_time }))}
                placeholder="End time"
                className="rounded-xl border-slate-200 dark:border-slate-600"
              />
            </div>
            <BannerUpload
              value={form.banner_url}
              onChange={(url) => setForm((prev) => ({ ...prev, banner_url: url }))}
              disabled={savingDetails}
            />
            <div className="space-y-2 pt-6 border-t border-slate-200/80 dark:border-slate-700/80">
              <Label>Choose location on map</Label>
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
            <div className="space-y-2">
              <Label htmlFor="message">Message / Description</Label>
              <textarea
                id="message"
                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                placeholder="Optional description"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(visibility) =>
                    setForm((prev) => ({ ...prev, visibility }))
                  }
                >
                  <SelectTrigger
                    id="visibility"
                    className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
                  >
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
              </div>
            </div>
          </section>

          {detailsError && (
            <p className="text-destructive text-sm">{detailsError}</p>
          )}

          <div className="flex flex-wrap gap-4">
            <Button type="button" variant="outline" asChild className="rounded-xl">
              <Link href="/events/discover?mine=1">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={savingDetails}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              {savingDetails ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  {eventId ? "Save & Continue" : "Create & Continue"}
                  <ChevronRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 p-4 flex gap-3 items-start">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="size-4 text-primary" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                A strong banner helps guests recognize your event at a glance.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 p-4 flex gap-3 items-start">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                <Lock className="size-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                Private events stay off the public Events list until you invite people.
              </p>
            </div>
          </div>
        </form>
      )}

      {activeStep === "guest_list" && eventId && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Build your guest list</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add emails now. You will send invitations on the next step.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="guest-email">Guest email</Label>
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
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addPendingEmail}
                  className="rounded-xl h-10 px-5"
                >
                  <UserPlus className="size-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            {guestError && <p className="text-destructive text-sm">{guestError}</p>}

            {pendingEmails.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ready to invite ({pendingEmails.length})</p>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {pendingEmails.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-white/80 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
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
              <div className="space-y-2">
                <p className="text-sm font-medium">Already invited ({invites.length})</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {invites.map((inv) => (
                    <li key={inv.id}>{inv.email}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => goToStep("details")}
            >
              <ChevronLeft className="size-4 mr-1" />
              Back
            </Button>
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
              className="rounded-xl bg-primary text-primary-foreground"
              onClick={() => goToStep("invitations")}
            >
              Continue
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {activeStep === "invitations" && eventId && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Send invitations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This notifies each pending guest. You can skip if you prefer to invite later from the event page.
              </p>
            </div>

            {pendingEmails.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending emails.{" "}
                {invites.length > 0
                  ? `${invites.length} guest${invites.length === 1 ? "" : "s"} already invited.`
                  : "Add guests on the previous step, or continue to review."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {pendingEmails.map((email) => {
                  const result = sendResults.find((r) => r.email === email);
                  return (
                    <li key={email} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                      <span>{email}</span>
                      {result && !result.ok && (
                        <span className="text-destructive text-xs">{result.message}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {inviteSendError && (
              <p className="text-destructive text-sm">{inviteSendError}</p>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => goToStep("guest_list")}
              disabled={isSendingInvites}
            >
              <ChevronLeft className="size-4 mr-1" />
              Back
            </Button>
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
              className="rounded-xl bg-primary text-primary-foreground"
              onClick={handleSendInvitations}
              disabled={isSendingInvites}
            >
              {isSendingInvites ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Sending...
                </>
              ) : pendingEmails.length > 0 ? (
                <>
                  Send {pendingEmails.length} invitation
                  {pendingEmails.length === 1 ? "" : "s"}
                  <ChevronRight className="size-4 ml-1" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {activeStep === "review" && eventId && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Review</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Confirm everything looks right, then open your event.
              </p>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium mt-0.5">{form.name || event?.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium mt-0.5">{typeLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium mt-0.5">{form.event_date || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Time</dt>
                <dd className="font-medium mt-0.5">
                  {(form.start_time || "").slice(0, 5)} – {(form.end_time || "").slice(0, 5)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Venue</dt>
                <dd className="font-medium mt-0.5">{form.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Visibility</dt>
                <dd className="font-medium mt-0.5 capitalize">{form.visibility}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Guests invited</dt>
                <dd className="font-medium mt-0.5">
                  {invites.length}
                  {pendingEmails.length > 0 && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      ({pendingEmails.length} still pending send)
                    </span>
                  )}
                </dd>
              </div>
              {form.message ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="font-medium mt-0.5 whitespace-pre-wrap">{form.message}</dd>
                </div>
              ) : null}
            </dl>
            {invites.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium mb-2">Guest emails</p>
                <ul className="text-sm text-muted-foreground columns-1 sm:columns-2 gap-4">
                  {invites.map((inv) => (
                    <li key={inv.id} className="break-inside-avoid py-0.5">
                      {inv.email} · {inv.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => goToStep("invitations")}
            >
              <ChevronLeft className="size-4 mr-1" />
              Back
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary text-primary-foreground"
              onClick={() => router.push(`/events/${eventId}`)}
            >
              Finish & open event
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
