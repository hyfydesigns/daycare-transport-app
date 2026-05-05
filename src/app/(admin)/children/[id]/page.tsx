import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENDANCE_LABELS, ATTENDANCE_COLORS, cn, formatDate } from "@/lib/utils";
import { Phone, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await prisma.child.findUnique({
    where: { id },
    include: {
      school: true,
      routeAssignments: {
        where: { active: true },
        include: { route: { include: { driver: { include: { user: true } }, vehicle: true } } },
      },
      attendanceLogs: { orderBy: { date: "desc" }, take: 15 },
    },
  });

  if (!child) notFound();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/children">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{child.fullName}</h1>
          <p className="text-muted-foreground text-sm">{child.grade || "No grade"} · {child.school.name}</p>
        </div>
        <Link href={`/children/${id}/edit`}>
          <Button variant="outline" size="sm">Edit</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">School</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{child.school.name}</p>
            <p className="text-muted-foreground">{child.school.address}</p>
            <p className="text-muted-foreground">Dismissal: {child.school.dismissalTime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Home Address</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>{child.homeAddress}</p>
            {child.routeAssignments[0] && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {child.routeAssignments[0].route.name}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Driver: {child.routeAssignments[0].route.driver?.user.name ?? "Unassigned"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="font-medium">{child.guardianName} <span className="font-normal text-muted-foreground">({child.guardianRelation})</span></p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {child.guardianPhone}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {child.guardianEmail}
            </div>
          </CardContent>
        </Card>

        {child.emergencyName && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Emergency Contact</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{child.emergencyName} <span className="font-normal text-muted-foreground">({child.emergencyRelation})</span></p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {child.emergencyPhone}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {child.specialInstructions && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Special Instructions</p>
                <p className="text-sm">{child.specialInstructions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
        <CardContent>
          {child.attendanceLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {child.attendanceLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{log.date}</p>
                    {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {log.status === "TRANSPORTED" && (
                      <span className="text-xs text-muted-foreground">
                        {log.actualPickupTime} / {log.actualDropoffTime}
                      </span>
                    )}
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ATTENDANCE_COLORS[log.status])}>
                      {ATTENDANCE_LABELS[log.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
