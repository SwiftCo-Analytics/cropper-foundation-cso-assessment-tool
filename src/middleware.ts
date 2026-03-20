import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** NextAuth v4 uses __Secure- prefix when cookies are marked secure (typical on HTTPS). */
function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("__Secure-next-auth.session-token")?.value ??
    request.cookies.get("next-auth.session-token")?.value
  );
}

export function middleware(request: NextRequest) {
  // Admin routes protection (allow login, forgot-password, reset-password without session)
  const adminPublicPaths = ["/admin/login", "/admin/forgot-password", "/admin/reset-password", "/admin/setup"];
  const isAdminPublic = adminPublicPaths.includes(request.nextUrl.pathname);
  if (request.nextUrl.pathname.startsWith("/admin") && !isAdminPublic) {
    const session = getSessionToken(request);

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
