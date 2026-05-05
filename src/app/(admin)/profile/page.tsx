import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Lock, CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session) redirect("/login");

  const name  = (formData.get("name")  as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name) redirect("/profile?error=name");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone || null },
  });

  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}

async function changePassword(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session) redirect("/login");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword     = formData.get("newPassword")     as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) redirect("/profile?error=mismatch");
  if (newPassword.length < 8)         redirect("/profile?error=short");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!valid) redirect("/profile?error=wrong");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { hashedPassword: hashed },
  });

  redirect("/profile?saved=2");
}

const ERRORS: Record<string, string> = {
  name:     "Name cannot be empty.",
  mismatch: "New passwords do not match.",
  short:    "New password must be at least 8 characters.",
  wrong:    "Current password is incorrect.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { saved, error } = await searchParams;

  // Always fetch fresh user data from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, role: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <UserCircle className="h-5 w-5 md:h-6 md:w-6" /> My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your name, contact info, and password
        </p>
      </div>

      {/* Success banners */}
      {saved === "1" && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Profile updated successfully.
        </div>
      )}
      {saved === "2" && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Password changed. Sign in with your new password next time.
        </div>
      )}

      {/* Error banner */}
      {error && ERRORS[error] && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {ERRORS[error]}
        </div>
      )}

      {/* ── Profile info ──────────────────────────────────────────────── */}
      <form action={updateProfile}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Personal Information
            </CardTitle>
            <CardDescription>
              Your name appears in the sidebar and on reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email is used for login and cannot be changed here. Contact your admin.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ""}
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* ── Change password ───────────────────────────────────────────── */}
      <form action={changePassword}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" /> Change Password
            </CardTitle>
            <CardDescription>
              Leave blank if you don&apos;t want to change your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="outline">
                <Lock className="h-4 w-4 mr-1" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
