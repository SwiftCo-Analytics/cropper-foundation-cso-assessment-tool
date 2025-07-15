import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = createOrganizationSchema.parse(body);

    const organization = await prisma.organization.create({
      data: {
        name,
        email,
        assessments: {
          create: {
            status: "IN_PROGRESS",
          },
        },
      },
      include: {
        assessments: true,
      },
    });

    return NextResponse.json({
      organizationId: organization.id,
      assessmentId: organization.assessments[0].id,
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
} 