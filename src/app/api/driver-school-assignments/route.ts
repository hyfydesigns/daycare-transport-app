import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { driverId, schoolId, vehicleId, notes } = await req.json();

  if (!driverId || !schoolId)
    return NextResponse.json({ error: "driverId and schoolId are required" }, { status: 400 });

  const assignment = await prisma.driverSchoolAssignment.create({
    data: {
      driverId,
      schoolId,
      vehicleId: vehicleId || null,
      notes: notes || null,
    },
    include: { school: true, vehicle: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}
