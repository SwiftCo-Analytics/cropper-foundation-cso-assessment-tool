import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

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

  // Organization routes protection
  if (request.nextUrl.pathname.startsWith("/organization/dashboard")) {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.redirect(new URL("/organization/login", request.url));
    }

    try {
      verify(token, process.env.NEXTAUTH_SECRET!);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL("/organization/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/organization/dashboard/:path*"],
}; 