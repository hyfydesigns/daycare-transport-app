"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { School, AlertCircle } from "lucide-react";

interface School { id: string; name: string; }
interface Vehicle { id: string; identifier: string; }

interface Props {
  driverId: string;
  driverName: string;
  schools: School[];
  vehicles: Vehicle[];
}

export function AssignSchoolDialog({ driverId, driverName, schools, vehicles }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/driver-school-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId,
        schoolId: data.get("schoolId"),
        vehicleId: data.get("vehicleId") || null,
        notes: data.get("notes") || null,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to assign school");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <School className="h-3.5 w-3.5" /> Assign School
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assign School to {driverName}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolId">School *</Label>
            <select
              name="schoolId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Select a school…</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <select
              name="vehicleId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">No vehicle specified</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.identifier}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Covering for Route A driver, afternoon pickup only…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Assigning…" : "Assign"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
