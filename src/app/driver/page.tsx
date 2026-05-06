import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { todayStr } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Users, AlertCircle, Clock, ChevronRight, School } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DriverHomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = todayStr();

  // Find the driver record
  const driver = await prisma.driver.findFirst({
    where: { userId: session.user.id },
    include: {
      routes: {
        where: { active: true },
        include: {
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
      },
      schoolAssignments: {
        where: { active: true },
        include: { school: true, vehicle: true },
      },
    },
  });

  if (!driver) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No driver profile found. Contact your administrator.</p>
      </div>
    );
  }

  const todayAttendance = await prisma.attendanceLog.findMany({
    where: {
      date: today,
      child: {
        routeAssignments: {
          some: {
            routeId: { in: driver.routes.map((r) => r.id) },
            active: true,
          },
        },
      },
    },
    include: { child: true },
  });

  const exceptionMap = new Map(todayAttendance.map((l) => [l.childId, l]));
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="py-2">
        <h1 className="text-xl font-bold">{greeting}, {session.user.name.split(" ")[0]}! 👋</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {driver.routes.length === 0 && driver.schoolAssignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Bus className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No routes or schools assigned.</p>
            <p className="text-sm text-muted-foreground">Contact your admin if this is unexpected.</p>
          </CardContent>
        </Card>
      ) : (
        driver.routes.map((route) => {
          const routeChildren = route.childAssignments.map((a) => a.child);
          const exceptions = routeChildren.filter((c) => {
            const log = exceptionMap.get(c.id);
            return log && log.status !== "TRANSPORTED";
          });
          const transported = todayAttendance.filter(
            (l) => route.childAssignments.some((a) => a.child.id === l.childId) && l.status === "TRANSPORTED"
          ).length;

          return (
            <div key={route.id} className="space-y-3">
              {/* Route Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{route.name}</CardTitle>
                    <Badge variant="info">{route.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                    <span>{route.vehicle?.identifier ?? "No vehicle"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{routeChildren.length} children · {route.stops.length} stops</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>First stop: {route.stops[0]?.estimatedTime || "TBD"}</span>
                  </div>
                  <Link href={`/driver/route/${route.id}`}>
                    <Button className="w-full mt-3">
                      View Route & Start <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Today stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-green-600">{transported}</p>
                    <p className="text-xs text-muted-foreground">Transported today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-orange-500">{exceptions.length}</p>
                    <p className="text-xs text-muted-foreground">Exceptions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Special instructions */}
              {routeChildren.some((c) => c.specialInstructions) && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900 mb-1">Special Instructions</p>
                        {routeChildren.filter((c) => c.specialInstructions).map((c) => (
                          <p key={c.id} className="text-xs text-orange-800">
                            <span className="font-medium">{c.fullName.split(" ")[0]}:</span> {c.specialInstructions}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })
      )}

      {/* Direct school assignments */}
      {driver.schoolAssignments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            School Assignments
          </h2>
          {driver.schoolAssignments.map((a) => (
            <Card key={a.id} className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <School className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-900">{a.school.name}</p>
                    <p className="text-xs text-blue-700 mt-0.5">{a.school.address}</p>
                    {a.vehicle && (
                      <div className="flex items-center gap-1 text-xs text-blue-700 mt-1">
                        <Bus className="h-3 w-3" /> Vehicle: {a.vehicle.identifier}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-blue-700 mt-0.5">
                      <Clock className="h-3 w-3" /> Dismissal: {a.school.dismissalTime}
                    </div>
                    {a.notes && (
                      <div className="flex items-start gap-1 text-xs text-blue-800 bg-blue-100 rounded p-2 mt-2">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        {a.notes}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
