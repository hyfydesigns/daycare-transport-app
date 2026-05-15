import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: driver sends a GPS ping
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lng, heading, speed } = await req.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const driver = await prisma.driver.findFirst({ where: { userId: session.user.id } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  await prisma.driverLocation.create({
    data: {
      driverId: driver.id,
      lat,
      lng,
      heading: heading ?? null,
      speed: speed ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

// GET: admin fetches the latest location for every active driver
export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drivers = await prisma.driver.findMany({
    where: { active: true, isOnRun: true },
    include: {
      user: { select: { name: true } },
      locations: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      routes: {
        where: { active: true },
        select: { name: true },
        take: 1,
      },
    },
  });

  const result = drivers
    .filter((d) => d.locations.length > 0)
    .map((d) => ({
      driverId: d.id,
      driverName: d.user.name,
      routeName: d.routes[0]?.name ?? null,
      lat: d.locations[0].lat,
      lng: d.locations[0].lng,
      heading: d.locations[0].heading,
      speed: d.locations[0].speed,
      timestamp: d.locations[0].timestamp.toISOString(),
    }));

  return NextResponse.json(result);
}
