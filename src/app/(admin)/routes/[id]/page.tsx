import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bus, Users, MapPin, School } from "lucide-react";
import Link from "next/link";
import { RouteStopsManager } from "./route-stops-manager";
import { RouteMap, type MapStop } from "@/components/map/route-map";

export const dynamic = "force-dynamic";

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [route, schools, allChildren] = await Promise.all([
    prisma.route.findUnique({
      where: { id },
      include: {
        driver: { include: { user: true } },
        vehicle: true,
        stops: {
          orderBy: { sequence: "asc" },
          include: { school: true },
        },
        childAssignments: {
          where: { active: true },
          include: { child: { include: { school: true } } },
        },
      },
    }),
    prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.child.findMany({ where: { active: true }, include: { school: true }, orderBy: { fullName: "asc" } }),
  ]);

  if (!route) notFound();

  const isAdmin = session?.user.role === "ADMIN";

  // Build MapStop objects for the map component
  const mapStops: MapStop[] = route.stops.map((stop) => {
    const childIds: string[] = JSON.parse(stop.childrenIds || "[]");
    const childNames = route.childAssignments
      .filter((a) => childIds.includes(a.child.id))
      .map((a) => a.child.fullName);

    return {
      id: stop.id,
      sequence: stop.sequence,
      type: stop.type as "PICKUP" | "DROPOFF",
      lat: stop.lat,
      lng: stop.lng,
      label: stop.school?.name ?? stop.address,
      address: stop.address,
      estimatedTime: stop.estimatedTime,
      children: childNames,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/routes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{route.name}</h1>
          <p className="text-muted-foreground text-sm font-mono">{route.code}</p>
        </div>
        <Badge variant={route.active ? "success" : "secondary"}>{route.active ? "Active" : "Inactive"}</Badge>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Driver</p>
                <p className="font-medium">{route.driver?.user.name ?? "Unassigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Bus className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="font-medium">{route.vehicle?.identifier ?? "Unassigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Children</p>
                <p className="font-medium">{route.childAssignments.length} assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map — full width */}
      {mapStops.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5" /> Route Map
          </h2>
          <RouteMap stops={mapStops} height="420px" />
        </div>
      )}

      {/* Stops list + Children side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stops list */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5" /> Stops ({route.stops.length})
          </h2>
          <div className="space-y-2">
            {route.stops.map((stop, idx) => {
              const childIds: string[] = JSON.parse(stop.childrenIds || "[]");
              const childNames = route.childAssignments
                .filter((a) => childIds.includes(a.child.id))
                .map((a) => a.child.fullName);
              return (
                <div key={stop.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {stop.type === "PICKUP" ? (
                        <School className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 text-green-500" />
                      )}
                      <Badge variant={stop.type === "PICKUP" ? "info" : "success"} className="text-xs">
                        {stop.type}
                      </Badge>
                      {stop.estimatedTime && (
                        <span className="text-xs text-muted-foreground">ETA {stop.estimatedTime}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">
                      {stop.school?.name ?? stop.address}
                    </p>
                    {childNames.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {childNames.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {route.stops.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No stops configured yet.</p>
            )}
          </div>
        </div>

        {/* Children on route */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" /> Children on Route
          </h2>
          <div className="space-y-2">
            {route.childAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Link href={`/children/${a.child.id}`} className="font-medium text-sm hover:underline text-primary">
                    {a.child.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{a.child.school.name}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{a.child.grade || "—"}</Badge>
              </div>
            ))}
            {route.childAssignments.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No children assigned.</p>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <RouteStopsManager routeId={id} schools={schools} children={allChildren} route={route} />
      )}
    </div>
  );
}
