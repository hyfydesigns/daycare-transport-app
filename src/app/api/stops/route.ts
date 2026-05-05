import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { routeId, sequence, type, schoolId, childId, address, lat, lng, estimatedTime, childrenIds } = body;

  const stop = await prisma.routeStop.create({
    data: {
      routeId,
      sequence: parseInt(String(sequence)),
      type,
      schoolId: schoolId || undefined,
      address: address || "",
      lat: parseFloat(String(lat || 0)),
      lng: parseFloat(String(lng || 0)),
      estimatedTime: estimatedTime || undefined,
      childrenIds: childrenIds || (childId ? JSON.stringify([childId]) : "[]"),
    },
  });

  return NextResponse.json(stop, { status: 201 });
}
