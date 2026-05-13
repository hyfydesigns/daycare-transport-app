"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle, CheckCircle, AlertTriangle,
  ArrowUpFromLine, ArrowDownToLine, Home, Building2, ArrowRightLeft,
} from "lucide-react";

interface ChildRow {
  id: string;
  fullName: string;
  homeAddress: string;
  specialInstructions: string | null;
  defaultDropoff: string;
  log: { status: string; dropoffLocation: string | null } | null;
}

const EXCEPTION_STATUSES = [
  { value: "TRANSPORTED",        label: "Transported ✓",  color: "text-green-700" },
  { value: "PARENT_PICKUP_EARLY",label: "Parent Pickup",  color: "text-blue-700"  },
  { value: "ABSENT",             label: "Absent",         color: "text-red-700"   },
  { value: "SICK",               label: "Sick",           color: "text-orange-700"},
  { value: "NO_SCHOOL",          label: "No School",      color: "text-gray-600"  },
  { value: "OTHER",              label: "Other",          color: "text-gray-700"  },
];

// ── Dropoff location toggle ───────────────────────────────────────────────────
function DropoffToggle({
  childId, date, location, orgName, orgAddress, homeAddress, onChange,
}: {
  childId: string; date: string; location: string;
  orgName: string; orgAddress: string; homeAddress: string;
  onChange: (next: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const isHome = location === "HOME";

  async function toggle() {
    const next = isHome ? "DAYCARE" : "HOME";
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date, dropoffLocation: next }),
    });
    setLoading(false);
    onChange(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-full border text-xs font-medium w-full truncate transition-colors
        ${isHome
          ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}
        ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {isHome
        ? <Home className="h-3 w-3 shrink-0 text-slate-500" />
        : <Building2 className="h-3 w-3 shrink-0 text-violet-500" />}
      <span className="truncate">{isHome ? homeAddress : (orgAddress || orgName)}</span>
      <ArrowRightLeft className="h-3 w-3 shrink-0 text-muted-foreground ml-auto" />
    </button>
  );
}

// ── Per-child action buttons ──────────────────────────────────────────────────
function ChildActions({
  child, date, runType, orgName, orgAddress, attendanceLabels,
}: {
  child: ChildRow; date: string; runType: "PICKUP" | "DROPOFF";
  orgName: string; orgAddress: string;
  attendanceLabels: Record<string, string>;
}) {
  const now = () => new Date().toTimeString().slice(0, 5);
  const router = useRouter();
  const [status, setStatus] = useState(child.log?.status ?? "");
  const [dropoffLoc, setDropoffLoc] = useState(
    child.log?.dropoffLocation ?? child.defaultDropoff ?? "HOME"
  );
  const [excOpen, setExcOpen] = useState(false);
  const [excStatus, setExcStatus] = useState(status);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const isTransported = status === "TRANSPORTED";
  const hasException  = status !== "TRANSPORTED" && status !== "";

  async function markTransported() {
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: child.id,
        date,
        status: "TRANSPORTED",
        ...(runType === "PICKUP"  ? { actualPickupTime:  now() } : {}),
        ...(runType === "DROPOFF" ? { actualDropoffTime: now() } : {}),
      }),
    });
    setStatus("TRANSPORTED");
    setLoading(false);
    router.refresh();
  }

  async function saveException() {
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: child.id, date, status: excStatus, notes }),
    });
    setStatus(excStatus);
    setLoading(false);
    setExcOpen(false);
    router.refresh();
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{child.fullName}</p>

          {child.specialInstructions && (
            <div className="flex items-center gap-1 text-xs text-orange-600 mt-0.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="truncate">{child.specialInstructions}</span>
            </div>
          )}

          {hasException && (
            <Badge variant="warning" className="text-xs mt-1">
              {attendanceLabels[status] ?? status}
            </Badge>
          )}

          {/* Drop-off destination toggle — only when dropping off */}
          {runType === "DROPOFF" && (
            <DropoffToggle
              childId={child.id}
              date={date}
              location={dropoffLoc}
              orgName={orgName}
              orgAddress={orgAddress}
              homeAddress={child.homeAddress}
              onChange={setDropoffLoc}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isTransported ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              {runType === "PICKUP" ? "Picked up" : "Dropped off"}
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
              {runType === "PICKUP" ? "Pick Up" : "Drop Off"}
            </Button>
          )}

          <Dialog open={excOpen} onOpenChange={setExcOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 px-2">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Exception for {child.fullName.split(" ")[0]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  {EXCEPTION_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setExcStatus(s.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border text-left transition-colors ${
                        excStatus === s.value
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      <span className={s.color}>{s.label}</span>
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
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function SchoolRunView({
  children,
  date,
  orgName,
  orgAddress,
  attendanceLabels,
}: {
  children: ChildRow[];
  date: string;
  orgName: string;
  orgAddress: string;
  attendanceLabels: Record<string, string>;
}) {
  const [runType, setRunType] = useState<"PICKUP" | "DROPOFF">("PICKUP");

  return (
    <div className="space-y-3">
      {/* Run type toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          type="button"
          onClick={() => setRunType("PICKUP")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            runType === "PICKUP"
              ? "bg-blue-600 text-white"
              : "bg-white text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <ArrowUpFromLine className="h-4 w-4" /> Picking up
        </button>
        <button
          type="button"
          onClick={() => setRunType("DROPOFF")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            runType === "DROPOFF"
              ? "bg-green-600 text-white"
              : "bg-white text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <ArrowDownToLine className="h-4 w-4" /> Dropping off
        </button>
      </div>

      {/* Children */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">No children enrolled at this school.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {children.map((child) => (
            <ChildActions
              key={child.id}
              child={child}
              date={date}
              runType={runType}
              orgName={orgName}
              orgAddress={orgAddress}
              attendanceLabels={attendanceLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}
