import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSetting, setSetting } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Building2, CheckCircle } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function saveSettings(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const orgName = (formData.get("orgName") as string)?.trim();
  if (orgName) await setSetting("orgName", orgName);

  const orgAddress = (formData.get("orgAddress") as string)?.trim();
  await setSetting("orgAddress", orgAddress ?? "");

  revalidatePath("/", "layout"); // refresh sidebar everywhere
  redirect("/settings?saved=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const { saved } = await searchParams;
  const orgName = await getSetting("orgName", "Sunshine Daycare");
  const orgAddress = await getSetting("orgAddress", "");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 md:h-6 md:w-6" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your organization details
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Settings saved successfully.
        </div>
      )}

      <form action={saveSettings} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Organization
            </CardTitle>
            <CardDescription>
              This name appears in the sidebar and on printed reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization / Daycare Name</Label>
              <Input
                id="orgName"
                name="orgName"
                defaultValue={orgName}
                placeholder="e.g. Sunshine Daycare"
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgAddress">Daycare Address</Label>
              <Input
                id="orgAddress"
                name="orgAddress"
                defaultValue={orgAddress}
                placeholder="e.g. 123 Main St, Springfield, IL 62701"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Shown to drivers as the pickup/drop-off location for the daycare.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
