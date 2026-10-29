"use client";

import "@/components/map/leaflet-defaults";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const DEFAULT_ZOOM = 14;

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  location?: string;
  height?: string;
};

function WheelZoomOnFocus() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const el = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    el.addEventListener("mousedown", enable);
    el.addEventListener("mouseleave", disable);
    el.tabIndex = 0;
    return () => {
      el.removeEventListener("mousedown", enable);
      el.removeEventListener("mouseleave", disable);
    };
  }, [map]);
  return null;
}

export function EventLocationMap({
  latitude,
  longitude,
  location,
  height = "280px",
}: EventLocationMapProps) {
  const position: L.LatLngTuple = [latitude, longitude];

  return (
    <div
      className="rounded-lg overflow-hidden border border-input isolate"
      style={{ height, width: "100%" }}
    >
      <MapContainer
        center={position}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {location && (
            <Popup>
              <span className="font-medium">{location}</span>
            </Popup>
          )}
        </Marker>
        <WheelZoomOnFocus />
      </MapContainer>
    </div>
  );
}
