"use client";

import "@/components/map/leaflet-defaults";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

/** Addis Ababa, Ethiopia */
const DEFAULT_CENTER: L.LatLngTuple = [9.03, 38.74];
const DEFAULT_ZOOM = 12;
const FOCUSED_ZOOM = 15;

type PlaceResult = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type LocationPickerMapProps = {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, label?: string) => void;
  height?: string;
};

function LocationClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToTarget({ target }: { target: L.LatLngTuple | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, Math.max(map.getZoom(), FOCUSED_ZOOM), { duration: 0.6 });
  }, [target, map]);
  return null;
}

function WheelZoomOnFocus() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const el = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    el.addEventListener("focusin", enable);
    el.addEventListener("mousedown", enable);
    el.addEventListener("mouseleave", disable);
    el.tabIndex = 0;
    return () => {
      el.removeEventListener("focusin", enable);
      el.removeEventListener("mousedown", enable);
      el.removeEventListener("mouseleave", disable);
    };
  }, [map]);
  return null;
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    locality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function formatPhotonLabel(p: PhotonFeature["properties"]): string {
  const parts = [
    [p.name, p.housenumber].filter(Boolean).join(" "),
    p.street,
    p.district,
    p.locality || p.city,
    p.county,
    p.state,
    p.country,
  ].filter((x) => x && String(x).trim());
  // unique while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = String(part).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(String(part));
  }
  return unique.join(", ") || "Unknown place";
}

/** Photon (Komoot) — stronger free-text / keyword matching than Nominatim alone. */
async function searchPhoton(
  query: string,
  near: L.LatLngTuple
): Promise<PlaceResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("lat", String(near[0]));
  url.searchParams.set("lon", String(near[1]));
  url.searchParams.set("limit", "15");
  url.searchParams.set("lang", "en");
  // Soft location bias (does not exclude other countries)
  url.searchParams.set("location_bias_scale", "0.5");
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const out: PlaceResult[] = [];
  for (const f of data.features ?? []) {
    const [lng, lat] = f.geometry.coordinates;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const id = `${f.properties.osm_type ?? "p"}-${f.properties.osm_id ?? `${lat},${lng}`}`;
    out.push({ id, label: formatPhotonLabel(f.properties), lat, lng });
  }
  return out;
}

/** Nominatim fallback + Ethiopia-biased pass, merged/deduped. */
async function searchNominatim(
  query: string,
  near: L.LatLngTuple
): Promise<PlaceResult[]> {
  const run = async (extra: Record<string, string>) => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "10");
    // Prefer Ethiopia / Addis area without hard-bounding
    url.searchParams.set(
      "viewbox",
      `${near[1] - 1.5},${near[0] + 1.2},${near[1] + 1.5},${near[0] - 1.2}`
    );
    url.searchParams.set("bounded", "0");
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) return [] as PlaceResult[];
    const rows = (await res.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;
    return rows
      .map((r) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return {
          id: `n-${r.place_id}`,
          label: r.display_name,
          lat,
          lng,
        } satisfies PlaceResult;
      })
      .filter((x): x is PlaceResult => x != null);
  };

  const [biased, wide] = await Promise.all([
    run({ countrycodes: "et" }),
    run({}),
  ]);
  const seen = new Set<string>();
  const merged: PlaceResult[] = [];
  for (const r of [...biased, ...wide]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    merged.push(r);
  }
  return merged.slice(0, 12);
}

async function searchPlaces(
  query: string,
  near: L.LatLngTuple
): Promise<PlaceResult[]> {
  const [photon, nominatim] = await Promise.all([
    searchPhoton(query, near).catch(() => [] as PlaceResult[]),
    searchNominatim(query, near).catch(() => [] as PlaceResult[]),
  ]);
  // Prefer Photon keyword hits, then fill gaps from Nominatim (Ethiopia-biased + wide).
  const seen = new Set<string>();
  const merged: PlaceResult[] = [];
  const keyOf = (r: PlaceResult) =>
    `${r.lat.toFixed(5)},${r.lng.toFixed(5)}|${r.label.toLowerCase()}`;
  for (const r of [...photon, ...nominatim]) {
    const key = keyOf(r);
    if (seen.has(key) || seen.has(r.id)) continue;
    seen.add(key);
    seen.add(r.id);
    merged.push(r);
    if (merged.length >= 15) break;
  }
  return merged;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = "280px",
}: LocationPickerMapProps) {
  const hasPosition = latitude !== 0 || longitude !== 0;
  const position: L.LatLngTuple = useMemo(
    () => (hasPosition ? [latitude, longitude] : DEFAULT_CENTER),
    [hasPosition, latitude, longitude]
  );
  const searchNear = position;

  const [query, setQuery] = useState("");
  const [fetchedResults, setFetchedResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<L.LatLngTuple | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchNearRef = useRef(searchNear);
  searchNearRef.current = searchNear;

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const results = useMemo(
    () => (canSearch ? fetchedResults : []),
    [canSearch, fetchedResults]
  );

  const handler = useCallback(
    (lat: number, lng: number) => {
      setOpen(false);
      onLocationChange(lat, lng);
    },
    [onLocationChange]
  );

  // Re-search only when the query changes — not when the pin moves (that was reopening the dropdown over the map).
  useEffect(() => {
    if (!canSearch) {
      setFetchedResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      searchPlaces(trimmedQuery, searchNearRef.current)
        .then((list) => {
          if (cancelled) return;
          setFetchedResults(list);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setFetchedResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [canSearch, trimmedQuery]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pickResult = (r: PlaceResult) => {
    onLocationChange(r.lat, r.lng, r.label);
    setQuery(r.label);
    setFetchedResults([]);
    setOpen(false);
    setFlyTarget([r.lat, r.lng]);
  };

  return (
    <div className="space-y-2" ref={wrapRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search places (e.g. Bole, Meskel Square)…"
          className="h-9 rounded-xl border-border bg-card pl-9 pr-9 text-foreground !shadow-none focus-visible:ring-1 focus-visible:ring-ring/40"
          autoComplete="off"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
        {open && results.length > 0 && (
          <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-sm">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => pickResult(r)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && canSearch && !searching && results.length === 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-sm">
            No places found. Try a different name or click the map.
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Search (Ethiopia-first, then worldwide) or click the map. Scroll-zoom after clicking the map.
      </p>
      <div
        className="isolate overflow-hidden rounded-2xl border border-border"
        style={{ height, width: "100%" }}
        onMouseDown={() => setOpen(false)}
      >
        <MapContainer
          center={position}
          zoom={hasPosition ? FOCUSED_ZOOM : DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPosition && <Marker position={position} />}
          <LocationClickHandler onLocationChange={handler} />
          <FlyToTarget target={flyTarget} />
          <WheelZoomOnFocus />
        </MapContainer>
      </div>
    </div>
  );
}
