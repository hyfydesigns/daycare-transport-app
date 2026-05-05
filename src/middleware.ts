import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use the edge-safe config (no bcrypt/Prisma) for middleware
const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/login")) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Driver can only access driver routes
  const role = req.auth?.user?.role;
  if (
    role === "DRIVER" &&
    !pathname.startsWith("/driver") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/driver", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
