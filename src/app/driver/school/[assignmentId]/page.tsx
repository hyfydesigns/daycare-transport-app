import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { todayStr, ATTENDANCE_LABELS } from "@/lib/utils";
import { getSetting } from "@/lib/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { SchoolRunView } from "./school-run-view";

export const dynamic = "force-dynamic";

export default async function SchoolRunPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const today = todayStr();

  const [assignment, orgName, orgAddress] = await Promise.all([
    prisma.driverSchoolAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        school: true,
        vehicle: true,
        driver: true,
      },
    }),
    getSetting("orgName", "Daycare"),
    getSetting("orgAddress", ""),
  ]);

  if (!assignment || !assignment.active) notFound();

  // Verify this assignment belongs to the logged-in driver
  const driver = await prisma.driver.findFirst({ where: { userId: session.user.id } });
  if (!driver || assignment.driverId !== driver.id) redirect("/driver");

  const children = await prisma.child.findMany({
    where: { schoolId: assignment.schoolId, active: true },
    orderBy: { fullName: "asc" },
  });

  const childIds = children.map((c) => c.id);

  const todayLogs = await prisma.attendanceLog.findMany({
    where: { date: today, childId: { in: childIds } },
  });

  const exceptionMap = new Map(todayLogs.map((l) => [l.childId, l]));

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/driver">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{assignment.school.name}</h1>
          <p className="text-sm text-muted-foreground">
            {assignment.vehicle?.identifier
              ? `${assignment.vehicle.identifier} · `
              : ""}
            {children.length} children
          </p>
        </div>
      </div>

      {/* School info strip */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-blue-700 truncate">{assignment.school.address}</p>
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> Dismissal: {assignment.school.dismissalTime}
              </p>
            </div>
          </div>
          {assignment.notes && (
            <div className="flex items-start gap-1 text-xs text-blue-800 bg-blue-100 rounded p-2 mt-2">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              {assignment.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daycare reference */}
      {orgAddress && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-violet-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-violet-900">{orgName} (Daycare)</p>
                <p className="text-xs text-violet-700">{orgAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive child list — client component handles run-type toggle */}
      <SchoolRunView
        children={children.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          homeAddress: c.homeAddress,
          specialInstructions: c.specialInstructions ?? null,
          defaultDropoff: c.defaultDropoff ?? "HOME",
          log: exceptionMap.get(c.id)
            ? {
                status: exceptionMap.get(c.id)!.status,
                dropoffLocation: exceptionMap.get(c.id)!.dropoffLocation ?? null,
              }
            : null,
        }))}
        date={today}
        orgName={orgName}
        orgAddress={orgAddress}
        attendanceLabels={ATTENDANCE_LABELS}
      />
    </div>
  );
}
