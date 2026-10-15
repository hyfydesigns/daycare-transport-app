"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ATTENDANCE_LABELS } from "@/lib/utils";
import { CheckCircle, AlertCircle, ArrowUpFromLine, ArrowDownToLine, Loader2 } from "lucide-react";

const EXCEPTION_STATUSES = [
  { value: "PARENT_PICKUP_EARLY", label: "Parent Pickup Early", color: "text-blue-700" },
  { value: "ABSENT",              label: "Absent",              color: "text-red-700"  },
  { value: "SICK",                label: "Sick",                color: "text-orange-700" },
  { value: "NO_SCHOOL",           label: "No School",           color: "text-gray-600" },
  { value: "OTHER",               label: "Other",               color: "text-gray-700" },
];

export function DriverStopActions({
  childId,
  childName,
  date,
  currentStatus,
  stopType,
  actualPickupTime,
  actualDropoffTime,
  isOnRun,
}: {
  childId: string;
  childName: string;
  date: string;
  currentStatus: string;
  stopType: "PICKUP" | "DROPOFF";
  actualPickupTime?: string | null;
  actualDropoffTime?: string | null;
  isOnRun: boolean;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loggedTime, setLoggedTime] = useState<string | null>(
    stopType === "PICKUP" ? (actualPickupTime ?? null) : (actualDropoffTime ?? null)
  );
  const [open, setOpen] = useState(false);
  const [excStatus, setExcStatus] = useState("ABSENT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const now = () => new Date().toTimeString().slice(0, 5);

  // Done = the specific time for this stop type is logged
  const isDone = !!loggedTime;
  const hasException = status !== "TRANSPORTED" && status !== "";

  async function markTransported() {
    setLoading(true);
    const time = now();
    if (!isOnRun) {
      await fetch("/api/driver/run", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnRun: true }),
      });
    }
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        date,
        status: "TRANSPORTED",
        ...(stopType === "PICKUP"  ? { actualPickupTime:  time } : {}),
        ...(stopType === "DROPOFF" ? { actualDropoffTime: time } : {}),
      }),
    });
    setLoggedTime(time);
    setStatus("TRANSPORTED");
    setLoading(false);
    router.refresh();
  }

  async function saveException() {
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date, status: excStatus, notes }),
    });
    setStatus(excStatus);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (isDone) {
    return (
      <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl py-3 mt-3">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <span className="text-sm font-semibold text-green-700">
          {stopType === "PICKUP" ? "Picked up" : "Dropped off"}
          {loggedTime && <span className="font-normal text-green-600 ml-1">at {loggedTime}</span>}
        </span>
      </div>
    );
  }

  if (!isDone && hasException) {
    return (
      <div className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-xl py-3 mt-3">
        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
        <Badge variant="warning" className="text-xs">{ATTENDANCE_LABELS[status] ?? status}</Badge>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Primary action — large tap target */}
      <button
        type="button"
        onClick={markTransported}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ${
          stopType === "PICKUP"
            ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
            : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white"
        }`}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : stopType === "PICKUP" ? (
          <><ArrowUpFromLine className="h-5 w-5" /> Picked Up</>
        ) : (
          <><ArrowDownToLine className="h-5 w-5" /> Dropped Off</>
        )}
      </button>

      {/* Exception — secondary link */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground hover:text-orange-600 py-1 transition-colors"
          >
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Mark as exception
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Exception — {childName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              {EXCEPTION_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setExcStatus(s.value)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border text-left transition-colors ${
                    excStatus === s.value ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                  }`}
                >
                  <span className={s.color}>{s.label}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="text-sm"
              />
            </div>
            <Button className="w-full h-12 text-base" onClick={saveException} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
