import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
