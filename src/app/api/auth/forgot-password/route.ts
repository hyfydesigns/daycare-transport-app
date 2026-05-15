import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const normalised = (email as string).trim().toLowerCase();

  // Always respond with success to prevent email enumeration
  const user = await prisma.user.findFirst({ where: { email: normalised, active: true } });
  if (!user) return NextResponse.json({ ok: true });

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Generate a secure token valid for 1 hour
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${origin}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail({ to: normalised, userName: user.name, resetUrl });
  } catch {
    // Silently fail — don't leak whether send succeeded
  }

  return NextResponse.json({ ok: true });
}
