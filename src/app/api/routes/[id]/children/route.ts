import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: routeId } = await params;
  const { childId } = await req.json();

  const assignment = await prisma.routeChildAssignment.upsert({
    where: { childId_routeId: { childId, routeId } },
    update: { active: true },
    create: { childId, routeId },
  });
  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: routeId } = await params;
  const { childId } = await req.json();
  await prisma.routeChildAssignment.updateMany({
    where: { childId, routeId },
    data: { active: false },
  });
  return NextResponse.json({ success: true });
}
