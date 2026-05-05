"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ATTENDANCE_LABELS } from "@/lib/utils";
import { CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";

const EXCEPTION_STATUSES = [
  { value: "TRANSPORTED", label: "Transported ✓", color: "text-green-700" },
  { value: "PARENT_PICKUP_EARLY", label: "Parent Pickup", color: "text-blue-700" },
  { value: "ABSENT", label: "Absent", color: "text-red-700" },
  { value: "SICK", label: "Sick", color: "text-orange-700" },
  { value: "NO_SCHOOL", label: "No School", color: "text-gray-600" },
  { value: "OTHER", label: "Other", color: "text-gray-700" },
];

export function DriverStopActions({
  childId,
  childName,
  date,
  currentStatus,
  stopType,
}: {
  childId: string;
  childName: string;
  date: string;
  currentStatus: string;
  stopType: "PICKUP" | "DROPOFF";
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const now = () => new Date().toTimeString().slice(0, 5);

  async function markTransported() {
    setLoading(true);
    const pickupTime = stopType === "PICKUP" ? now() : undefined;
    const dropoffTime = stopType === "DROPOFF" ? now() : undefined;
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        date,
        status: "TRANSPORTED",
        actualPickupTime: pickupTime,
        actualDropoffTime: dropoffTime,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  async function saveException() {
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date, status, notes }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const isTransported = currentStatus === "TRANSPORTED";

  return (
    <div className="flex items-center gap-2 shrink-0">
      {isTransported ? (
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <CheckCircle className="h-4 w-4" />
          {stopType === "PICKUP" ? "Picked up" : "Dropped off"}
        </span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8"
          onClick={markTransported}
          disabled={loading}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
          {stopType === "PICKUP" ? "Pick Up" : "Drop Off"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Exception for {childName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              {EXCEPTION_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border text-left transition-colors ${
                    status === s.value ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                  }`}
                >
                  <span className={`text-sm ${s.color}`}>{s.label}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
                rows={2}
                className="text-sm"
              />
            </div>
            <Button className="w-full" onClick={saveException} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
