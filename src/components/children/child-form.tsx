"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface School { id: string; name: string; dismissalTime: string }
interface Route { id: string; name: string; code: string }
interface ChildFormProps {
  schools: School[];
  routes: Route[];
  defaultValues?: Partial<{
    id: string;
    fullName: string;
    grade: string;
    dateOfBirth: string;
    schoolId: string;
    homeAddress: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    guardianRelation: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;
    specialInstructions: string;
    routeId: string;
  }>;
}

export function ChildForm({ schools, routes, defaultValues }: ChildFormProps) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    data.forEach((v, k) => { body[k] = v as string; });

    const { routeId, ...childBody } = body;

    const url = isEdit ? `/api/children/${defaultValues!.id}` : "/api/children";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(childBody),
    });

    if (!res.ok) {
      setError("Failed to save. Please check your inputs.");
      setLoading(false);
      return;
    }

    const child = await res.json();

    if (isEdit) {
      const prevRouteId = defaultValues?.routeId ?? "";
      const nextRouteId = routeId ?? "";

      if (nextRouteId !== prevRouteId) {
        // Deactivate the old assignment
        if (prevRouteId && prevRouteId !== "none") {
          await fetch(`/api/routes/${prevRouteId}/children`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId: child.id }),
          });
        }
        // Create the new assignment
        if (nextRouteId && nextRouteId !== "none") {
          await fetch(`/api/routes/${nextRouteId}/children`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId: child.id }),
          });
        }
      }
    } else {
      // Create mode — just assign if a route was chosen
      if (routeId && routeId !== "none") {
        await fetch(`/api/routes/${routeId}/children`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId: child.id }),
        });
      }
    }

    router.push("/children");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" name="fullName" defaultValue={defaultValues?.fullName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Input id="grade" name="grade" placeholder="K, 1st, 2nd…" defaultValue={defaultValues?.grade || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaultValues?.dateOfBirth || ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="schoolId">School *</Label>
            <select
              id="schoolId"
              name="schoolId"
              defaultValue={defaultValues?.schoolId || ""}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Select school…</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (dismissal {s.dismissalTime})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="homeAddress">Home Address *</Label>
            <Input id="homeAddress" name="homeAddress" defaultValue={defaultValues?.homeAddress} required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Guardian Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Name *</Label>
            <Input id="guardianName" name="guardianName" defaultValue={defaultValues?.guardianName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianRelation">Relationship</Label>
            <Input id="guardianRelation" name="guardianRelation" defaultValue={defaultValues?.guardianRelation || "Parent"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Phone *</Label>
            <Input id="guardianPhone" name="guardianPhone" type="tel" defaultValue={defaultValues?.guardianPhone} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Email *</Label>
            <Input id="guardianEmail" name="guardianEmail" type="email" defaultValue={defaultValues?.guardianEmail} required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Emergency Contact (optional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Name</Label>
            <Input id="emergencyName" name="emergencyName" defaultValue={defaultValues?.emergencyName || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyRelation">Relationship</Label>
            <Input id="emergencyRelation" name="emergencyRelation" defaultValue={defaultValues?.emergencyRelation || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Phone</Label>
            <Input id="emergencyPhone" name="emergencyPhone" type="tel" defaultValue={defaultValues?.emergencyPhone || ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Route & Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routeId">Assign to Route</Label>
            <select
              id="routeId"
              name="routeId"
              defaultValue={defaultValues?.routeId || "none"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="none">No route</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              name="specialInstructions"
              placeholder="Allergies, behavior notes, car seat required…"
              defaultValue={defaultValues?.specialInstructions || ""}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Child"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
