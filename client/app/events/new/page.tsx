"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useCreateEventMutation } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

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

export default function NewEventPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [createEvent, { isLoading, isSuccess, error }] = useCreateEventMutation();

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
    createEvent({
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Events
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Create New Event
        </h1>
        <p className="text-muted-foreground mb-8">
          Fill in the details to start organizing your event.
        </p>

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
                  placeholder="e.g. Annual Tech Conference 2024"
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
                  placeholder="e.g. Grand Plaza Hotel"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
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
                  placeholder="https://..."
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
                  placeholder="Optional description"
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
              {"data" in error && typeof (error as { data?: { error?: string } }).data?.error === "string"
                ? (error as { data: { error: string } }).data.error
                : "Failed to create event"}
            </p>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#044b36] hover:bg-[#065f46]"
            >
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/events">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
