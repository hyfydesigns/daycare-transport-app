"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";

interface School {
  id: string; name: string; address: string; dismissalTime: string;
  contactPerson?: string | null; contactPhone?: string | null;
}

export function SchoolFormDialog({ school }: { school?: School }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    data.forEach((v, k) => { body[k] = v as string; });

    const url = school ? `/api/schools/${school.id}` : "/api/schools";
    const method = school ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {school ? (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="h-4 w-4" /> Add School</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{school ? "Edit School" : "Add School"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">School Name *</Label>
            <Input id="name" name="name" defaultValue={school?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" name="address" defaultValue={school?.address} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dismissalTime">Dismissal Time (HH:MM) *</Label>
            <Input id="dismissalTime" name="dismissalTime" placeholder="15:15" defaultValue={school?.dismissalTime || "15:15"} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input id="contactPerson" name="contactPerson" defaultValue={school?.contactPerson || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" name="contactPhone" defaultValue={school?.contactPhone || ""} />
            </div>
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
