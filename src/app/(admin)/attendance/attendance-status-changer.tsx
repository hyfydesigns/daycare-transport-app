"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ATTENDANCE_LABELS, ATTENDANCE_COLORS, cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

const ALL_STATUSES = [
  "TRANSPORTED",
  "PARENT_PICKUP_EARLY",
  "NO_SCHOOL",
  "ABSENT",
  "SICK",
  "VACATION",
  "OTHER",
];

export function AttendanceStatusChanger({
  childId,
  date,
  currentStatus,
  currentNotes,
}: {
  childId: string;
  date: string;
  currentStatus: string;
  currentNotes: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save() {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={cn(
          "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity",
          ATTENDANCE_COLORS[currentStatus] || "text-gray-600 bg-gray-100"
        )}>
          {ATTENDANCE_LABELS[currentStatus] || currentStatus}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Attendance Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left",
                  status === s
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  s === "TRANSPORTED" ? "bg-green-500" :
                  s === "PARENT_PICKUP_EARLY" ? "bg-blue-500" :
                  s === "NO_SCHOOL" ? "bg-gray-400" :
                  s === "ABSENT" ? "bg-red-500" :
                  s === "SICK" ? "bg-orange-500" :
                  s === "VACATION" ? "bg-purple-500" : "bg-yellow-500"
                )} />
                {ATTENDANCE_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes…"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
