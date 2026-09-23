import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const original = await prisma.child.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Strip DB-managed fields and create a fresh copy
  const { id: _id, createdAt: _c, updatedAt: _u, ...fields } = original;

  const copy = await prisma.child.create({
    data: {
      ...fields,
      fullName: `Copy of ${original.fullName}`,
      active: true,
    },
  });

  try {
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", entity: "Child", entityId: copy.id,
              diff: JSON.stringify({ duplicatedFrom: id }) },
    });
  } catch { /* non-critical */ }

  return NextResponse.json(copy, { status: 201 });
}
