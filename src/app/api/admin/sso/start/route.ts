import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSafeReturnTo(value: string | null): string {
  if (!value) return "/admin/dashboard";
  if (!value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin/dashboard";
  }
  return value;
}

export async function GET(request: Request) {
  const wpSsoAuthUrl = process.env.CSOGO_SSO_AUTH_URL;
  if (!wpSsoAuthUrl) {
    const loginUrl = new URL("/admin/login", new URL(request.url).origin);
    loginUrl.searchParams.set("error", "sso_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NEXTAUTH_URL || requestUrl.origin;
  const returnTo = getSafeReturnTo(requestUrl.searchParams.get("returnTo"));

  const callbackUrl = new URL("/admin/sso/callback", baseUrl);
  callbackUrl.searchParams.set("returnTo", returnTo);

  const wpRedirectUrl = new URL(wpSsoAuthUrl);
  wpRedirectUrl.searchParams.set("redirect_url", callbackUrl.toString());

  return NextResponse.redirect(wpRedirectUrl);
}
