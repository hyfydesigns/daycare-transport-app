import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // 1. Gather IDs needed for nested deletes
    const trips = await tx.trip.findMany({
      where: { driverId: id },
      select: { id: true },
    });
    const tripIds = trips.map((t) => t.id);

    const tripStops = await tx.tripStop.findMany({
      where: { tripId: { in: tripIds } },
      select: { id: true },
    });
    const tripStopIds = tripStops.map((ts) => ts.id);

    // 2. Delete trip-stop children
    await tx.tripStopChild.deleteMany({ where: { tripStopId: { in: tripStopIds } } });

    // 3. Delete trip stops
    await tx.tripStop.deleteMany({ where: { tripId: { in: tripIds } } });

    // 4. Nullify tripId on attendance logs (logs belong to children, keep them)
    if (tripIds.length > 0) {
      await tx.attendanceLog.updateMany({
        where: { tripId: { in: tripIds } },
        data: { tripId: null },
      });
    }

    // 5. Delete trips
    await tx.trip.deleteMany({ where: { driverId: id } });

    // 6. Delete driver GPS locations
    await tx.driverLocation.deleteMany({ where: { driverId: id } });

    // 7. Delete direct school assignments
    await tx.driverSchoolAssignment.deleteMany({ where: { driverId: id } });

    // 8. Unassign driver from routes (keep the routes, just clear the driver)
    await tx.route.updateMany({ where: { driverId: id }, data: { driverId: null } });

    // 9. Delete audit logs for this user
    await tx.auditLog.deleteMany({ where: { userId: driver.userId } });

    // 10. Delete the driver record
    await tx.driver.delete({ where: { id } });

    // 11. Delete the user account
    await tx.user.delete({ where: { id: driver.userId } });
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "DRIVER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
