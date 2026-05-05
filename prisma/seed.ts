import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@sunshinedc.com" },
    update: {},
    create: {
      email: "admin@sunshinedc.com",
      hashedPassword: adminHash,
      role: "ADMIN",
      name: "Admin User",
      phone: "(555) 100-2000",
    },
  });

  // Office staff user
  const staffHash = await bcrypt.hash("staff123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "office@sunshinedc.com" },
    update: {},
    create: {
      email: "office@sunshinedc.com",
      hashedPassword: staffHash,
      role: "OFFICE_STAFF",
      name: "Jane Office",
      phone: "(555) 100-2001",
    },
  });

  // Driver users
  const driver1Hash = await bcrypt.hash("driver123", 10);
  const driverUser1 = await prisma.user.upsert({
    where: { email: "john@sunshinedc.com" },
    update: {},
    create: {
      email: "john@sunshinedc.com",
      hashedPassword: driver1Hash,
      role: "DRIVER",
      name: "John Smith",
      phone: "(555) 201-3001",
    },
  });

  const driver2Hash = await bcrypt.hash("driver123", 10);
  const driverUser2 = await prisma.user.upsert({
    where: { email: "maria@sunshinedc.com" },
    update: {},
    create: {
      email: "maria@sunshinedc.com",
      hashedPassword: driver2Hash,
      role: "DRIVER",
      name: "Maria Garcia",
      phone: "(555) 201-3002",
    },
  });

  // Vehicles
  const van1 = await prisma.vehicle.upsert({
    where: { identifier: "Van 1" },
    update: {},
    create: {
      identifier: "Van 1",
      make: "Ford",
      model: "Transit",
      year: 2022,
      licensePlate: "ABC-1234",
      capacity: 12,
      status: "ACTIVE",
      mileage: 24500,
      insuranceExpiry: "2026-12-31",
    },
  });

  const busA = await prisma.vehicle.upsert({
    where: { identifier: "Bus A" },
    update: {},
    create: {
      identifier: "Bus A",
      make: "Blue Bird",
      model: "Vision",
      year: 2021,
      licensePlate: "XYZ-5678",
      capacity: 20,
      status: "ACTIVE",
      mileage: 38200,
      insuranceExpiry: "2026-11-30",
    },
  });

  // Drivers
  const driver1 = await prisma.driver.upsert({
    where: { userId: driverUser1.id },
    update: {},
    create: {
      userId: driverUser1.id,
      licenseNumber: "DL-1234567",
      licenseExpiry: "2027-08-15",
      certifications: JSON.stringify(["CDL", "First Aid", "CPR"]),
      backgroundCheckStatus: "CLEARED",
      backgroundCheckDate: "2025-01-10",
      active: true,
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { userId: driverUser2.id },
    update: {},
    create: {
      userId: driverUser2.id,
      licenseNumber: "DL-7654321",
      licenseExpiry: "2026-11-20",
      certifications: JSON.stringify(["CDL", "First Aid"]),
      backgroundCheckStatus: "CLEARED",
      backgroundCheckDate: "2025-03-05",
      active: true,
    },
  });

  // Schools
  const oakElem = await prisma.school.upsert({
    where: { id: "school-oak" },
    update: {},
    create: {
      id: "school-oak",
      name: "Oak Elementary",
      address: "100 Oak Street, Springfield",
      lat: 37.3382,
      lng: -121.8863,
      dismissalTime: "15:15",
      contactPerson: "Principal Davis",
      contactPhone: "(555) 400-1001",
    },
  });

  const pineElem = await prisma.school.upsert({
    where: { id: "school-pine" },
    update: {},
    create: {
      id: "school-pine",
      name: "Pine Elementary",
      address: "200 Pine Avenue, Springfield",
      lat: 37.3412,
      lng: -121.8921,
      dismissalTime: "15:30",
      contactPerson: "Principal Martinez",
      contactPhone: "(555) 400-1002",
    },
  });

  const maplewoodMiddle = await prisma.school.upsert({
    where: { id: "school-maple" },
    update: {},
    create: {
      id: "school-maple",
      name: "Maplewood Middle",
      address: "300 Maple Blvd, Springfield",
      lat: 37.3350,
      lng: -121.8800,
      dismissalTime: "14:45",
      contactPerson: "Principal Lee",
      contactPhone: "(555) 400-1003",
    },
  });

  // Routes
  const routeA = await prisma.route.upsert({
    where: { code: "ROUTE-A" },
    update: {},
    create: {
      code: "ROUTE-A",
      name: "Route A",
      driverId: driver1.id,
      vehicleId: van1.id,
      activeDays: "MON,TUE,WED,THU,FRI",
    },
  });

  const routeB = await prisma.route.upsert({
    where: { code: "ROUTE-B" },
    update: {},
    create: {
      code: "ROUTE-B",
      name: "Route B",
      driverId: driver2.id,
      vehicleId: busA.id,
      activeDays: "MON,TUE,WED,THU,FRI",
    },
  });

  // Children
  const children = [
    {
      id: "child-ava",
      fullName: "Ava Rodriguez",
      grade: "K",
      schoolId: oakElem.id,
      homeAddress: "123 Maple St, Springfield",
      homeLat: 37.3360,
      homeLng: -121.8870,
      guardianName: "Sarah Rodriguez",
      guardianPhone: "(555) 201-1234",
      guardianEmail: "sarah.rodriguez@email.com",
      guardianRelation: "Mother",
      specialInstructions: "Peanut allergy (EpiPen in backpack). Requires booster seat.",
      routeId: routeA.id,
    },
    {
      id: "child-mia",
      fullName: "Mia Kim",
      grade: "1st",
      schoolId: oakElem.id,
      homeAddress: "456 Elm Ave, Springfield",
      homeLat: 37.3390,
      homeLng: -121.8890,
      guardianName: "Jin Kim",
      guardianPhone: "(555) 512-9090",
      guardianEmail: "jin.kim@email.com",
      guardianRelation: "Father",
      routeId: routeA.id,
    },
    {
      id: "child-liam",
      fullName: "Liam Torres",
      grade: "2nd",
      schoolId: pineElem.id,
      homeAddress: "789 Oak Blvd, Springfield",
      homeLat: 37.3420,
      homeLng: -121.8930,
      guardianName: "Mike Torres",
      guardianPhone: "(555) 341-5678",
      guardianEmail: "mike.torres@email.com",
      guardianRelation: "Father",
      routeId: routeA.id,
    },
    {
      id: "child-noah",
      fullName: "Noah Patel",
      grade: "2nd",
      schoolId: pineElem.id,
      homeAddress: "321 Cedar Ln, Springfield",
      homeLat: 37.3400,
      homeLng: -121.8910,
      guardianName: "Priya Patel",
      guardianPhone: "(555) 678-3421",
      guardianEmail: "priya.patel@email.com",
      guardianRelation: "Mother",
      routeId: routeA.id,
    },
    {
      id: "child-emma",
      fullName: "Emma Johnson",
      grade: "3rd",
      schoolId: maplewoodMiddle.id,
      homeAddress: "654 Birch St, Springfield",
      homeLat: 37.3370,
      homeLng: -121.8840,
      guardianName: "Tom Johnson",
      guardianPhone: "(555) 789-0011",
      guardianEmail: "tom.johnson@email.com",
      guardianRelation: "Father",
      routeId: routeB.id,
    },
    {
      id: "child-oliver",
      fullName: "Oliver Chen",
      grade: "1st",
      schoolId: oakElem.id,
      homeAddress: "987 Willow Way, Springfield",
      homeLat: 37.3345,
      homeLng: -121.8855,
      guardianName: "Lisa Chen",
      guardianPhone: "(555) 234-5678",
      guardianEmail: "lisa.chen@email.com",
      guardianRelation: "Mother",
      specialInstructions: "Must be picked up by listed guardians only. No others.",
      routeId: routeB.id,
    },
    {
      id: "child-sophia",
      fullName: "Sophia Martinez",
      grade: "K",
      schoolId: pineElem.id,
      homeAddress: "147 Spruce Ave, Springfield",
      homeLat: 37.3430,
      homeLng: -121.8950,
      guardianName: "Carlos Martinez",
      guardianPhone: "(555) 456-7890",
      guardianEmail: "carlos.martinez@email.com",
      guardianRelation: "Father",
      routeId: routeB.id,
    },
    {
      id: "child-james",
      fullName: "James Wilson",
      grade: "2nd",
      schoolId: maplewoodMiddle.id,
      homeAddress: "258 Aspen Ct, Springfield",
      homeLat: 37.3355,
      homeLng: -121.8820,
      guardianName: "Rachel Wilson",
      guardianPhone: "(555) 567-8901",
      guardianEmail: "rachel.wilson@email.com",
      guardianRelation: "Mother",
      routeId: routeB.id,
    },
  ];

  for (const { routeId, ...childData } of children) {
    const child = await prisma.child.upsert({
      where: { id: childData.id },
      update: {},
      create: childData,
    });

    await prisma.routeChildAssignment.upsert({
      where: { childId_routeId: { childId: child.id, routeId } },
      update: {},
      create: { childId: child.id, routeId },
    });
  }

  // Route A stops
  const stopAPickupOak = await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      sequence: 1,
      type: "PICKUP",
      schoolId: oakElem.id,
      address: oakElem.address,
      lat: oakElem.lat,
      lng: oakElem.lng,
      estimatedTime: "15:20",
      childrenIds: JSON.stringify(["child-ava", "child-mia"]),
    },
  });

  const stopAPickupPine = await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      sequence: 2,
      type: "PICKUP",
      schoolId: pineElem.id,
      address: pineElem.address,
      lat: pineElem.lat,
      lng: pineElem.lng,
      estimatedTime: "15:38",
      childrenIds: JSON.stringify(["child-liam", "child-noah"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      sequence: 3,
      type: "DROPOFF",
      address: "123 Maple St, Springfield",
      lat: 37.3360,
      lng: -121.8870,
      estimatedTime: "15:52",
      childrenIds: JSON.stringify(["child-ava"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      sequence: 4,
      type: "DROPOFF",
      address: "456 Elm Ave, Springfield",
      lat: 37.3390,
      lng: -121.8890,
      estimatedTime: "15:58",
      childrenIds: JSON.stringify(["child-mia"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      sequence: 5,
      type: "DROPOFF",
      address: "789 Oak Blvd, Springfield",
      lat: 37.3420,
      lng: -121.8930,
      estimatedTime: "16:08",
      childrenIds: JSON.stringify(["child-liam"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      sequence: 6,
      type: "DROPOFF",
      address: "321 Cedar Ln, Springfield",
      lat: 37.3400,
      lng: -121.8910,
      estimatedTime: "16:15",
      childrenIds: JSON.stringify(["child-noah"]),
    },
  });

  // Route B stops
  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 1,
      type: "PICKUP",
      schoolId: maplewoodMiddle.id,
      address: maplewoodMiddle.address,
      lat: maplewoodMiddle.lat,
      lng: maplewoodMiddle.lng,
      estimatedTime: "14:50",
      childrenIds: JSON.stringify(["child-emma", "child-james"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 2,
      type: "PICKUP",
      schoolId: oakElem.id,
      address: oakElem.address,
      lat: oakElem.lat,
      lng: oakElem.lng,
      estimatedTime: "15:20",
      childrenIds: JSON.stringify(["child-oliver"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 3,
      type: "PICKUP",
      schoolId: pineElem.id,
      address: pineElem.address,
      lat: pineElem.lat,
      lng: pineElem.lng,
      estimatedTime: "15:35",
      childrenIds: JSON.stringify(["child-sophia"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 4,
      type: "DROPOFF",
      address: "654 Birch St, Springfield",
      lat: 37.3370,
      lng: -121.8840,
      estimatedTime: "15:50",
      childrenIds: JSON.stringify(["child-emma"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 5,
      type: "DROPOFF",
      address: "987 Willow Way, Springfield",
      lat: 37.3345,
      lng: -121.8855,
      estimatedTime: "15:58",
      childrenIds: JSON.stringify(["child-oliver"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 6,
      type: "DROPOFF",
      address: "147 Spruce Ave, Springfield",
      lat: 37.3430,
      lng: -121.8950,
      estimatedTime: "16:08",
      childrenIds: JSON.stringify(["child-sophia"]),
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: routeB.id,
      sequence: 7,
      type: "DROPOFF",
      address: "258 Aspen Ct, Springfield",
      lat: 37.3355,
      lng: -121.8820,
      estimatedTime: "16:16",
      childrenIds: JSON.stringify(["child-james"]),
    },
  });

  // Sample attendance logs for this week
  const today = new Date();
  const getDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const allChildren = await prisma.child.findMany();
  const statuses = ["TRANSPORTED", "TRANSPORTED", "TRANSPORTED", "PARENT_PICKUP_EARLY", "NO_SCHOOL", "ABSENT"];

  for (let day = 4; day >= 0; day--) {
    const date = getDate(day);
    for (const child of allChildren) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await prisma.attendanceLog.upsert({
        where: { childId_date: { childId: child.id, date } },
        update: {},
        create: {
          childId: child.id,
          date,
          status,
          recordedBy: admin.id,
          actualPickupTime: status === "TRANSPORTED" ? "15:22" : undefined,
          actualDropoffTime: status === "TRANSPORTED" ? "15:51" : undefined,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log("Login credentials:");
  console.log("  Admin:  admin@sunshinedc.com / admin123");
  console.log("  Staff:  office@sunshinedc.com / staff123");
  console.log("  Driver: john@sunshinedc.com / driver123");
  console.log("  Driver: maria@sunshinedc.com / driver123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
