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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
        <div className="mb-6">
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Event
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Event</h1>
        <p className="text-muted-foreground mb-8">{event.name}</p>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Event Details</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type</Label>
                  <select
                    id="event_type"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.event_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        event_type: e.target.value,
                      }))
                    }
                  >
                    {EVENT_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <div className="space-y-2">
                <Label htmlFor="location">Location / Venue</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
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
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
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
                  />
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
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner_url">Banner Image URL</Label>
                <Input
                  id="banner_url"
                  type="url"
                  value={form.banner_url}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      banner_url: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message / Description</Label>
                <textarea
                  id="message"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

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
              className="bg-[#044b36] hover:bg-[#065f46]"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/events/${id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
