import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendWelcomeEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";

/** Generate a secure random temp password like "Tr4x!9Kp2m" */
function generateTempPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  const bytes = crypto.randomBytes(length + 4);
  let result =
    upper[bytes[0] % upper.length] +
    lower[bytes[1] % lower.length] +
    digits[bytes[2] % digits.length] +
    special[bytes[3] % special.length];

  for (let i = 4; i < length; i++) {
    result += all[bytes[i] % all.length];
  }

  // Shuffle using Fisher-Yates on the char array
  const arr = result.split("");
  const shuffleBytes = crypto.randomBytes(arr.length);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

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
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, licenseNumber, licenseExpiry, backgroundCheckStatus, notes } = body;

  // Generate a secure temporary password (ignore any password sent from the form)
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

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

  // Send welcome email (non-blocking — don't fail driver creation if email fails)
  try {
    const orgName = await getSetting("orgName", "Sunshine Daycare");
    const loginUrl =
      process.env.NEXTAUTH_URL ??
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/login`
        : "http://localhost:3000/login";

    await sendWelcomeEmail({
      to: email,
      driverName: name,
      tempPassword,
      loginUrl,
      orgName,
    });
  } catch (err) {
    console.error("[welcome-email] Failed to send:", err);
  }

  return NextResponse.json(driver, { status: 201 });
}
