import { prisma } from "@/lib/prisma";
import { todayStr, ATTENDANCE_LABELS, ATTENDANCE_COLORS, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, AlertCircle } from "lucide-react";
import { AttendanceDateNav } from "./attendance-date-nav";
import { AttendanceStatusChanger } from "./attendance-status-changer";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const date = rawDate || todayStr();

  const [children, attendanceLogs, routes] = await Promise.all([
    prisma.child.findMany({
      where: { active: true },
      include: {
        school: true,
        routeAssignments: {
          where: { active: true },
          include: { route: true },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendanceLog.findMany({
      where: { date },
    }),
    prisma.route.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);

  const logMap = new Map(attendanceLogs.map((l) => [l.childId, l]));

  // Group children by route
  const childrenByRoute = new Map<string, typeof children>();
  const unassigned: typeof children = [];

  for (const child of children) {
    const assignment = child.routeAssignments[0];
    if (assignment) {
      const routeName = assignment.route.name;
      if (!childrenByRoute.has(routeName)) childrenByRoute.set(routeName, []);
      childrenByRoute.get(routeName)!.push(child);
    } else {
      unassigned.push(child);
    }
  }

  const totalTransported = attendanceLogs.filter((l) => l.status === "TRANSPORTED").length;
  const totalExceptions = attendanceLogs.filter((l) => l.status !== "TRANSPORTED").length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" /> Attendance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <AttendanceDateNav currentDate={date} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{totalTransported}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Transported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-500">{totalExceptions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Exceptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{children.length - attendanceLogs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">No record yet</p>
          </CardContent>
        </Card>
      </div>

      {/* By route */}
      {[...childrenByRoute.entries()].map(([routeName, routeChildren]) => (
        <Card key={routeName}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="secondary">{routeName}</Badge>
              <span className="font-normal text-muted-foreground text-sm">
                {routeChildren.length} children
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {routeChildren.map((child) => {
                const log = logMap.get(child.id);
                const status = log?.status || "TRANSPORTED";
                return (
                  <div key={child.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{child.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {child.school.name} · {child.school.dismissalTime}
                      </p>
                      {child.specialInstructions && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                          <AlertCircle className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{child.specialInstructions}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {log?.status === "TRANSPORTED" && (
                        <span className="text-xs text-muted-foreground">
                          {log.actualPickupTime} → {log.actualDropoffTime}
                        </span>
                      )}
                      {log?.notes && <span className="text-xs text-muted-foreground italic">{log.notes}</span>}
                      <AttendanceStatusChanger
                        childId={child.id}
                        date={date}
                        currentStatus={status}
                        currentNotes={log?.notes || ""}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {unassigned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Unassigned to Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {unassigned.map((child) => {
                const log = logMap.get(child.id);
                const status = log?.status || "TRANSPORTED";
                return (
                  <div key={child.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{child.fullName}</p>
                      <p className="text-xs text-muted-foreground">{child.school.name}</p>
                    </div>
                    <AttendanceStatusChanger childId={child.id} date={date} currentStatus={status} currentNotes={log?.notes || ""} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
