import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...body,
      ...(body.year && { year: parseInt(body.year) }),
      ...(body.capacity && { capacity: parseInt(body.capacity) }),
      ...(body.mileage && { mileage: parseInt(body.mileage) }),
    },
  });
  return NextResponse.json(vehicle);
}
