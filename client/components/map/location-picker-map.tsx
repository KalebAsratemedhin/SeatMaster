"use client";

import "@/components/map/leaflet-defaults";
import { useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER: L.LatLngTuple = [40.7128, -74.006];
const DEFAULT_ZOOM = 10;

type LocationPickerMapProps = {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
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

export function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = "280px",
}: LocationPickerMapProps) {
  const hasPosition = latitude !== 0 || longitude !== 0;
  const position: L.LatLngTuple = hasPosition
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  const handler = useCallback(
    (lat: number, lng: number) => onLocationChange(lat, lng),
    [onLocationChange]
  );

  return (
    <div className="rounded-lg overflow-hidden border border-input" style={{ height }}>
      <MapContainer
        center={position}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPosition && <Marker position={position} />}
        <LocationClickHandler onLocationChange={handler} />
      </MapContainer>
    </div>
  );
}
