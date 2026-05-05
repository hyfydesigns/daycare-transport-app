import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bus } from "lucide-react";
import { SignOutButton } from "./sign-out-button";
import Link from "next/link";
import { UserCircle } from "lucide-react";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Link href="/driver" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bus className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">DaycareRide</p>
              <p className="text-xs text-muted-foreground">{session.user.name}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/driver/profile"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="My Profile"
            >
              <UserCircle className="h-5 w-5" />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto">{children}</main>
    </div>
  );
}
