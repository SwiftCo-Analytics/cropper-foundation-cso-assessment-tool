import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireVerifiedOrganization } from "@/lib/organization-auth";

export const dynamic = 'force-dynamic';

const updateNameSchema = z.object({ name: z.string().min(2) });

export async function GET(request: Request) {
  try {
    const auth = await requireVerifiedOrganization(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: auth.orgId },
      select: {
        id: true,
        name: true,
        email: true,
        assessments: {
          include: {
            responses: {
              select: {
                questionId: true,
                value: true,
              },
            },
            report: {
              select: {
                id: true,
                content: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
      },
      assessments: organization.assessments,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireVerifiedOrganization(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }
    const body = await request.json();
    const { name } = updateNameSchema.parse(body);

    await prisma.organization.update({
      where: { id: auth.orgId },
      data: { name },
    });

    return NextResponse.json({ message: "Name updated successfully", name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }
    console.error("Error updating organization name:", error);
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    );
  }
} 