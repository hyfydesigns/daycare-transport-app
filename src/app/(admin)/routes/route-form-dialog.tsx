"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";

interface Driver { id: string; user: { name: string } }
interface Vehicle { id: string; identifier: string }
interface Route { id: string; code: string; name: string; driverId?: string | null; vehicleId?: string | null; activeDays: string }

export function RouteFormDialog({ route, drivers, vehicles }: { route?: Route; drivers: Driver[]; vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const body: Record<string, string | null> = {};
    data.forEach((v, k) => { body[k] = v as string; });
    if (body.driverId === "") body.driverId = null;
    if (body.vehicleId === "") body.vehicleId = null;

    const url = route ? `/api/routes/${route.id}` : "/api/routes";
    const method = route ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {route ? (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="h-4 w-4" /> New Route</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{route ? "Edit Route" : "Create Route"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Route Code *</Label>
              <Input id="code" name="code" placeholder="ROUTE-C" defaultValue={route?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Route Name *</Label>
              <Input id="name" name="name" placeholder="Route C" defaultValue={route?.name} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver</Label>
            <select name="driverId" defaultValue={route?.driverId || ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="">No driver assigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.user.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <select name="vehicleId" defaultValue={route?.vehicleId || ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="">No vehicle assigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.identifier}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activeDays">Active Days</Label>
            <Input id="activeDays" name="activeDays" placeholder="MON,TUE,WED,THU,FRI" defaultValue={route?.activeDays || "MON,TUE,WED,THU,FRI"} />
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
