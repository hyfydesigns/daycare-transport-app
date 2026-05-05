import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChildForm } from "@/components/children/child-form";

export const dynamic = "force-dynamic";

export default async function EditChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [child, schools, routes] = await Promise.all([
    prisma.child.findUnique({
      where: { id },
      include: { routeAssignments: { where: { active: true }, take: 1 } },
    }),
    prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.route.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!child) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit — {child.fullName}</h1>
      <ChildForm
        schools={schools}
        routes={routes}
        defaultValues={{
          id: child.id,
          fullName: child.fullName,
          grade: child.grade || "",
          dateOfBirth: child.dateOfBirth || "",
          schoolId: child.schoolId,
          homeAddress: child.homeAddress,
          guardianName: child.guardianName,
          guardianPhone: child.guardianPhone,
          guardianEmail: child.guardianEmail,
          guardianRelation: child.guardianRelation,
          emergencyName: child.emergencyName || "",
          emergencyPhone: child.emergencyPhone || "",
          emergencyRelation: child.emergencyRelation || "",
          specialInstructions: child.specialInstructions || "",
          routeId: child.routeAssignments[0]?.routeId || "",
        }}
      />
    </div>
  );
}
