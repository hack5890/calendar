import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, getSession } from "@/lib/server/db";

const PUBLIC_PATHS = new Set(["/login"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? getSession(token) : undefined;

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|ico|svg|webmanifest)$).*)",
  ],
};
