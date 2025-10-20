import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

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

    // Generate verification token and expiry
    const emailVerifyToken = randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const organization = await prisma.organization.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
        emailVerifyToken,
        emailVerifyExpiry,
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

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/organizations/verify-email?token=${emailVerifyToken}&email=${encodeURIComponent(email)}`;

    const emailResult = await sendVerificationEmail({
      name: organization.name,
      email: organization.email,
      verificationUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success but log the error
    }

    // Create authentication token (but they'll need to verify email to actually use it)
    const token = sign(
      { orgId: organization.id },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      organizationId: organization.id,
      assessmentId: organization.assessments[0].id,
      token,
      emailSent: emailResult.success,
      message: "Organization created successfully. Please check your email to verify your account.",
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