import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School as SchoolIcon, Plus } from "lucide-react";
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SchoolIcon className="h-6 w-6" /> Schools
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{schools.length} schools</p>
        </div>
        {isAdmin && <SchoolFormDialog />}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Dismissal</TableHead>
              <TableHead>Children</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.address}</TableCell>
                <TableCell><Badge variant="outline">{s.dismissalTime}</Badge></TableCell>
                <TableCell>{s._count.children}</TableCell>
                <TableCell className="text-sm">
                  {s.contactPerson && <div>{s.contactPerson}</div>}
                  {s.contactPhone && <div className="text-muted-foreground">{s.contactPhone}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={s.active ? "success" : "secondary"}>{s.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <SchoolFormDialog school={s} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
