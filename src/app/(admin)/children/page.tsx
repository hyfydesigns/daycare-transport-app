import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Phone, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ChildDeleteButton } from "./child-actions";
import { ChildrenFilters } from "./children-filters";
import { RestoreButton } from "./restore-button";
import { PermanentDeleteButton } from "./permanent-delete-button";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; schoolId?: string; active?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const search = params.search || "";

  const children = await prisma.child.findMany({
    where: {
      ...(search && { fullName: { contains: search } }),
      ...(params.schoolId && { schoolId: params.schoolId }),
      active: params.active === "false" ? false : true,
    },
    include: {
      school: true,
      routeAssignments: {
        where: { active: true },
        include: { route: true },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  const schools = await prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 md:h-6 md:w-6" /> Children
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{children.length} records</p>
        </div>
        {session?.user.role !== "DRIVER" && (
          <Link href="/children/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Child
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <ChildrenFilters schools={schools} />

      <div className="rounded-xl border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>School</TableHead>
              <TableHead className="hidden md:table-cell">Grade</TableHead>
              <TableHead className="hidden md:table-cell">Route</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {children.map((child) => (
              <TableRow key={child.id}>
                <TableCell>
                  <Link href={`/children/${child.id}`} className="font-medium hover:underline text-primary">
                    {child.fullName}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{child.school.name}</div>
                  <div className="text-xs text-muted-foreground">{child.school.dismissalTime}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{child.grade || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {child.routeAssignments[0]?.route.name
                    ? <Badge variant="secondary">{child.routeAssignments[0].route.name}</Badge>
                    : <span className="text-xs text-muted-foreground">Unassigned</span>
                  }
                </TableCell>
                <TableCell>
                  <div className="text-sm">{child.guardianName}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {child.guardianPhone}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {child.specialInstructions && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{child.specialInstructions}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {child.active ? (
                      <>
                        <Link href={`/children/${child.id}/edit`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                        {session?.user.role === "ADMIN" && (
                          <ChildDeleteButton
                            endpoint={`/api/children/${child.id}`}
                            label={child.fullName}
                            description="This will deactivate the child's record. They will no longer appear in active routes."
                          />
                        )}
                      </>
                    ) : (
                      session?.user.role === "ADMIN" && (
                        <>
                          <RestoreButton childId={child.id} childName={child.fullName} />
                          <PermanentDeleteButton childId={child.id} childName={child.fullName} />
                        </>
                      )
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {children.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No children found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
