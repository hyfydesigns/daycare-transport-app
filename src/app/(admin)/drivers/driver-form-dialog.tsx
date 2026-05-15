"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, AlertCircle, CheckCircle2, Mail, Loader2 } from "lucide-react";

interface Driver {
  id: string; name: string; email: string; phone: string;
  licenseNumber: string; licenseExpiry: string; backgroundCheckStatus: string;
}
interface RouteOption { id: string; name: string; code: string; }

interface Props {
  driver?: Driver;
  allRoutes?: RouteOption[];
  assignedRouteIds?: string[];
}

export function DriverFormDialog({ driver, allRoutes = [], assignedRouteIds = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");
  // Route checkboxes state (edit mode only)
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(new Set(assignedRouteIds));
  const router = useRouter();

  function handleOpen(v: boolean) {
    setOpen(v);
    setFormError(null);
    setEmailError(null);
    setEmailSent(false);
    setResendStatus("idle");
    if (v) setSelectedRouteIds(new Set(assignedRouteIds)); // reset to current on open
  }

  async function handleResendWelcome() {
    if (!driver) return;
    setResendLoading(true);
    setResendStatus("idle");
    const res = await fetch(`/api/drivers/${driver.id}/resend-welcome`, { method: "POST" });
    setResendLoading(false);
    setResendStatus(res.ok ? "sent" : "error");
  }

  function toggleRoute(id: string) {
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setEmailError(null);
    setEmailSent(false);

    const data = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    data.forEach((v, k) => { body[k] = v as string; });

    const url = driver ? `/api/drivers/${driver.id}` : "/api/drivers";
    const method = driver ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();

    if (!res.ok) {
      setFormError(json?.error ?? `Unexpected error (${res.status})`);
      setLoading(false);
      return;
    }

    // Handle route assignments in edit mode
    if (driver && allRoutes.length > 0) {
      const prev = new Set(assignedRouteIds);
      const next = selectedRouteIds;

      // Routes to add (in next but not prev)
      const toAdd = [...next].filter((id) => !prev.has(id));
      // Routes to remove (in prev but not next)
      const toRemove = [...prev].filter((id) => !next.has(id));

      await Promise.all([
        ...toAdd.map((routeId) =>
          fetch(`/api/routes/${routeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driverId: driver.id }),
          })
        ),
        ...toRemove.map((routeId) =>
          fetch(`/api/routes/${routeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driverId: null }),
          })
        ),
      ]);
    }

    setLoading(false);

    if (!driver) {
      if (json.emailError) {
        setEmailError(json.emailError);
        router.refresh();
        return;
      } else {
        setEmailSent(true);
        setTimeout(() => { setOpen(false); setEmailSent(false); router.refresh(); }, 2000);
        return;
      }
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {driver ? (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="h-4 w-4" /> Add Driver</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{driver ? "Edit Driver" : "Add Driver"}</DialogTitle>
        </DialogHeader>

        {formError && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {emailSent && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Driver created and welcome email sent!
          </div>
        )}

        {emailError && (
          <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Driver created, but welcome email failed to send.</p>
              <p className="text-xs mt-0.5 text-amber-700">{emailError}</p>
              <p className="text-xs mt-1 text-amber-700">Check that <code className="font-mono">RESEND_API_KEY</code> is set in your environment variables.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" defaultValue={driver?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={driver?.phone} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" defaultValue={driver?.email} required />
              {!driver && (
                <p className="text-xs text-muted-foreground">
                  A secure temporary password will be emailed to the driver automatically.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input id="licenseNumber" name="licenseNumber" defaultValue={driver?.licenseNumber} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">License Expiry *</Label>
              <Input id="licenseExpiry" name="licenseExpiry" type="date" defaultValue={driver?.licenseExpiry} required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="backgroundCheckStatus">Background Check</Label>
              <select name="backgroundCheckStatus" defaultValue={driver?.backgroundCheckStatus || "PENDING"} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="PENDING">Pending</option>
                <option value="CLEARED">Cleared</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* Route assignment — edit mode only */}
          {driver && allRoutes.length > 0 && (
            <div className="space-y-2">
              <Label>Route Assignments</Label>
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {allRoutes.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                      checked={selectedRouteIds.has(r.id)}
                      onChange={() => toggleRoute(r.id)}
                    />
                    <span className="text-sm flex-1">{r.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{r.code}</span>
                  </label>
                ))}
              </div>
              {allRoutes.length === 0 && (
                <p className="text-xs text-muted-foreground">No active routes available.</p>
              )}
            </div>
          )}

          {/* Resend welcome email — edit mode only */}
          {driver && (
            <div className="border-t pt-3 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendWelcome}
                disabled={resendLoading}
              >
                {resendLoading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  : <><Mail className="h-4 w-4 mr-2" />Send Welcome Email</>}
              </Button>
              {resendStatus === "sent" && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Welcome email sent with a new temporary password.
                </p>
              )}
              {resendStatus === "error" && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Failed to send email. Check your email settings.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || emailSent}>{loading ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
