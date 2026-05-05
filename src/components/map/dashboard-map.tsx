"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface DashboardStop {
  lat: number;
  lng: number;
  type: "PICKUP" | "DROPOFF";
  routeName: string;
  label: string;
  address: string;
  estimatedTime?: string | null;
  routeColor: string;
}

interface DashboardMapProps {
  stops: DashboardStop[];
  className?: string;
}

const ROUTE_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

export function DashboardMap({ stops, className = "" }: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const validStops = stops.filter((s) => s.lat !== 0 && s.lng !== 0);
    const centerLng = validStops.length
      ? validStops.reduce((s, p) => s + p.lng, 0) / validStops.length
      : -121.8863;
    const centerLat = validStops.length
      ? validStops.reduce((s, p) => s + p.lat, 0) / validStops.length
      : 37.3382;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [centerLng, centerLat],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      validStops.forEach((stop) => {
        const isPickup = stop.type === "PICKUP";
        const color = stop.routeColor;

        const el = document.createElement("div");
        el.style.cssText = `
          width: ${isPickup ? "28px" : "22px"};
          height: ${isPickup ? "28px" : "22px"};
          background: ${color};
          border: 2.5px solid white;
          border-radius: ${isPickup ? "8px" : "50%"};
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        `;

        // School icon (square) vs home icon (circle)
        const iconSvg = isPickup
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`;
        el.innerHTML = iconSvg;

        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false })
          .setHTML(`
            <div style="font-family:system-ui;min-width:150px">
              <div style="font-size:10px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
                ${stop.routeName} · ${stop.type}
              </div>
              <div style="font-weight:600;font-size:13px">${stop.label}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:1px">${stop.address}</div>
              ${stop.estimatedTime ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">ETA ${stop.estimatedTime}</div>` : ""}
            </div>
          `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (validStops.length >= 2) {
        const bounds = validStops.reduce(
          (b, s) => b.extend([s.lng, s.lat]),
          new mapboxgl.LngLatBounds(
            [validStops[0].lng, validStops[0].lat],
            [validStops[0].lng, validStops[0].lat]
          )
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }

      setReady(true);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border ${className}`}
      style={{ height: "360px" }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <div className="text-sm text-muted-foreground animate-pulse">Loading map…</div>
        </div>
      )}
    </div>
  );
}

export { ROUTE_COLORS };
