import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bus, LogOut } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bus className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">DaycareTransApp</p>
              <p className="text-xs text-muted-foreground">{session.user.name}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-lg mx-auto">{children}</main>
    </div>
  );
}
