import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Admin routes protection (allow login, forgot-password, reset-password without session)
  const adminPublicPaths = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  const isAdminPublic = adminPublicPaths.includes(request.nextUrl.pathname);
  if (request.nextUrl.pathname.startsWith("/admin") && !isAdminPublic) {
    const session = request.cookies.get("next-auth.session-token")?.value;

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
