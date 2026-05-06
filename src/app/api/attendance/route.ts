import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const childId = searchParams.get("childId");

  const logs = await prisma.attendanceLog.findMany({
    where: {
      ...(date && { date }),
      ...(childId && { childId }),
    },
    include: { child: { include: { school: true, routeAssignments: { where: { active: true }, include: { route: true } } } } },
    orderBy: { child: { fullName: "asc" } },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { childId, date, status, notes, actualPickupTime, actualDropoffTime, dropoffLocation } = body;

  // Only include defined fields in the update so partial updates (e.g. toggling
  // dropoffLocation alone) don't accidentally overwrite status or times.
  const updateData: Record<string, unknown> = { recordedBy: session.user.id };
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (actualPickupTime !== undefined) updateData.actualPickupTime = actualPickupTime;
  if (actualDropoffTime !== undefined) updateData.actualDropoffTime = actualDropoffTime;
  if (dropoffLocation !== undefined) updateData.dropoffLocation = dropoffLocation;

  const log = await prisma.attendanceLog.upsert({
    where: { childId_date: { childId, date } },
    update: updateData,
    create: {
      childId,
      date,
      status: status ?? "", // "" = preference recorded but not yet transported
      notes,
      actualPickupTime,
      actualDropoffTime,
      dropoffLocation,
      recordedBy: session.user.id,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
