"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";

interface Vehicle {
  id: string; identifier: string; make: string; model: string; year: number;
  licensePlate: string; capacity: number; status: string; mileage?: number | null;
  insuranceExpiry?: string | null; maintenanceNotes?: string | null;
}

export function VehicleFormDialog({ vehicle }: { vehicle?: Vehicle }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    data.forEach((v, k) => { body[k] = v as string; });

    const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
    const method = vehicle ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {vehicle ? (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="h-4 w-4" /> Add Vehicle</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Identifier *</Label>
              <Input id="identifier" name="identifier" placeholder="Van 1" defaultValue={vehicle?.identifier} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input id="licensePlate" name="licensePlate" defaultValue={vehicle?.licensePlate} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input id="make" name="make" defaultValue={vehicle?.make} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" name="model" defaultValue={vehicle?.model} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input id="year" name="year" type="number" defaultValue={vehicle?.year || new Date().getFullYear()} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (seats) *</Label>
              <Input id="capacity" name="capacity" type="number" defaultValue={vehicle?.capacity || 12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage</Label>
              <Input id="mileage" name="mileage" type="number" defaultValue={vehicle?.mileage || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
              <Input id="insuranceExpiry" name="insuranceExpiry" type="date" defaultValue={vehicle?.insuranceExpiry || ""} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status">Status</Label>
              <select name="status" defaultValue={vehicle?.status || "ACTIVE"} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="ACTIVE">Active</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
