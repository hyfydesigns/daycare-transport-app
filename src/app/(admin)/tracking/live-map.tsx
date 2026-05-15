"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface DriverPing {
  driverId: string;
  driverName: string;
  routeName: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}

function markerColor(timestamp: string): string {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (ageMs < 2 * 60_000)  return "#22c55e"; // green  — < 2 min
  if (ageMs < 10 * 60_000) return "#f59e0b"; // amber  — < 10 min
  return "#94a3b8";                           // slate  — stale
}

function timeAgo(timestamp: string): string {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(ageMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function LiveMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const [drivers, setDrivers] = useState<DriverPing[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/driver/location");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: DriverPing[] = await res.json();
      setDrivers(data);
      setLastUpdate(new Date());
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }, []);

  // Initialise Leaflet map (client-only, no SSR)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [37.3382, -121.8863],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      fetchDrivers();
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [fetchDrivers]);

  // Update markers whenever driver data changes
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      const currentIds = new Set(drivers.map((d) => d.driverId));

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      // Add/update markers
      drivers.forEach((driver) => {
        const color = markerColor(driver.timestamp);
        const initials = driver.driverName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:44px;height:44px;
            background:${color};
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 3px 12px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            font-size:14px;font-weight:700;color:white;
            font-family:system-ui;
            cursor:pointer;
          ">${initials}</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -26],
        });

        const speedKmh = driver.speed != null ? Math.round(driver.speed * 3.6) : null;

        const popupHtml = `
          <div style="font-family:system-ui;min-width:170px;padding:2px">
            <p style="font-weight:700;font-size:14px;margin:0 0 6px">${driver.driverName}</p>
            ${driver.routeName
              ? `<p style="font-size:12px;color:#4b5563;margin:0 0 3px">🚌 ${driver.routeName}</p>`
              : ""}
            <p style="font-size:11px;color:#9ca3af;margin:0">Updated ${timeAgo(driver.timestamp)}</p>
            ${speedKmh != null
              ? `<p style="font-size:11px;color:#9ca3af;margin:3px 0 0">Speed: ${speedKmh} km/h</p>`
              : ""}
          </div>`;

        if (markersRef.current.has(driver.driverId)) {
          const marker = markersRef.current.get(driver.driverId)!;
          marker.setLatLng([driver.lat, driver.lng]);
          marker.setIcon(icon);
          marker.getPopup()?.setContent(popupHtml);
        } else {
          const marker = L.marker([driver.lat, driver.lng], { icon })
            .addTo(map)
            .bindPopup(popupHtml);
          markersRef.current.set(driver.driverId, marker);
        }
      });

      // Fit map to all driver positions
      if (drivers.length === 1) {
        map.setView([drivers[0].lat, drivers[0].lng], 14);
      } else if (drivers.length > 1) {
        const positions = drivers.map((d) => [d.lat, d.lng] as [number, number]);
        map.fitBounds(positions, { padding: [60, 60], maxZoom: 15 });
      }
    });
  }, [drivers]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchDrivers, 10_000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border">
      <div ref={containerRef} className="w-full h-full" />

      {/* Status panel — top-left */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-md px-4 py-2.5 text-xs space-y-0.5 border">
        <p className="font-semibold text-sm">
          {drivers.length} driver{drivers.length !== 1 ? "s" : ""} online
        </p>
        {lastUpdate && (
          <p className="text-muted-foreground">
            Updated {lastUpdate.toLocaleTimeString()}
          </p>
        )}
        {fetchError && (
          <p className="text-red-500">Connection error — retrying…</p>
        )}
        {drivers.length === 0 && !fetchError && (
          <p className="text-muted-foreground">No active drivers yet</p>
        )}
      </div>

      {/* Legend — bottom-right (above OSM attribution) */}
      <div className="absolute bottom-8 right-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-md px-3 py-2.5 text-xs space-y-1.5 border">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
          Active (&lt; 2 min)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400 shrink-0" />
          Recent (&lt; 10 min)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400 shrink-0" />
          Stale
        </div>
      </div>
    </div>
  );
}
