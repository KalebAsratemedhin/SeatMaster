"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useCreateEventMutation } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BannerUpload } from "@/components/events/banner-upload";
import {
  Lightbulb,
  Lock,
  RefreshCw,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";

const LocationPickerMapDynamic = dynamic(
  () =>
    import("@/components/map/location-picker-map").then((m) => ({
      default: m.LocationPickerMap,
    })),
  { ssr: false }
);

const EVENT_TYPES = [
  { value: "", label: "Select type..." },
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "party", label: "Birthday Party" },
  { value: "workshop", label: "Workshop/Seminar" },
  { value: "other", label: "Other" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const STEPS = [
  { id: "details", label: "Details" },
  { id: "guest_list", label: "Guest List" },
  { id: "invitations", label: "Invitations" },
  { id: "review", label: "Review" },
];

export default function NewEventPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [createEvent, { isLoading, isSuccess, error }] = useCreateEventMutation();

  const [form, setForm] = useState({
    name: "",
    banner_url: "",
    visibility: "public",
    event_type: "",
    message: "",
    event_date: "",
    start_time: "09:00:00",
    end_time: "17:00:00",
    location: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    if (!token) {
      router.replace("/auth?mode=signin");
    }
  }, [token, router]);

  useEffect(() => {
    if (isSuccess) {
      router.push("/events");
    }
  }, [isSuccess, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventType = form.event_type || "other";
    createEvent({
      name: form.name,
      banner_url: form.banner_url || "",
      visibility: form.visibility,
      event_type: eventType,
      message: form.message || "",
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || "",
      latitude: form.latitude,
      longitude: form.longitude,
    });
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/events" className="hover:text-foreground transition-colors">
            Events
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Create New Event</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Create New Event
        </h1>
        <p className="text-muted-foreground mb-8">
          Fill in the details to start organizing your next big moment.
        </p>

        {/* Step indicator */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Step 1: Event Details</h2>
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#059669] rounded-full transition-all"
                style={{ width: "25%" }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              25% Complete
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, i) => (
              <span
                key={step.id}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  i === 0
                    ? "bg-[#059669] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                }`}
              >
                {step.label}
                {i < STEPS.length - 1 && (
                  <ChevronRight className="size-3.5 opacity-70" />
                )}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <select
                  id="event_type"
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-0"
                  value={form.event_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      event_type: e.target.value,
                    }))
                  }
                >
                  {EVENT_TYPES.map((opt) => (
                    <option key={opt.value || "placeholder"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Venue Name</Label>
                <Input
                  id="location"
                  placeholder="e.g. Grand Plaza Hotel"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="event_date"
                      type="date"
                      required
                      value={form.event_date}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          event_date: e.target.value,
                        }))
                      }
                      className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm pr-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="start_time"
                      type="time"
                      step={1}
                      value={form.start_time.slice(0, 5)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          start_time: e.target.value + ":00",
                        }))
                      }
                      className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm pr-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  step={1}
                  value={form.end_time.slice(0, 5)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      end_time: e.target.value + ":00",
                    }))
                  }
                  className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
                />
              </div>

              <BannerUpload
                value={form.banner_url}
                onChange={(url) =>
                  setForm((prev) => ({ ...prev, banner_url: url }))
                }
                disabled={isLoading}
              />

              {/* Additional details */}
              <div className="space-y-2 pt-6 border-t border-slate-200/80 dark:border-slate-700/80">
                <Label>Choose location on map</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Click on the map to set the event coordinates.
                </p>
                <LocationPickerMapDynamic
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onLocationChange={(lat, lng) =>
                    setForm((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                    }))
                  }
                  height="240px"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message / Description</Label>
                <textarea
                  id="message"
                  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-0"
                  placeholder="Optional description"
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-0"
                    value={form.visibility}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        visibility: e.target.value,
                      }))
                    }
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
          </section>

          {error && (
            <p className="text-destructive text-sm mb-4">
              {"data" in error &&
              typeof (error as { data?: { error?: string } }).data?.error ===
                "string"
                ? (error as { data: { error: string } }).data.error
                : "Failed to create event"}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mb-10">
            <Button type="button" variant="outline" asChild className="rounded-xl">
              <Link href="/events">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl"
            >
              {isLoading ? "Creating..." : "Create Event"}
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 p-4 flex gap-3 items-start">
              <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                Using a high-quality banner image increases RSVP rates by 20%.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 p-4 flex gap-3 items-start">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                <Lock className="size-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                Your event details are private until you choose to send invites.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 p-4 flex gap-3 items-start">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                <RefreshCw className="size-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                Progress is automatically saved as you navigate through steps.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
