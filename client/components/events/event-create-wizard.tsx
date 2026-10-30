"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  useGetEventQuery,
  useGetEventInvitesQuery,
  useGetInvitationCardQuery,
  useBulkInviteToEventMutation,
} from "@/lib/api/eventsApi";
import type { EventResponse } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { getInitialsFromEmail } from "@/lib/user-display";
import { formatEventDate, formatEventTimeRange } from "@/lib/eventDateTime";
import {
  mergeGuestEmails,
  parseEmailsFromSpreadsheet,
  splitEmailCandidates,
} from "@/lib/parseGuestEmails";
import { GuestAttendeeRecommendations } from "@/components/events/guest-attendee-recommendations";
import { InviteDeliveryIssues } from "@/components/events/invite-delivery-issues";
import { rememberInviteJob } from "@/lib/inviteJobStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileSpreadsheet,
  ImageIcon,
  UserPlus,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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
  { id: "invitation_card", label: "Card" },
  { id: "invitations", label: "Invite" },
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

function normalizeWizardStep(value: string | null): WizardStepId | null {
  if (value === "review") return "invitation_card"; // legacy step id
  if (WIZARD_STEPS.some((s) => s.id === value)) return value as WizardStepId;
  return null;
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
  allowAllSteps,
  onSelect,
}: {
  current: WizardStepId;
  eventId: string | null;
  allowAllSteps?: boolean;
  onSelect: (step: WizardStepId) => void;
}) {
  const index = stepIndex(current);
  return (
    <nav aria-label="Event setup steps" className="mb-10">
      <ol className="flex items-center gap-1 sm:gap-2">
        {WIZARD_STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          const reachable =
            step.id === "details" ||
            (Boolean(eventId) && (allowAllSteps || i <= index + 1));
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

export type EventCreateWizardProps = {
  /** Edit route: reuse the same multi-step shell for an existing event. */
  mode?: "create" | "edit";
  /** Required when mode is "edit". */
  eventId?: string;
};

export function EventCreateWizard({
  mode = "create",
  eventId: eventIdFromProps,
}: EventCreateWizardProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const isEdit = mode === "edit";

  const eventIdParam = isEdit ? eventIdFromProps ?? null : searchParams.get("eventId");
  const stepParam = searchParams.get("step");

  const [eventId, setEventId] = useState<string | null>(eventIdParam);
  const [step, setStep] = useState<WizardStepId>(() => {
    if (eventIdParam) {
      const normalized = normalizeWizardStep(stepParam);
      if (normalized) return normalized;
    }
    return "details";
  });
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [formHydratedFor, setFormHydratedFor] = useState<string | null>(null);
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [guestDraft, setGuestDraft] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [inviteSendError, setInviteSendError] = useState<string | null>(null);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [jobRefreshKey, setJobRefreshKey] = useState(0);

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [bulkInvite] = useBulkInviteToEventMutation();
  const guestFileRef = useRef<HTMLInputElement | null>(null);
  const [importingGuests, setImportingGuests] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  const { data: event, isLoading: eventLoading } = useGetEventQuery(eventId ?? "", {
    skip: !eventId || !token,
  });
  const { data: invitesData, refetch: refetchInvites } = useGetEventInvitesQuery(
    { eventId: eventId ?? "", limit: 500, offset: 0 },
    { skip: !eventId || !token }
  );

  const invites = invitesData?.items ?? [];
  const invitedByEmail = useMemo(() => {
    const m = new Map<string, string>();
    for (const inv of invites) {
      m.set(normalizeEmail(inv.email), inv.status);
    }
    return m;
  }, [invites]);
  const invitedEmails = useMemo(() => new Set(invitedByEmail.keys()), [invitedByEmail]);

  useEffect(() => {
    if (!token) router.replace("/auth?mode=signin");
  }, [token, router]);

  useEffect(() => {
    if (!eventIdParam) return;
    setEventId(eventIdParam);
    const normalized = normalizeWizardStep(stepParam);
    if (normalized) setStep(normalized);
  }, [eventIdParam, stepParam]);

  const { data: invitationCard } = useGetInvitationCardQuery(eventId ?? "", {
    skip: !eventId || !token || step !== "invitation_card",
  });

  useEffect(() => {
    if (!event || !eventId || formHydratedFor === eventId) return;
    setForm(formFromEvent(event));
    setFormHydratedFor(eventId);
  }, [event, eventId, formHydratedFor]);

  const eventHomeHref = eventId ? `/events/${eventId}` : "/events/discover?mine=1";

  const syncUrl = (nextEventId: string | null, nextStep: WizardStepId) => {
    const params = new URLSearchParams();
    if (isEdit) {
      if (nextStep !== "details") params.set("step", nextStep);
    } else {
      if (nextEventId) params.set("eventId", nextEventId);
      if (nextEventId || nextStep !== "details") params.set("step", nextStep);
    }
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
    if (!isEdit) {
      const targetIdx = stepIndex(target);
      const currentIdx = stepIndex(step);
      if (targetIdx > currentIdx + 1) return;
    }
    goToStep(target);
  };

  const wizardReturnTo = (nextStep: WizardStepId) => {
    if (isEdit && eventId) {
      const qs = nextStep === "details" ? "" : `?step=${nextStep}`;
      return `/events/${eventId}/edit${qs}`;
    }
    if (!eventId) return "/events/new";
    return `/events/new?eventId=${eventId}&step=${nextStep}`;
  };

  const persistDetails = async (after: "continue" | "close") => {
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
    if (!payload.message.trim()) {
      setDetailsError("Description is required.");
      return;
    }
    try {
      if (eventId) {
        await updateEvent({ id: eventId, ...payload }).unwrap();
        if (after === "close") {
          toast.success("Event saved");
          router.push(`/events/${eventId}`);
          return;
        }
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

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistDetails("continue");
  };

  const addPendingEmails = (candidates: string[]) => {
    setGuestError(null);
    const { added, skippedInvalid, skippedDuplicate } = mergeGuestEmails(
      pendingEmails,
      candidates,
      invitedEmails
    );
    if (added.length === 0) {
      if (skippedInvalid > 0 && skippedDuplicate === 0) {
        setGuestError("No valid email addresses found.");
      } else if (skippedDuplicate > 0) {
        setGuestError("Those emails are already on the list or invited.");
      }
      return false;
    }
    setPendingEmails((prev) => [...prev, ...added]);
    const notes: string[] = [`Added ${added.length}`];
    if (skippedInvalid) notes.push(`${skippedInvalid} invalid skipped`);
    if (skippedDuplicate) notes.push(`${skippedDuplicate} duplicates skipped`);
    toast.success(notes.join(" · "));
    return true;
  };

  const addPendingFromDraft = () => {
    const candidates = splitEmailCandidates(guestDraft);
    if (candidates.length === 0) {
      setGuestError("No valid email addresses found.");
      return;
    }
    if (addPendingEmails(candidates)) {
      setGuestDraft("");
      setPasteOpen(false);
    }
  };

  const removePendingEmail = (email: string) => {
    setPendingEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleGuestFileImport = async (file: File | undefined) => {
    if (!file) return;
    setImportingGuests(true);
    setGuestError(null);
    try {
      const emails = await parseEmailsFromSpreadsheet(file);
      addPendingEmails(emails);
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : "Could not read spreadsheet");
    } finally {
      setImportingGuests(false);
    }
  };

  const handleSendInvitations = async () => {
    if (!eventId || pendingEmails.length === 0) {
      router.push(`/events/${eventId}`);
      return;
    }
    const toSend = [...pendingEmails];
    setInviteSendError(null);
    setIsSendingInvites(true);
    try {
      // Backend processes invites asynchronously — queue and continue; don't block the UI.
      const queued = await bulkInvite({ eventId, emails: toSend }).unwrap();
      rememberInviteJob(eventId, queued.job_id);
      setJobRefreshKey((k) => k + 1);
      setPendingEmails([]);
      toast.success(
        `Queued ${queued.queued} invitation${queued.queued === 1 ? "" : "s"} — they'll send in the background.`
      );
      void refetchInvites();
      router.push(`/events/${eventId}`);
    } catch (err) {
      setInviteSendError(apiErrorMessage(err, "Failed to queue invitations"));
    } finally {
      setIsSendingInvites(false);
    }
  };

  if (!token) return null;

  if (eventId && eventLoading && !event) {
    return (
      <div className="mx-auto w-full max-w-6xl py-12">
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
    <div className="mx-auto w-full max-w-6xl pb-12">
      <Link
        href={isEdit ? eventHomeHref : "/events/discover?mine=1"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        {isEdit ? "Back to event" : "Events"}
      </Link>

      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
          {isEdit ? "Edit" : "Create"} · Step {stepIndex(activeStep) + 1} of{" "}
          {WIZARD_STEPS.length}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          {isEdit ? "Edit event" : eventId ? "Continue setup" : "Create event"}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {activeStep === "details" &&
            (isEdit
              ? "Update the basics, time, and place."
              : "Name it, set the time and place, then continue.")}
          {activeStep === "guest_list" && "Build your guest list — import, search, or paste emails."}
          {activeStep === "invitation_card" &&
            "Design the card guests see first — or upload a finished design."}
          {activeStep === "invitations" &&
            "Queue invites when you’re ready — sending continues in the background."}
        </p>
      </header>

      <WizardProgress
        current={activeStep}
        eventId={eventId}
        allowAllSteps={isEdit}
        onSelect={handleStepChipClick}
      />

      {activeStep === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
            <div className="space-y-8">
              <section className="space-y-5">
                <h2 className="font-display text-lg font-semibold text-foreground">Basics</h2>
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
                <Field label="Description *" htmlFor="message">
                  <textarea
                    id="message"
                    required
                    className={`flex min-h-[96px] w-full border px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 ${fieldClass}`}
                    placeholder="A short note for your guests"
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  />
                </Field>
              </section>

              <section className="space-y-5 border-t border-border pt-8">
                <h2 className="font-display text-lg font-semibold text-foreground">When</h2>
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

              <section className="space-y-5 border-t border-border pt-8">
                <h2 className="font-display text-lg font-semibold text-foreground">Venue</h2>
                <Field label="Venue name" htmlFor="location" hint="Optional">
                  <Input
                    id="location"
                    placeholder="Venue or neighborhood"
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className={fieldClass}
                  />
                </Field>
              </section>
            </div>

            <section className="space-y-3 lg:sticky lg:top-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Map</h2>
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
                height="min(420px, 55vh)"
              />
              <p className="text-xs text-muted-foreground">
                Search or tap the map to set the pin.
              </p>
            </section>
          </div>

          {detailsError && <p className="text-sm text-destructive">{detailsError}</p>}

          <FooterActions>
            <Button type="button" variant="ghost" asChild className="rounded-xl">
              <Link href={isEdit ? eventHomeHref : "/events/discover?mine=1"}>Cancel</Link>
            </Button>
            <div className="flex-1" />
            {isEdit ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={savingDetails}
                onClick={() => void persistDetails("close")}
              >
                {savingDetails ? "Saving…" : "Save & close"}
              </Button>
            ) : null}
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
                  {isEdit ? "Save & continue" : "Continue"}
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="h-10 rounded-xl px-5"
                onClick={() => {
                  setGuestError(null);
                  setPasteOpen(true);
                }}
              >
                <UserPlus className="mr-2 size-4" />
                Add emails
              </Button>
              <input
                ref={guestFileRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  void handleGuestFileImport(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl px-5"
                disabled={importingGuests}
                onClick={() => guestFileRef.current?.click()}
              >
                {importingGuests ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 size-4" />
                )}
                Import Excel/CSV
              </Button>
            </div>
            {guestError && !pasteOpen && (
              <p className="text-sm text-destructive">{guestError}</p>
            )}

            <Dialog
              open={pasteOpen}
              onOpenChange={(open) => {
                setPasteOpen(open);
                if (!open) {
                  setGuestDraft("");
                  setGuestError(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add guest emails</DialogTitle>
                  <DialogDescription>
                    Paste many at once — comma, space, or new line.
                  </DialogDescription>
                </DialogHeader>
                <textarea
                  id="guest-email"
                  rows={6}
                  autoFocus
                  placeholder={"guest@example.com\nfriend@example.com, plus@example.com"}
                  value={guestDraft}
                  onChange={(e) => {
                    setGuestDraft(e.target.value);
                    setGuestError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      addPendingFromDraft();
                    }
                  }}
                  className={`flex min-h-[140px] w-full border px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 ${fieldClass}`}
                />
                {guestError && <p className="text-sm text-destructive">{guestError}</p>}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => setPasteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl"
                    disabled={!guestDraft.trim()}
                    onClick={addPendingFromDraft}
                  >
                    <UserPlus className="mr-2 size-4" />
                    Add to queue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <InviteDeliveryIssues eventId={eventId} refreshKey={jobRefreshKey} />

            <GuestAttendeeRecommendations
              excludeEventId={eventId}
              alreadyQueued={new Set(pendingEmails.map(normalizeEmail))}
              invitedByEmail={invitedByEmail}
              onAddEmails={addPendingEmails}
            />

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
              onClick={() => goToStep("invitation_card")}
            >
              Skip
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => goToStep("invitation_card")}
            >
              Continue
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </FooterActions>
        </div>
      )}

      {activeStep === "invitation_card" && eventId && (
        <div className="space-y-8">
          <section className="overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              {form.name || event?.name || "Your event"}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Invitation card
            </h2>
            <p className="mt-3 max-w-xl text-sm text-primary-foreground/75">
              {formatEventDate(form.event_date)} ·{" "}
              {formatEventTimeRange(form.start_time, form.end_time)}
              {form.location ? ` · ${form.location}` : ""}
            </p>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Design in studio</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Templates, text, stickers, and full artboard controls.
                </p>
              </div>
              <Button
                type="button"
                className="mt-auto rounded-xl"
                onClick={() =>
                  router.push(
                    `/events/${eventId}/invitation-card?returnTo=${encodeURIComponent(
                      wizardReturnTo("invitation_card")
                    )}`
                  )
                }
              >
                Open invitation studio
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ImageIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Use an existing design
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a finished card image — it becomes the full invitation artboard.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-auto rounded-xl"
                onClick={() =>
                  router.push(
                    `/events/${eventId}/invitation-card?mode=photo-card&returnTo=${encodeURIComponent(
                      wizardReturnTo("invitation_card")
                    )}`
                  )
                }
              >
                Upload card image
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>

          {invitationCard?.preview_url ? (
            <div className="overflow-hidden rounded-2xl bg-muted/40 p-4 ring-1 ring-border">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current card preview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invitationCard.preview_url}
                alt="Invitation preview"
                className="mx-auto max-h-72 w-auto rounded-lg object-contain shadow-md"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No card saved yet — guests will see a starter template until you design or upload one.
              You can skip and finish later from the event page.
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            {invites.length} guest{invites.length === 1 ? "" : "s"} invited
            {pendingEmails.length > 0
              ? ` · ${pendingEmails.length} email${pendingEmails.length === 1 ? "" : "s"} still queued`
              : ""}
            {" · "}
            {typeLabel}
          </p>

          <FooterActions>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => goToStep("guest_list")}
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
              Continue to invite
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
                  ? `${invites.length} guest${invites.length === 1 ? "" : "s"} already invited. You can finish.`
                  : "No emails queued. Go back to Guests to add people, or finish and invite later from the event page."}
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                {pendingEmails.map((email) => (
                  <li key={email} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span>{email}</span>
                  </li>
                ))}
              </ul>
            )}
            {inviteSendError && <p className="text-sm text-destructive">{inviteSendError}</p>}
            <p className="text-xs text-muted-foreground">
              Invites are queued on the server and emailed in the background — you won&apos;t wait here
              for each message to send.
            </p>
          </section>

          <FooterActions>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => goToStep("invitation_card")}
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
              onClick={() => router.push(`/events/${eventId}`)}
              disabled={isSendingInvites}
            >
              Skip · Open event
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
                  Queuing…
                </>
              ) : pendingEmails.length > 0 ? (
                <>
                  Queue {pendingEmails.length} invite{pendingEmails.length === 1 ? "" : "s"}
                  <ChevronRight className="ml-1 size-4" />
                </>
              ) : (
                <>
                  Finish · Open event
                  <ChevronRight className="ml-1 size-4" />
                </>
              )}
            </Button>
          </FooterActions>
        </div>
      )}

      {/* Keep step label available for a11y/context even if unused visually beyond header */}
      <span className="sr-only">{stepMeta?.label}</span>
    </div>
  );
}
