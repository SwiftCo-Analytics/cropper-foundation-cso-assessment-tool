import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSafeReturnTo(value: string | null): string {
  if (!value) return "/organization/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/organization/dashboard";
  }
  return value;
}

export async function GET(request: Request) {
  const wpSsoAuthUrl = process.env.CSOGO_SSO_AUTH_URL;

  if (!wpSsoAuthUrl) {
    return NextResponse.json(
      { error: "SSO is not configured. Missing CSOGO_SSO_AUTH_URL." },
      { status: 500 }
    );
  }

  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NEXTAUTH_URL || requestUrl.origin;
  const returnTo = getSafeReturnTo(requestUrl.searchParams.get("returnTo"));

  const callbackUrl = new URL("/api/organizations/sso/callback", baseUrl);
  callbackUrl.searchParams.set("returnTo", returnTo);

  const wpRedirectUrl = new URL(wpSsoAuthUrl);
  wpRedirectUrl.searchParams.set("redirect_url", callbackUrl.toString());

  return NextResponse.redirect(wpRedirectUrl);
}
