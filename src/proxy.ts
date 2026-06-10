import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Next.js 16 proxy (formerly middleware): redirects unauthenticated
// requests to /login via the `authorized` callback in auth.config.ts.
export default auth;

export const config = {
  // Protect everything except Auth.js routes, static assets, and metadata files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)).*)"],
};
