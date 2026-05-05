import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, AlertTriangle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { DriverFormDialog } from "./driver-form-dialog";

export const dynamic = "force-dynamic";

const bgColors: Record<string, string> = {
  CLEARED: "text-green-700 bg-green-50",
  PENDING: "text-yellow-700 bg-yellow-50",
  FAILED: "text-red-700 bg-red-50",
  EXPIRED: "text-orange-700 bg-orange-50",
};

export default async function DriversPage() {
  const session = await auth();
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      routes: { where: { active: true }, include: { vehicle: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
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

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {d.routes.length > 0
                      ? d.routes.map((r) => <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>)
                      : <span className="text-xs text-muted-foreground">No route assigned</span>
                    }
                  </div>
                  {isAdmin && (
                    <DriverFormDialog driver={{ ...d, name: d.user.name, email: d.user.email, phone: d.user.phone || "" }} />
                  )}
                </div>
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
              <th className="text-left px-4 py-3 font-semibold">Route</th>
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
                    {d.routes.length > 0
                      ? <div className="flex flex-wrap gap-1">{d.routes.map((r) => <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>)}</div>
                      : <span className="text-xs text-muted-foreground">Unassigned</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.active ? "success" : "secondary"}>{d.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <DriverFormDialog driver={{ ...d, name: d.user.name, email: d.user.email, phone: d.user.phone || "" }} />
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
