import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { todayStr, ATTENDANCE_LABELS, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bus, Route, CalendarCheck, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { DashboardMap, ROUTE_COLORS, type DashboardStop } from "@/components/map/map-lazy";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const today = todayStr();

  const [
    totalChildren,
    totalDrivers,
    totalVehicles,
    routes,
    todayAttendance,
    recentAlerts,
  ] = await Promise.all([
    prisma.child.count({ where: { active: true } }),
    prisma.driver.count({ where: { active: true } }),
    prisma.vehicle.count({ where: { status: { not: "RETIRED" } } }),
    prisma.route.findMany({
      where: { active: true },
      include: {
        driver: { include: { user: true } },
        vehicle: true,
        childAssignments: { where: { active: true }, include: { child: true } },
        stops: {
          orderBy: { sequence: "asc" },
          include: { school: true },
        },
      },
    }),
    prisma.attendanceLog.findMany({
      where: { date: today },
      include: { child: { include: { school: true } } },
    }),
    prisma.attendanceLog.findMany({
      where: { date: today, status: { not: "TRANSPORTED" } },
      include: { child: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const transported = todayAttendance.filter((a) => a.status === "TRANSPORTED").length;
  const exceptions = todayAttendance.filter((a) => a.status !== "TRANSPORTED").length;
  const totalScheduled = todayAttendance.length;

  // Build dashboard map stops — all routes, color-coded
  const mapStops: DashboardStop[] = routes.flatMap((route, routeIdx) => {
    const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length];
    return route.stops
      .filter((s) => s.lat !== 0 && s.lng !== 0)
      .map((stop) => ({
        lat: stop.lat,
        lng: stop.lng,
        type: stop.type as "PICKUP" | "DROPOFF",
        routeName: route.name,
        label: stop.school?.name ?? stop.address,
        address: stop.address,
        estimatedTime: stop.estimatedTime,
        routeColor: color,
      }));
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {session?.user.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Children" value={totalChildren} icon={Users} color="blue" />
        <StatCard title="Active Drivers" value={totalDrivers} icon={Users} color="green" />
        <StatCard title="Vehicles" value={totalVehicles} icon={Bus} color="purple" />
        <StatCard title="Routes" value={routes.length} icon={Route} color="orange" />
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Transported Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{transported}</p>
            <p className="text-xs text-muted-foreground mt-1">of {totalScheduled} scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Exceptions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{exceptions}</p>
            <p className="text-xs text-muted-foreground mt-1">parent pickups, absences, etc.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Active Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{routes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">running today</p>
          </CardContent>
        </Card>
      </div>

      {/* Live map */}
      {mapStops.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Today&apos;s Route Map</h2>
            {/* Route color legend */}
            <div className="flex items-center gap-3 flex-wrap">
              {routes.map((r, i) => (
                <span key={r.id} className="flex items-center gap-1.5 text-xs font-medium">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: ROUTE_COLORS[i % ROUTE_COLORS.length] }}
                  />
                  {r.name}
                </span>
              ))}
            </div>
          </div>
          <DashboardMap stops={mapStops} />
        </div>
      )}

      {/* Route cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today&apos;s Routes</h2>
          <Link href="/routes" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route, i) => (
            <RouteCard key={route.id} route={route} color={ROUTE_COLORS[i % ROUTE_COLORS.length]} />
          ))}
          {routes.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-2">No active routes configured.</p>
          )}
        </div>
      </div>

      {/* Recent exceptions */}
      {recentAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today&apos;s Exceptions</h2>
            <Link href="/attendance" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentAlerts.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{log.child.fullName}</p>
                      <p className="text-xs text-muted-foreground">{log.notes || "No notes"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ATTENDANCE_LABELS[log.status] || log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number; icon: React.ElementType; color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteCard({ route, color }: {
  route: {
    id: string; code: string; name: string;
    driver?: { user: { name: string } } | null;
    vehicle?: { identifier: string } | null;
    childAssignments: unknown[];
    stops: { sequence: number; type: string; address: string; estimatedTime?: string | null }[];
  };
  color: string;
}) {
  const nextStop = route.stops[0];
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-1" style={{ background: color }} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{route.name}</CardTitle>
          <Badge variant="info" className="text-xs">Scheduled</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{route.driver?.user.name ?? "No driver assigned"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bus className="h-4 w-4" />
          <span>{route.vehicle?.identifier ?? "No vehicle assigned"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{route.childAssignments.length} children</span>
        </div>
        {nextStop && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">First stop</p>
            <p className="text-sm font-medium truncate">{nextStop.address}</p>
            {nextStop.estimatedTime && (
              <p className="text-xs text-muted-foreground">ETA {nextStop.estimatedTime}</p>
            )}
          </div>
        )}
        <Link href={`/routes/${route.id}`} className="block mt-2 text-xs text-primary hover:underline">
          View route details →
        </Link>
      </CardContent>
    </Card>
  );
}
