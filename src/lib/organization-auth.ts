import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type OrganizationAuthResult =
  | { orgId: string }
  | { error: { status: number; message: string } };

export async function requireVerifiedOrganization(
  request: Request
): Promise<OrganizationAuthResult> {
  const token = request.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return { error: { status: 401, message: "Unauthorized" } };
  }

  let decoded: { orgId: string };
  try {
    decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };
  } catch {
    return { error: { status: 401, message: "Unauthorized" } };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: decoded.orgId },
    select: { id: true, emailVerified: true },
  });

  if (!organization) {
    return { error: { status: 404, message: "Organization not found" } };
  }

  if (!organization.emailVerified) {
    return {
      error: {
        status: 403,
        message: "Please verify your email address before continuing",
      },
    };
  }

  return { orgId: organization.id };
}
