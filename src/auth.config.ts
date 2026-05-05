import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no bcrypt, no Prisma, no Node.js-only modules.
// Used by middleware (Edge Runtime). Full auth.ts extends this.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // populated in auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
