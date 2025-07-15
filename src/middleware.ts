import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Debug: Log all cookies
  console.log("[Middleware] All cookies:", request.cookies);

  // Admin routes protection (allow /admin/login without session)
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login"
  ) {
    const session = request.cookies.get("next-auth.session-token");
    // Debug: Log session cookie value
    console.log("[Middleware] next-auth.session-token:", session);

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
}; 