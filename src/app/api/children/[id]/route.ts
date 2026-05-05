import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const child = await prisma.child.findUnique({
    where: { id },
    include: {
      school: true,
      routeAssignments: { where: { active: true }, include: { route: { include: { driver: { include: { user: true } }, vehicle: true } } } },
      attendanceLogs: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(child);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const child = await prisma.child.update({ where: { id }, data: body });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Child",
      entityId: id,
      diff: JSON.stringify(body),
    },
  });

  return NextResponse.json(child);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await prisma.child.update({ where: { id }, data: { active: false } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entity: "Child",
      entityId: id,
    },
  });

  return NextResponse.json({ success: true });
}
