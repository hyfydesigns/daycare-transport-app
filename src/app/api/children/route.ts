import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const schoolId = searchParams.get("schoolId") || undefined;
  const active = searchParams.get("active");

  const children = await prisma.child.findMany({
    where: {
      ...(search && { fullName: { contains: search } }),
      ...(schoolId && { schoolId }),
      ...(active !== null && active !== "" && { active: active === "true" }),
    },
    include: {
      school: true,
      routeAssignments: { where: { active: true }, include: { route: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(children);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const child = await prisma.child.create({ data: body });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entity: "Child",
      entityId: child.id,
      diff: JSON.stringify(body),
    },
  });

  return NextResponse.json(child, { status: 201 });
}
