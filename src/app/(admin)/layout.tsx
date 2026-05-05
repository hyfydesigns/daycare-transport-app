import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "DRIVER") redirect("/driver");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <Sidebar userName={session.user.name} userRole={session.user.role} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
