"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(
  () => import("./live-map").then((m) => ({ default: m.LiveMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm animate-pulse rounded-xl border bg-muted/20">
        Loading map…
      </div>
    ),
  }
);

export function MapClient() {
  return <LiveMap />;
}
