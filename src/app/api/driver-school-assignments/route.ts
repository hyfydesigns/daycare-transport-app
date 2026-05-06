import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { driverId, schoolIds, vehicleId, notes } = await req.json();

  if (!driverId || !Array.isArray(schoolIds) || schoolIds.length === 0)
    return NextResponse.json({ error: "driverId and at least one school are required" }, { status: 400 });

  // Find schools already actively assigned so we don't create duplicates
  const existing = await prisma.driverSchoolAssignment.findMany({
    where: { driverId, active: true, schoolId: { in: schoolIds } },
    select: { schoolId: true },
  });
  const existingIds = new Set(existing.map((e) => e.schoolId));
  const newSchoolIds = schoolIds.filter((id: string) => !existingIds.has(id));

  if (newSchoolIds.length === 0)
    return NextResponse.json({ error: "All selected schools are already assigned to this driver." }, { status: 409 });

  const assignments = await prisma.$transaction(
    newSchoolIds.map((schoolId: string) =>
      prisma.driverSchoolAssignment.create({
        data: {
          driverId,
          schoolId,
          vehicleId: vehicleId || null,
          notes: notes || null,
        },
        include: { school: true, vehicle: true },
      })
    )
  );

  return NextResponse.json(assignments, { status: 201 });
}
