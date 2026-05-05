import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, AlertTriangle } from "lucide-react";
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Drivers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{drivers.length} drivers</p>
        </div>
        {isAdmin && <DriverFormDialog />}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>License</TableHead>
              <TableHead>License Expiry</TableHead>
              <TableHead>Background</TableHead>
              <TableHead>Assigned Route</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => {
              const licenseExpiring = new Date(d.licenseExpiry) < new Date(Date.now() + 60 * 86400000);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.user.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{d.user.email}</div>
                    {d.user.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {d.user.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{d.licenseNumber}</TableCell>
                  <TableCell>
                    <span className={cn("text-sm", licenseExpiring ? "text-red-600 font-semibold" : "")}>
                      {d.licenseExpiry}
                      {licenseExpiring && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", bgColors[d.backgroundCheckStatus] || "text-gray-600 bg-gray-100")}>
                      {d.backgroundCheckStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    {d.routes.length > 0 ? (
                      <div className="space-y-1">
                        {d.routes.map((r) => (
                          <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.active ? "success" : "secondary"}>{d.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <DriverFormDialog driver={{ ...d, name: d.user.name, email: d.user.email, phone: d.user.phone || "" }} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
