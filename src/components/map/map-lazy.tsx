"use client";

/**
 * Lazy-loaded map wrappers with ssr:false.
 * Import from here in any component so Mapbox GL never runs during SSR.
 */
import dynamic from "next/dynamic";

export type { MapStop } from "./route-map";
export type { DashboardStop } from "./dashboard-map";
export { ROUTE_COLORS } from "./dashboard-map";

export const RouteMap = dynamic(
  () => import("./route-map").then((m) => ({ default: m.RouteMap })),
  { ssr: false }
);

export const DashboardMap = dynamic(
  () => import("./dashboard-map").then((m) => ({ default: m.DashboardMap })),
  { ssr: false }
);
