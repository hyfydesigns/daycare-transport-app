import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, AlertTriangle, Mail, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { DriverFormDialog } from "./driver-form-dialog";
import { AssignSchoolDialog } from "./assign-school-dialog";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";

export const dynamic = "force-dynamic";

const bgColors: Record<string, string> = {
  CLEARED: "text-green-700 bg-green-50",
  PENDING: "text-yellow-700 bg-yellow-50",
  FAILED: "text-red-700 bg-red-50",
  EXPIRED: "text-orange-700 bg-orange-50",
};

export default async function DriversPage() {
  const session = await auth();
  const [drivers, schools, vehicles] = await Promise.all([
    prisma.driver.findMany({
      where: { active: true },
      include: {
        user: true,
        routes: { where: { active: true }, include: { vehicle: true } },
        schoolAssignments: {
          where: { active: true },
          include: { school: true, vehicle: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { status: { not: "RETIRED" } }, orderBy: { identifier: "asc" } }),
  ]);
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 md:h-6 md:w-6" /> Drivers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{drivers.length} drivers</p>
        </div>
        {isAdmin && <DriverFormDialog />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {drivers.map((d) => {
          const licenseExpiring = new Date(d.licenseExpiry) < new Date(Date.now() + 60 * 86400000);
          return (
            <Card key={d.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{d.user.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3" /> {d.user.email}
                    </div>
                    {d.user.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {d.user.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={d.active ? "success" : "secondary"} className="text-xs">
                      {d.active ? "Active" : "Inactive"}
                    </Badge>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", bgColors[d.backgroundCheckStatus] || "text-gray-600 bg-gray-100")}>
                      {d.backgroundCheckStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">License</p>
                    <p className="font-mono font-medium">{d.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className={cn("font-medium", licenseExpiring ? "text-red-600" : "")}>
                      {d.licenseExpiry}
                      {licenseExpiring && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                    </p>
                  </div>
                </div>

                {/* Routes */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Routes</p>
                  <div className="flex flex-wrap gap-1">
                    {d.routes.length > 0
                      ? d.routes.map((r) => <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>)
                      : <span className="text-xs text-muted-foreground">No route assigned</span>
                    }
                  </div>
                </div>

                {/* Direct school assignments */}
                {d.schoolAssignments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Direct School Assignments</p>
                    <div className="flex flex-wrap gap-1">
                      {d.schoolAssignments.map((a) => (
                        <div key={a.id} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs gap-1">
                            <School className="h-3 w-3" /> {a.school.name}
                            {a.vehicle && <span className="text-muted-foreground">· {a.vehicle.identifier}</span>}
                          </Badge>
                          {isAdmin && (
                            <DeleteConfirmButton
                              endpoint={`/api/driver-school-assignments/${a.id}`}
                              label={`${a.school.name} assignment`}
                              description="Remove this school assignment from the driver."
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <AssignSchoolDialog
                      driverId={d.id}
                      driverName={d.user.name}
                      schools={schools}
                      vehicles={vehicles}
                      assignedSchoolIds={d.schoolAssignments.map((a) => a.schoolId)}
                    />
                    <div className="flex items-center gap-1">
                      <DriverFormDialog driver={{ ...d, name: d.user.name, email: d.user.email, phone: d.user.phone || "" }} />
                      <DeleteConfirmButton
                        endpoint={`/api/drivers/${d.id}`}
                        label={d.user.name}
                        description="This will deactivate the driver and their login account."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {drivers.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No drivers yet.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Contact</th>
              <th className="text-left px-4 py-3 font-semibold">License</th>
              <th className="text-left px-4 py-3 font-semibold">Expiry</th>
              <th className="text-left px-4 py-3 font-semibold">Background</th>
              <th className="text-left px-4 py-3 font-semibold">Routes & Schools</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              {isAdmin && <th className="text-right px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {drivers.map((d) => {
              const licenseExpiring = new Date(d.licenseExpiry) < new Date(Date.now() + 60 * 86400000);
              return (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{d.user.name}</td>
                  <td className="px-4 py-3">
                    <div>{d.user.email}</div>
                    {d.user.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {d.user.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm", licenseExpiring ? "text-red-600 font-semibold" : "")}>
                      {d.licenseExpiry}
                      {licenseExpiring && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", bgColors[d.backgroundCheckStatus] || "text-gray-600 bg-gray-100")}>
                      {d.backgroundCheckStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.routes.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>
                      ))}
                      {d.schoolAssignments.map((a) => (
                        <div key={a.id} className="flex items-center gap-0.5">
                          <Badge variant="outline" className="text-xs gap-1">
                            <School className="h-3 w-3" /> {a.school.name}
                          </Badge>
                          {isAdmin && (
                            <DeleteConfirmButton
                              endpoint={`/api/driver-school-assignments/${a.id}`}
                              label={`${a.school.name} assignment`}
                              description="Remove this school assignment from the driver."
                            />
                          )}
                        </div>
                      ))}
                      {d.routes.length === 0 && d.schoolAssignments.length === 0 && (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.active ? "success" : "secondary"}>{d.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <AssignSchoolDialog
                          driverId={d.id}
                          driverName={d.user.name}
                          schools={schools}
                          vehicles={vehicles}
                          assignedSchoolIds={d.schoolAssignments.map((a) => a.schoolId)}
                        />
                        <DriverFormDialog driver={{ ...d, name: d.user.name, email: d.user.email, phone: d.user.phone || "" }} />
                        <DeleteConfirmButton
                          endpoint={`/api/drivers/${d.id}`}
                          label={d.user.name}
                          description="This will deactivate the driver and their login account."
                        />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
