import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

export const dynamic_config = "force-dynamic";

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

export default function TrackingPage() {
  return (
    <div className="p-4 md:p-6 flex flex-col gap-4" style={{ height: "calc(100dvh - 0px)" }}>
      <div className="shrink-0">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 md:h-6 md:w-6" /> Live Tracking
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Driver locations refresh every 10 seconds. Drivers must be on an active run for their location to appear.
        </p>
      </div>

      {/* Map fills remaining height */}
      <div className="flex-1 min-h-0">
        <LiveMap />
      </div>
    </div>
  );
}
