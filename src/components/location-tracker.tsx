"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff, Loader2 } from "lucide-react";

type TrackingState = "acquiring" | "active" | "error" | "unsupported";

const SEND_INTERVAL_MS = 10_000; // send at most once every 10 s

export function LocationTracker() {
  const [state, setState] = useState<TrackingState>("acquiring");
  const lastSentRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState("unsupported");
      return;
    }

    async function sendLocation(position: GeolocationPosition) {
      const now = Date.now();
      if (now - lastSentRef.current < SEND_INTERVAL_MS) return;
      lastSentRef.current = now;

      const { latitude: lat, longitude: lng, heading, speed } = position.coords;
      try {
        await fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, heading, speed }),
        });
        setState("active");
      } catch {
        // network blip — keep trying, don't change state
      }
    }

    function onError() {
      setState("error");
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      onError,
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Don't render if GPS isn't supported
  if (state === "unsupported") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white border shadow-md rounded-full px-3 py-1.5 text-xs font-medium select-none">
      {state === "acquiring" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />
          <span className="text-muted-foreground">Getting location…</span>
        </>
      )}
      {state === "active" && (
        <>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-green-700">Tracking active</span>
        </>
      )}
      {state === "error" && (
        <>
          <WifiOff className="h-3 w-3 text-red-500 shrink-0" />
          <span className="text-red-600">Location unavailable</span>
        </>
      )}
    </div>
  );
}
