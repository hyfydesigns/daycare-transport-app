"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface School { id: string; name: string; address: string; lat: number; lng: number }
interface Child { id: string; fullName: string; homeAddress: string; homeLat: number; homeLng: number; school: { name: string } }
interface Route { id: string; stops: { id: string; sequence: number; type: string; address: string }[] }

export function RouteStopsManager({ routeId, schools, children, route }: {
  routeId: string;
  schools: School[];
  children: Child[];
  route: Route;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stopType, setStopType] = useState<"PICKUP" | "DROPOFF">("PICKUP");
  const router = useRouter();

  async function handleAddStop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const body: Record<string, string | number> = {};
    data.forEach((v, k) => { body[k] = v as string; });
    body.sequence = route.stops.length + 1;
    body.routeId = routeId;
    body.type = stopType;

    if (stopType === "PICKUP" && body.schoolId) {
      const school = schools.find((s) => s.id === body.schoolId);
      if (school) { body.address = school.address; body.lat = school.lat; body.lng = school.lng; }
    } else if (stopType === "DROPOFF" && body.childId) {
      const child = children.find((c) => c.id === body.childId);
      if (child) { body.address = child.homeAddress; body.lat = child.homeLat; body.lng = child.homeLng; body.childrenIds = JSON.stringify([child.id]); }
    }

    await fetch("/api/stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="pt-4 border-t">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Stop
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stop to Route</DialogTitle></DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              size="sm"
              variant={stopType === "PICKUP" ? "default" : "outline"}
              onClick={() => setStopType("PICKUP")}
            >School Pickup</Button>
            <Button
              type="button"
              size="sm"
              variant={stopType === "DROPOFF" ? "default" : "outline"}
              onClick={() => setStopType("DROPOFF")}
            >Home Dropoff</Button>
          </div>
          <form onSubmit={handleAddStop} className="space-y-4">
            {stopType === "PICKUP" ? (
              <div className="space-y-2">
                <Label>School</Label>
                <select name="schoolId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Child (drop off at their home)</Label>
                <select name="childId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select child…</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName} — {c.homeAddress}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Estimated Time (HH:MM)</Label>
              <Input name="estimatedTime" placeholder="15:30" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Adding…" : "Add Stop"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
