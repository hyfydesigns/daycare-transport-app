import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const routes = await prisma.route.findMany({
    include: {
      driver: { include: { user: true } },
      vehicle: true,
      stops: { orderBy: { sequence: "asc" }, include: { school: true } },
      childAssignments: { where: { active: true }, include: { child: { include: { school: true } } } },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const route = await prisma.route.create({ data: body });
  return NextResponse.json(route, { status: 201 });
}
