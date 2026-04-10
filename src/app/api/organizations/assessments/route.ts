import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVerifiedOrganization } from "@/lib/organization-auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = await requireVerifiedOrganization(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    // Create a new assessment for the organization
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: auth.orgId,
        status: "IN_PROGRESS",
        name: `Assessment ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      },
    });

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        status: assessment.status,
      },
    });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
} 