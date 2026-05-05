"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, AlertCircle, CheckCircle2 } from "lucide-react";

interface Driver {
  id: string; name: string; email: string; phone: string;
  licenseNumber: string; licenseExpiry: string; backgroundCheckStatus: string;
}

export function DriverFormDialog({ driver }: { driver?: Driver }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setEmailError(null);
    setEmailSent(false);

    const data = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    data.forEach((v, k) => { body[k] = v as string; });

    const url = driver ? `/api/drivers/${driver.id}` : "/api/drivers";
    const method = driver ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();

    setLoading(false);

    if (!driver) {
      // Show email status before closing
      if (json.emailError) {
        setEmailError(json.emailError);
        router.refresh();
        return; // Stay open so admin sees the error
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setEmailError(null); setEmailSent(false); }}>
      <DialogTrigger asChild>
        {driver ? (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="h-4 w-4" /> Add Driver</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{driver ? "Edit Driver" : "Add Driver"}</DialogTitle>
        </DialogHeader>

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
              <Input id="email" name="email" type="email" defaultValue={driver?.email} required={!driver} disabled={!!driver} />
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || emailSent}>{loading ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
