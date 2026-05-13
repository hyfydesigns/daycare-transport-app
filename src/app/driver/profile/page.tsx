import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Lock, IdCard, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ── Server actions ──────────────────────────────────────────────────────────

async function updatePersonalInfo(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session) redirect("/login");

  const name  = (formData.get("name")  as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  if (!name) redirect("/driver/profile?error=name");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone || null },
  });

  revalidatePath("/driver", "layout");
  redirect("/driver/profile?saved=1");
}

async function changePassword(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session) redirect("/login");

  const newPassword     = formData.get("newPassword")     as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) redirect("/driver/profile?error=mismatch");
  if (newPassword.length < 8)          redirect("/driver/profile?error=short");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { hashedPassword: hashed } });
  redirect("/driver/profile?saved=2");
}

async function updateDriverDetails(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session) redirect("/login");

  const licenseNumber = (formData.get("licenseNumber") as string)?.trim();
  const licenseExpiry = (formData.get("licenseExpiry") as string)?.trim();
  const certRaw       = (formData.get("certifications") as string)?.trim();
  const notes         = (formData.get("notes")          as string)?.trim();

  if (!licenseNumber) redirect("/driver/profile?error=license");
  if (!licenseExpiry) redirect("/driver/profile?error=expiry");

  // Parse certifications: split by comma, trim, remove blanks
  const certifications = JSON.stringify(
    certRaw.split(",").map((c) => c.trim()).filter(Boolean)
  );

  await prisma.driver.update({
    where: { userId: session.user.id },
    data: { licenseNumber, licenseExpiry, certifications, notes: notes || null },
  });

  redirect("/driver/profile?saved=3");
}

// ── Error/success messages ─────────────────────────────────────────────────

const ERRORS: Record<string, string> = {
  name:     "Name cannot be empty.",
  mismatch: "Passwords do not match.",
  short:    "Password must be at least 8 characters.",
  license:  "License number cannot be empty.",
  expiry:   "License expiry date is required.",
};

const SUCCESS: Record<string, string> = {
  "1": "Personal info updated.",
  "2": "Password changed. Use it next time you sign in.",
  "3": "Driver details updated.",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DriverProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { saved, error } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  const driver = await prisma.driver.findFirst({
    where: { userId: session.user.id },
    select: {
      licenseNumber: true,
      licenseExpiry: true,
      certifications: true,
      backgroundCheckStatus: true,
      backgroundCheckDate: true,
      notes: true,
    },
  });

  if (!user) redirect("/login");

  // Parse certifications JSON string → comma-separated display string
  let certDisplay = "";
  try {
    const arr: string[] = JSON.parse(driver?.certifications || "[]");
    certDisplay = arr.join(", ");
  } catch {
    certDisplay = "";
  }

  const licenseExpiring = driver?.licenseExpiry
    ? new Date(driver.licenseExpiry) < new Date(Date.now() + 60 * 86400_000)
    : false;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/driver">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold">My Profile</h1>
          <p className="text-xs text-muted-foreground">Update your information</p>
        </div>
      </div>

      {/* Success banner */}
      {saved && SUCCESS[saved] && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {SUCCESS[saved]}
        </div>
      )}

      {/* Error banner */}
      {error && ERRORS[error] && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {ERRORS[error]}
        </div>
      )}

      {/* ── Personal info ──────────────────────────────────────────────── */}
      <form action={updatePersonalInfo}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email is your login — contact your admin to change it.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ""}
                placeholder="(555) 000-0000"
              />
            </div>
            <Button type="submit" className="w-full">Save Personal Info</Button>
          </CardContent>
        </Card>
      </form>

      {/* ── Driver details ─────────────────────────────────────────────── */}
      {driver && (
        <form action={updateDriverDetails}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IdCard className="h-4 w-4" /> Driver Details
              </CardTitle>
              <CardDescription>
                License, certifications, and notes visible to your admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="licenseNumber">License #</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    defaultValue={driver.licenseNumber}
                    placeholder="DL-0000000"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="licenseExpiry">Expiry Date</Label>
                  <Input
                    id="licenseExpiry"
                    name="licenseExpiry"
                    type="date"
                    defaultValue={driver.licenseExpiry}
                    required
                    className={licenseExpiring ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                  {licenseExpiring && (
                    <p className="text-xs text-red-600 font-medium">⚠ Expiring soon</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="certifications">Certifications</Label>
                <Input
                  id="certifications"
                  name="certifications"
                  defaultValue={certDisplay}
                  placeholder="CDL, First Aid, CPR"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple certifications with commas.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={driver.notes ?? ""}
                  placeholder="Any notes for your admin…"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              {/* Read-only background check status */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <p className="text-muted-foreground text-xs font-medium mb-1">Background Check (admin-managed)</p>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    driver.backgroundCheckStatus === "CLEARED"  ? "text-green-700"  :
                    driver.backgroundCheckStatus === "PENDING"  ? "text-yellow-700" :
                    driver.backgroundCheckStatus === "EXPIRED"  ? "text-orange-700" :
                    "text-red-700"
                  }`}>
                    {driver.backgroundCheckStatus}
                  </span>
                  {driver.backgroundCheckDate && (
                    <span className="text-xs text-muted-foreground">
                      Checked: {driver.backgroundCheckDate}
                    </span>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full">Save Driver Details</Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ── Change password ─────────────────────────────────────────────── */}
      <form action={changePassword}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              <Lock className="h-4 w-4 mr-1" /> Change Password
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
