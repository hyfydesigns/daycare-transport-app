import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicles = await prisma.vehicle.findMany({ orderBy: { identifier: "asc" } });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const vehicle = await prisma.vehicle.create({ data: { ...body, year: parseInt(body.year), capacity: parseInt(body.capacity), mileage: body.mileage ? parseInt(body.mileage) : undefined } });
  return NextResponse.json(vehicle, { status: 201 });
}
