import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { VEHICLE_STATUS_COLORS, cn } from "@/lib/utils";
import { VehicleFormDialog } from "./vehicle-form-dialog";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const session = await auth();
  const vehicles = await prisma.vehicle.findMany({ orderBy: { identifier: "asc" } });
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Vehicles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{vehicles.length} vehicles</p>
        </div>
        {isAdmin && <VehicleFormDialog />}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identifier</TableHead>
              <TableHead>Make / Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Insurance Expiry</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => {
              const insuranceExpiring = v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date(Date.now() + 30 * 86400000);
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-semibold">{v.identifier}</TableCell>
                  <TableCell>{v.make} {v.model}</TableCell>
                  <TableCell>{v.year}</TableCell>
                  <TableCell className="font-mono text-sm">{v.licensePlate}</TableCell>
                  <TableCell>{v.capacity} seats</TableCell>
                  <TableCell>{v.mileage?.toLocaleString() ?? "—"} mi</TableCell>
                  <TableCell>
                    {v.insuranceExpiry ? (
                      <span className={cn("text-sm", insuranceExpiring ? "text-red-600 font-semibold" : "")}>
                        {v.insuranceExpiry}
                        {insuranceExpiring && " ⚠"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", VEHICLE_STATUS_COLORS[v.status])}>
                      {v.status}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <VehicleFormDialog vehicle={v} />
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
