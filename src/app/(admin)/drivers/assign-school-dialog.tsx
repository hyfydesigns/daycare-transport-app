"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { School, AlertCircle, CheckSquare } from "lucide-react";

interface SchoolItem { id: string; name: string; }
interface Vehicle { id: string; identifier: string; }

interface Props {
  driverId: string;
  driverName: string;
  schools: SchoolItem[];
  vehicles: Vehicle[];
  assignedSchoolIds: string[];
}

export function AssignSchoolDialog({ driverId, driverName, schools, vehicles, assignedSchoolIds }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  function handleOpen(v: boolean) {
    setOpen(v);
    setError(null);
    if (v) setSelected(new Set()); // reset on open
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.size === 0) { setError("Select at least one school."); return; }

    setLoading(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/driver-school-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId,
        schoolIds: Array.from(selected),
        vehicleId: data.get("vehicleId") || null,
        notes: data.get("notes") || null,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to assign schools");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  const assignedSet = new Set(assignedSchoolIds);
  const availableSchools = schools.filter((s) => !assignedSet.has(s.id));
  const alreadyAssigned = schools.filter((s) => assignedSet.has(s.id));

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <School className="h-3.5 w-3.5" /> Assign School
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Assign Schools to {driverName}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* School checkboxes */}
          <div className="space-y-2">
            <Label>Schools</Label>
            <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
              {availableSchools.length === 0 && alreadyAssigned.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-4 text-center">No schools available.</p>
              )}

              {/* Selectable schools */}
              {availableSchools.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}

              {/* Already-assigned schools (disabled) */}
              {alreadyAssigned.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 opacity-50 cursor-not-allowed bg-muted/30"
                >
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Already assigned</span>
                </label>
              ))}
            </div>
            {selected.size > 0 && (
              <p className="text-xs text-muted-foreground">{selected.size} school{selected.size > 1 ? "s" : ""} selected</p>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-2">
            <Label>Vehicle <span className="text-muted-foreground text-xs">(optional — applies to all selected)</span></Label>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional — applies to all selected)</span></Label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Covering for Route A driver, afternoon pickup only…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || selected.size === 0}>
              {loading ? "Assigning…" : `Assign${selected.size > 0 ? ` (${selected.size})` : ""}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
