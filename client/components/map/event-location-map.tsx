"use client";

import "@/components/map/leaflet-defaults";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const DEFAULT_ZOOM = 14;

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  location?: string;
  height?: string;
};

export function EventLocationMap({
  latitude,
  longitude,
  location,
  height = "280px",
}: EventLocationMapProps) {
  const position: L.LatLngTuple = [latitude, longitude];

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
        <Marker position={position}>
          {location && (
            <Popup>
              <span className="font-medium">{location}</span>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
