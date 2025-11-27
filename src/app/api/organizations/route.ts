import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

export const dynamic = 'force-dynamic';

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function GET(request: Request) {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        assessments: {
          include: {
            responses: {
              include: {
                question: {
                  include: {
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = createOrganizationSchema.parse(body);

    // Check if organization already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { email },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization already exists" },
        { status: 400 }
      );
    }

    // Generate a random password for the organization
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(password, 12);

    const organization = await prisma.organization.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: true, // Auto-verify email
        emailVerifyToken: null,
        emailVerifyExpiry: null,
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

    // Create authentication token immediately
    const token = sign(
      { orgId: organization.id },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      organizationId: organization.id,
      assessmentId: organization.assessments[0].id,
      token,
      message: "Organization created successfully.",
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email
      }
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
} 