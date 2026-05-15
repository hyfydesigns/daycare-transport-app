import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH: driver starts or ends their run
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isOnRun } = await req.json();
  if (typeof isOnRun !== "boolean") {
    return NextResponse.json({ error: "isOnRun (boolean) is required" }, { status: 400 });
  }

  const driver = await prisma.driver.findFirst({ where: { userId: session.user.id } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const updated = await prisma.driver.update({
    where: { id: driver.id },
    data: { isOnRun },
  });

  return NextResponse.json({ isOnRun: updated.isOnRun });
}
