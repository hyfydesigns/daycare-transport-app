import { prisma } from "@/lib/prisma";
import { ChildForm } from "@/components/children/child-form";

export default async function NewChildPage() {
  const [schools, routes] = await Promise.all([
    prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.route.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Child</h1>
      <ChildForm schools={schools} routes={routes} />
    </div>
  );
}
