import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { weekDates } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekOffset = parseInt(searchParams.get("weekOffset") || "0");
  const dates = weekDates(weekOffset);

  const [children, attendanceLogs] = await Promise.all([
    prisma.child.findMany({
      where: { active: true },
      include: {
        school: true,
        routeAssignments: { where: { active: true }, include: { route: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendanceLog.findMany({
      where: { date: { in: dates } },
    }),
  ]);

  // Build a map: childId → date → log
  const logMap = new Map<string, Map<string, typeof attendanceLogs[0]>>();
  for (const log of attendanceLogs) {
    if (!logMap.has(log.childId)) logMap.set(log.childId, new Map());
    logMap.get(log.childId)!.set(log.date, log);
  }

  const rows = children.map((child) => {
    const childLogs = logMap.get(child.id) || new Map();
    const dayData = dates.map((date) => {
      const log = childLogs.get(date);
      if (!log) return { status: "SCHEDULED", pickup: null, dropoff: null };
      return {
        status: log.status,
        pickup: log.actualPickupTime,
        dropoff: log.actualDropoffTime,
      };
    });

    const transported = dayData.filter((d) => d.status === "TRANSPORTED").length;
    const exceptions = dayData.filter((d) => d.status !== "TRANSPORTED" && d.status !== "SCHEDULED").length;

    return {
      id: child.id,
      fullName: child.fullName,
      school: child.school.name,
      dismissalTime: child.school.dismissalTime,
      guardianName: child.guardianName,
      guardianPhone: child.guardianPhone,
      route: child.routeAssignments[0]?.route.name || "—",
      days: dayData,
      stats: { transported, exceptions },
    };
  });

  // Summary stats
  const totalTransported = attendanceLogs.filter((l) => l.status === "TRANSPORTED").length;
  const totalLogs = attendanceLogs.length;
  const onTimeRate = totalLogs > 0 ? Math.round((totalTransported / totalLogs) * 100) : 0;
  const totalExceptions = attendanceLogs.filter((l) => l.status !== "TRANSPORTED").length;

  return NextResponse.json({
    weekDates: dates,
    rows,
    summary: {
      totalTransported,
      totalLogs,
      onTimeRate,
      totalExceptions,
    },
  });
}
