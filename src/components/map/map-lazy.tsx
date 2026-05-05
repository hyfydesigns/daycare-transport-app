/**
 * Lazy-loaded map wrappers with ssr:false.
 * Import from here in server components so Mapbox GL never runs during SSR.
 */
import dynamic from "next/dynamic";
import type { MapStop } from "./route-map";
import type { DashboardStop } from "./dashboard-map";

export type { MapStop, DashboardStop };

export const RouteMap = dynamic(
  () => import("./route-map").then((m) => ({ default: m.RouteMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl border bg-muted animate-pulse"
        style={{ height: "220px" }}
      />
    ),
  }
);

export const DashboardMap = dynamic(
  () => import("./dashboard-map").then((m) => ({ default: m.DashboardMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl border bg-muted animate-pulse"
        style={{ height: "360px" }}
      />
    ),
  }
);

export { ROUTE_COLORS } from "./dashboard-map";
