import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { VEHICLE_STATUS_COLORS, cn } from "@/lib/utils";
import { VehicleFormDialog } from "./vehicle-form-dialog";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const session = await auth();
  const vehicles = await prisma.vehicle.findMany({ orderBy: { identifier: "asc" } });
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 md:h-6 md:w-6" /> Vehicles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{vehicles.length} vehicles</p>
        </div>
        {isAdmin && <VehicleFormDialog />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {vehicles.map((v) => {
          const insuranceExpiring = v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date(Date.now() + 30 * 86400000);
          return (
            <Card key={v.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-base">{v.identifier}</p>
                    <p className="text-sm text-muted-foreground">{v.make} {v.model} · {v.year}</p>
                    <p className="text-xs font-mono text-muted-foreground">{v.licensePlate}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", VEHICLE_STATUS_COLORS[v.status])}>
                      {v.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{v.capacity} seats</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Mileage</p>
                    <p className="font-medium">{v.mileage?.toLocaleString() ?? "—"} mi</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Insurance Expiry</p>
                    <p className={cn("font-medium", insuranceExpiring ? "text-red-600" : "")}>
                      {v.insuranceExpiry ?? "—"}
                      {insuranceExpiring && " ⚠"}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end">
                    <VehicleFormDialog vehicle={v} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {vehicles.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No vehicles yet.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Identifier</th>
              <th className="text-left px-4 py-3 font-semibold">Make / Model</th>
              <th className="text-left px-4 py-3 font-semibold">Year</th>
              <th className="text-left px-4 py-3 font-semibold">License Plate</th>
              <th className="text-left px-4 py-3 font-semibold">Capacity</th>
              <th className="text-left px-4 py-3 font-semibold">Mileage</th>
              <th className="text-left px-4 py-3 font-semibold">Insurance Expiry</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              {isAdmin && <th className="text-right px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map((v) => {
              const insuranceExpiring = v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date(Date.now() + 30 * 86400000);
              return (
                <tr key={v.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{v.identifier}</td>
                  <td className="px-4 py-3">{v.make} {v.model}</td>
                  <td className="px-4 py-3">{v.year}</td>
                  <td className="px-4 py-3 font-mono text-sm">{v.licensePlate}</td>
                  <td className="px-4 py-3">{v.capacity} seats</td>
                  <td className="px-4 py-3">{v.mileage?.toLocaleString() ?? "—"} mi</td>
                  <td className="px-4 py-3">
                    {v.insuranceExpiry ? (
                      <span className={cn("text-sm", insuranceExpiring ? "text-red-600 font-semibold" : "")}>
                        {v.insuranceExpiry}{insuranceExpiring && " ⚠"}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", VEHICLE_STATUS_COLORS[v.status])}>
                      {v.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <VehicleFormDialog vehicle={v} />
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
