import { prisma } from "@/lib/prisma";
import { weekDates, ATTENDANCE_LABELS, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";
import { ReportControls } from "./report-controls";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ weekOffset?: string }>;
}) {
  const { weekOffset: rawOffset } = await searchParams;
  const weekOffset = parseInt(rawOffset || "0");
  const dates = weekDates(weekOffset);

  const dayLabels = dates.map((d) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    })
  );

  const [children, attendanceLogs] = await Promise.all([
    prisma.child.findMany({
      where: { active: true },
      include: {
        school: true,
        routeAssignments: { where: { active: true }, include: { route: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendanceLog.findMany({ where: { date: { in: dates } } }),
  ]);

  const logMap = new Map<string, Map<string, (typeof attendanceLogs)[0]>>();
  for (const log of attendanceLogs) {
    if (!logMap.has(log.childId)) logMap.set(log.childId, new Map());
    logMap.get(log.childId)!.set(log.date, log);
  }

  const totalTransported = attendanceLogs.filter((l) => l.status === "TRANSPORTED").length;
  const totalExceptions = attendanceLogs.filter((l) => l.status !== "TRANSPORTED").length;
  const onTimeRate =
    attendanceLogs.length > 0
      ? Math.round((totalTransported / attendanceLogs.length) * 100)
      : 0;

  const weekLabel = `${new Date(dates[0] + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${new Date(dates[4] + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* ── Print-only header (hidden on screen) ─────────────────────────────── */}
      <div className="report-print-header hidden">
        <h1 className="text-lg font-bold">Weekly Transportation Report</h1>
        <p className="text-sm text-gray-500">Week of {weekLabel}</p>
      </div>

      {/* ── Print-only compact summary row ───────────────────────────────────── */}
      <div className="report-print-summary hidden">
        <span><strong>{totalTransported}</strong> transported</span>
        <span><strong>{onTimeRate}%</strong> rate</span>
        <span><strong>{totalExceptions}</strong> exceptions</span>
        <span><strong>{children.length}</strong> active children</span>
        <span style={{ marginLeft: "auto" }}>
          Printed: {new Date().toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        </span>
      </div>

      {/* ── Screen header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-5 w-5 md:h-6 md:w-6" /> Weekly Transportation Report
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Week of {weekLabel}</p>
        </div>
        <ReportControls
          weekOffset={weekOffset}
          weekLabel={weekLabel}
          dates={dates}
          dayLabels={dayLabels}
        />
      </div>

      {/* ── Summary stat cards (screen only) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{totalTransported}</p>
            <p className="text-xs text-muted-foreground">Child-trips transported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{onTimeRate}%</p>
            <p className="text-xs text-muted-foreground">Transported rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-500">{totalExceptions}</p>
            <p className="text-xs text-muted-foreground">Exceptions this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{children.length}</p>
            <p className="text-xs text-muted-foreground">Active children</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance table ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-base">Detailed Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* overflow-x-auto on screen; print CSS makes it overflow:visible */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse report-print-table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Child</th>
                  {/* School: hidden on small screen, always shown on print */}
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap hidden md:table-cell print:table-cell">
                    School
                  </th>
                  {dayLabels.map((label, i) => (
                    <th
                      key={i}
                      className="text-center px-3 py-3 font-semibold whitespace-nowrap text-xs"
                    >
                      {label}
                    </th>
                  ))}
                  {/* Extra cols: hidden on smaller screens, shown on lg+ and always on print */}
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap hidden lg:table-cell print:table-cell">
                    Dismissal
                  </th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap hidden lg:table-cell print:table-cell">
                    Guardian
                  </th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap hidden lg:table-cell print:table-cell">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody>
                {children.map((child, idx) => {
                  const childLogs = logMap.get(child.id) || new Map();
                  return (
                    <tr
                      key={child.id}
                      className={cn("border-b", idx % 2 !== 0 && "bg-muted/20")}
                    >
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                        {child.fullName}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap hidden md:table-cell print:table-cell text-xs">
                        {child.school.name}
                      </td>

                      {dates.map((date) => {
                        const log = childLogs.get(date);
                        if (!log) {
                          return (
                            <td
                              key={date}
                              className="px-3 py-2.5 text-center text-xs text-muted-foreground"
                            >
                              —
                            </td>
                          );
                        }
                        if (log.status === "TRANSPORTED") {
                          return (
                            <td key={date} className="px-3 py-2.5 text-center text-xs">
                              <div className="text-green-700 font-mono leading-tight">
                                <div>{log.actualPickupTime || "—"}</div>
                                <div>{log.actualDropoffTime || "—"}</div>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={date} className="px-3 py-2.5 text-center">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {ATTENDANCE_LABELS[log.status] || log.status}
                            </span>
                          </td>
                        );
                      })}

                      <td className="px-4 py-2.5 whitespace-nowrap hidden lg:table-cell print:table-cell text-xs">
                        {child.school.dismissalTime}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap hidden lg:table-cell print:table-cell text-xs">
                        {child.guardianName}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap hidden lg:table-cell print:table-cell text-xs font-mono">
                        {child.guardianPhone}
                      </td>
                    </tr>
                  );
                })}
                {children.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No active children found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
