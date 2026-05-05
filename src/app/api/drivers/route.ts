import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const drivers = await prisma.driver.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, password, phone, licenseNumber, licenseExpiry, backgroundCheckStatus, notes } = body;

  const hashedPassword = await bcrypt.hash(password || "driver123", 10);

  const user = await prisma.user.create({
    data: { name, email, hashedPassword, role: "DRIVER", phone },
  });

  const driver = await prisma.driver.create({
    data: {
      userId: user.id,
      licenseNumber,
      licenseExpiry,
      certifications: JSON.stringify([]),
      backgroundCheckStatus: backgroundCheckStatus || "PENDING",
      notes,
    },
    include: { user: true },
  });

  return NextResponse.json(driver, { status: 201 });
}
