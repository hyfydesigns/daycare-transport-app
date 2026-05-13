import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendWelcomeEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";

function generateTempPassword(length = 16): string {
  const upper  = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower  = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all    = upper + lower + digits;
  const bytes  = crypto.randomBytes(length + 3);
  let result   =
    upper [bytes[0] % upper.length]  +
    lower [bytes[1] % lower.length]  +
    digits[bytes[2] % digits.length];
  for (let i = 3; i < length; i++) result += all[bytes[i] % all.length];
  const arr = result.split("");
  const sb  = crypto.randomBytes(arr.length);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = sb[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function getLoginUrl(): string {
  if (process.env.NEXTAUTH_URL) return `${process.env.NEXTAUTH_URL}/login`;
  if (process.env.VERCEL_URL)   return `https://${process.env.VERCEL_URL}/login`;
  return "http://localhost:3000/login";
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate a new temp password and update the account
  const tempPassword   = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: driver.userId }, data: { hashedPassword } });

  const orgName  = await getSetting("orgName", "DaycareRide");
  const loginUrl = getLoginUrl();

  try {
    await sendWelcomeEmail({
      to: driver.user.email,
      driverName: driver.user.name,
      tempPassword,
      loginUrl,
      orgName,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const emailError = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, emailError }, { status: 500 });
  }
}
