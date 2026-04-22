import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signOrganizationToken } from "@/lib/organization-session";

export const dynamic = "force-dynamic";

const wpTokenSchema = z.object({
  email: z.string().email(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  username: z.string().optional(),
});

function getBaseUrl(request: Request): string {
  return process.env.NEXTAUTH_URL || new URL(request.url).origin;
}

function getSafeReturnTo(value: string | null): string {
  if (!value) return "/organization/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/organization/dashboard";
  }
  return value;
}

function getDisplayName(payload: z.infer<typeof wpTokenSchema>): string {
  const fullName = [payload.firstname, payload.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (payload.username) return payload.username;
  return payload.email.split("@")[0];
}

function buildLoginErrorRedirect(
  request: Request,
  errorCode: string
): NextResponse {
  const loginUrl = new URL("/organization/login", getBaseUrl(request));
  loginUrl.searchParams.set("error", errorCode);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ssoToken = url.searchParams.get("ssoToken");
  const returnTo = getSafeReturnTo(url.searchParams.get("returnTo"));
  const wpSharedSecret = process.env.CSOGO_SSO_SHARED_SECRET;

  if (!ssoToken) {
    return buildLoginErrorRedirect(request, "missing_sso_token");
  }

  if (!wpSharedSecret) {
    return buildLoginErrorRedirect(request, "sso_not_configured");
  }

  try {
    const decoded = verify(ssoToken, wpSharedSecret, {
      algorithms: ["HS256"],
    }) as Record<string, unknown>;
    const payload = wpTokenSchema.parse(decoded);

    const provider = "csogo-wordpress";
    const subject = payload.username || payload.email;
    const name = getDisplayName(payload);
    const now = new Date();

    const existingByProvider = await prisma.organization.findFirst({
      where: {
        ssoProvider: provider,
        ssoSubject: subject,
      },
    });

    let organization = existingByProvider;

    if (!organization) {
      const existingByEmail = await prisma.organization.findUnique({
        where: { email: payload.email },
      });

      if (existingByEmail) {
        organization = await prisma.organization.update({
          where: { id: existingByEmail.id },
          data: {
            name: existingByEmail.name || name,
            emailVerified: true,
            ssoProvider: provider,
            ssoSubject: subject,
            ssoLinkedAt: existingByEmail.ssoLinkedAt ?? now,
            ssoLastLoginAt: now,
          },
        });
      } else {
        organization = await prisma.organization.create({
          data: {
            name,
            email: payload.email,
            emailVerified: true,
            ssoProvider: provider,
            ssoSubject: subject,
            ssoLinkedAt: now,
            ssoLastLoginAt: now,
          },
        });
      }
    } else {
      organization = await prisma.organization.update({
        where: { id: organization.id },
        data: {
          emailVerified: true,
          ssoLastLoginAt: now,
          name: organization.name || name,
        },
      });
    }

    const token = signOrganizationToken(organization.id);
    const redirectUrl = new URL("/organization/sso/callback", getBaseUrl(request));
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Organization SSO callback failed:", error);
    return buildLoginErrorRedirect(request, "sso_auth_failed");
  }
}
