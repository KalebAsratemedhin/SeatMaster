"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  useGetEventQuery,
  useUpdateEventMutation,
} from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BannerUpload } from "@/components/events/banner-upload";
import { ArrowLeft } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";

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
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: event, isLoading } = useGetEventQuery(id, {
    skip: !id || isNaN(id) || !token,
  });
  const [updateEvent, { isLoading: isSaving, isSuccess, error }] =
    useUpdateEventMutation();

  const [form, setForm] = useState({
    name: "",
    banner_url: "",
    visibility: "public",
    event_type: "other",
    message: "",
    event_date: "",
    start_time: "09:00:00",
    end_time: "17:00:00",
    location: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    if (!token) router.replace("/auth?mode=signin");
  }, [token, router]);

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        banner_url: event.banner_url || "",
        visibility: event.visibility,
        event_type: event.event_type,
        message: event.message || "",
        event_date: event.event_date,
        start_time: event.start_time || "09:00:00",
        end_time: event.end_time || "17:00:00",
        location: event.location || "",
        latitude: event.latitude ?? 0,
        longitude: event.longitude ?? 0,
      });
    }
  }, [event]);

  useEffect(() => {
    if (isSuccess) router.push(`/events/${id}`);
  }, [isSuccess, router, id]);

  const isOwner = user && event && event.owner_id === user.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    updateEvent({
      id: event.id,
      name: form.name,
      banner_url: form.banner_url || "",
      visibility: form.visibility,
      event_type: form.event_type,
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
  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22]">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!isOwner) {
    router.replace(`/events/${id}`);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/events" className="hover:text-foreground transition-colors">
            Events
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/events/${id}`} className="hover:text-foreground transition-colors truncate max-w-[180px] inline-block align-bottom">
            {event.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Edit</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Event</h1>
        <p className="text-muted-foreground mb-8">Update the details for {event.name}.</p>

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
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={form.event_type}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, event_type: v }))
                  }
                >
                  <SelectTrigger
                    id="event_type"
                    className="rounded-xl border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <SelectValue placeholder="Event type" />
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
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, visibility: v }))
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
              <div className="space-y-2">
                <Label>Choose location on map</Label>
                <p className="text-sm text-muted-foreground">
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
                  height="280px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_date">Date *</Label>
                <DatePicker
                  value={form.event_date}
                  onChange={(event_date) =>
                    setForm((prev) => ({ ...prev, event_date }))
                  }
                  placeholder="Pick event date"
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <TimePicker
                    value={form.start_time}
                    onChange={(start_time) =>
                      setForm((prev) => ({ ...prev, start_time }))
                    }
                    placeholder="Start time"
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <TimePicker
                    value={form.end_time}
                    onChange={(end_time) =>
                      setForm((prev) => ({ ...prev, end_time }))
                    }
                    placeholder="End time"
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  />
                </div>
              </div>
              <BannerUpload
                value={form.banner_url}
                onChange={(url) =>
                  setForm((prev) => ({ ...prev, banner_url: url }))
                }
                disabled={isSaving}
              />
              <div className="space-y-2">
                <Label htmlFor="message">Message / Description</Label>
                <textarea
                  id="message"
                  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-0"
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
          </section>

          {error && (
            <p className="text-destructive text-sm mb-4">
              {"data" in error &&
              typeof (error as { data?: { error?: string } }).data?.error ===
                "string"
                ? (error as { data: { error: string } }).data.error
                : "Failed to update event"}
            </p>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#059669] hover:bg-[#047857] rounded-xl"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" asChild className="rounded-xl">
              <Link href={`/events/${id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
