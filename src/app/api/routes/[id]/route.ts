import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      driver: { include: { user: true } },
      vehicle: true,
      stops: { orderBy: { sequence: "asc" }, include: { school: true } },
      childAssignments: { where: { active: true }, include: { child: { include: { school: true } } } },
    },
  });
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(route);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const route = await prisma.route.update({ where: { id }, data: body });
  return NextResponse.json(route);
}
