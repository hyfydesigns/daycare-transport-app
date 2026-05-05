import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { School as SchoolIcon, MapPin, Phone, Users } from "lucide-react";
import { SchoolFormDialog } from "./school-form-dialog";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  const session = await auth();
  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true } } },
  });
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <SchoolIcon className="h-5 w-5 md:h-6 md:w-6" /> Schools
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{schools.length} schools</p>
        </div>
        {isAdmin && <SchoolFormDialog />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {schools.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{s.name}</p>
                  <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{s.address}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant={s.active ? "success" : "secondary"} className="text-xs">
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{s.dismissalTime}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {s._count.children} children
                </div>
                {s.contactPerson && (
                  <div className="text-muted-foreground">{s.contactPerson}</div>
                )}
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-1">
                  <SchoolFormDialog school={s} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {schools.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No schools yet.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Address</th>
              <th className="text-left px-4 py-3 font-semibold">Dismissal</th>
              <th className="text-left px-4 py-3 font-semibold">Children</th>
              <th className="text-left px-4 py-3 font-semibold">Contact</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              {isAdmin && <th className="text-right px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {schools.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{s.address}</td>
                <td className="px-4 py-3"><Badge variant="outline">{s.dismissalTime}</Badge></td>
                <td className="px-4 py-3">{s._count.children}</td>
                <td className="px-4 py-3">
                  {s.contactPerson && <div>{s.contactPerson}</div>}
                  {s.contactPhone && <div className="text-muted-foreground text-xs">{s.contactPhone}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.active ? "success" : "secondary"}>{s.active ? "Active" : "Inactive"}</Badge>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <SchoolFormDialog school={s} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
