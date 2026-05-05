"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapStop {
  id: string;
  sequence: number;
  type: "PICKUP" | "DROPOFF";
  lat: number;
  lng: number;
  label: string;       // school name or child name
  address: string;
  estimatedTime?: string | null;
  children?: string[]; // child names at this stop
}

interface RouteMapProps {
  stops: MapStop[];
  className?: string;
  height?: string;
}

const PICKUP_COLOR = "#3b82f6";   // blue-500
const DROPOFF_COLOR = "#22c55e";  // green-500
const LINE_COLOR = "#6366f1";     // indigo-500

export function RouteMap({ stops, className = "", height = "400px" }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    // Default center: average of all stops, or Springfield, IL fallback
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
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Draw route line
      if (validStops.length >= 2) {
        const coordinates = validStops
          .sort((a, b) => a.sequence - b.sequence)
          .map((s) => [s.lng, s.lat]);

        map.addSource("route-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates },
            properties: {},
          },
        });

        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": LINE_COLOR,
            "line-width": 3,
            "line-dasharray": [2, 1],
          },
        });
      }

      // Add markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      validStops
        .sort((a, b) => a.sequence - b.sequence)
        .forEach((stop) => {
          const color = stop.type === "PICKUP" ? PICKUP_COLOR : DROPOFF_COLOR;

          // Custom marker element
          const el = document.createElement("div");
          el.className = "flex items-center justify-center";
          el.style.cssText = `
            width: 32px; height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; color: white;
          `;
          el.textContent = String(stop.sequence);

          const childrenHtml = stop.children?.length
            ? `<div style="margin-top:4px;font-size:11px;color:#6b7280">${stop.children.join(", ")}</div>`
            : "";

          const popup = new mapboxgl.Popup({ offset: 20, closeButton: false })
            .setHTML(`
              <div style="font-family:system-ui;padding:2px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="background:${color};color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:9999px">
                    ${stop.type}
                  </span>
                  ${stop.estimatedTime ? `<span style="font-size:11px;color:#6b7280">ETA ${stop.estimatedTime}</span>` : ""}
                </div>
                <div style="font-weight:600;font-size:13px">${stop.label}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:2px">${stop.address}</div>
                ${childrenHtml}
              </div>
            `);

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([stop.lng, stop.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        });

      // Fit map to all stops
      if (validStops.length >= 2) {
        const bounds = validStops.reduce(
          (b, s) => b.extend([s.lng, s.lat]),
          new mapboxgl.LngLatBounds([validStops[0].lng, validStops[0].lat], [validStops[0].lng, validStops[0].lat])
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
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
    <div className={`relative rounded-xl overflow-hidden border ${className}`} style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <div className="text-sm text-muted-foreground animate-pulse">Loading map…</div>
        </div>
      )}
      {/* Legend */}
      {ready && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: PICKUP_COLOR }} />
            Pickup
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: DROPOFF_COLOR }} />
            Drop-off
          </span>
        </div>
      )}
    </div>
  );
}
