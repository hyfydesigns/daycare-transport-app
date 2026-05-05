import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { todayStr, ATTENDANCE_LABELS } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, School, Home, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { DriverStopActions } from "./driver-stop-actions";

export const dynamic = "force-dynamic";

export default async function DriverRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const today = todayStr();

  const [route, todayAttendance] = await Promise.all([
    prisma.route.findUnique({
      where: { id },
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
    }),
    prisma.attendanceLog.findMany({ where: { date: today } }),
  ]);

  if (!route) notFound();

  const exceptionMap = new Map(todayAttendance.map((l) => [l.childId, l]));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/driver">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{route.name}</h1>
          <p className="text-sm text-muted-foreground">{route.vehicle?.identifier} · {route.stops.length} stops</p>
        </div>
      </div>

      {/* Stops */}
      <div className="space-y-3">
        {route.stops.map((stop, idx) => {
          const childIds: string[] = JSON.parse(stop.childrenIds || "[]");
          const stopChildren = route.childAssignments
            .filter((a) => childIds.includes(a.child.id))
            .map((a) => a.child);

          return (
            <Card key={stop.id} className="overflow-hidden">
              <div className={`h-1 ${stop.type === "PICKUP" ? "bg-blue-500" : "bg-green-500"}`} />
              <CardContent className="pt-3">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {stop.type === "PICKUP" ? (
                        <School className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Home className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant={stop.type === "PICKUP" ? "info" : "success"} className="text-xs">
                        {stop.type}
                      </Badge>
                      {stop.estimatedTime && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {stop.estimatedTime}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">
                      {stop.school?.name ?? stop.address}
                    </p>
                    <p className="text-xs text-muted-foreground">{stop.address}</p>

                    {/* Children at this stop */}
                    <div className="mt-3 space-y-2">
                      {stopChildren.map((child) => {
                        const log = exceptionMap.get(child.id);
                        const hasException = log && log.status !== "TRANSPORTED";
                        return (
                          <div key={child.id} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm">{child.fullName}</p>
                                {child.specialInstructions && (
                                  <div className="flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{child.specialInstructions}</span>
                                  </div>
                                )}
                                {hasException && (
                                  <Badge variant="warning" className="text-xs mt-1">
                                    {ATTENDANCE_LABELS[log.status]}
                                  </Badge>
                                )}
                              </div>
                              <DriverStopActions
                                childId={child.id}
                                childName={child.fullName.split(" ")[0]}
                                date={today}
                                currentStatus={log?.status || "TRANSPORTED"}
                                stopType={stop.type as "PICKUP" | "DROPOFF"}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {stopChildren.length === 0 && (
                        <p className="text-xs text-muted-foreground">No children at this stop.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {route.stops.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground text-sm">No stops configured for this route.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
