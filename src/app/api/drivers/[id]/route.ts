import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Deactivate driver and their user account, freeing the email for reuse
  await prisma.driver.update({ where: { id }, data: { active: false } });
  await prisma.user.update({
    where: { id: driver.userId },
    data: {
      active: false,
      email: `deleted_${id}_${Date.now()}@removed.invalid`,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, phone, ...driverFields } = body;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (name || phone) {
    await prisma.user.update({
      where: { id: driver.userId },
      data: { ...(name && { name }), ...(phone && { phone }) },
    });
  }

  const updated = await prisma.driver.update({
    where: { id },
    data: driverFields,
    include: { user: true },
  });
  return NextResponse.json(updated);
}
