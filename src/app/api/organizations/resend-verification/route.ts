import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = resendSchema.parse(body);

    // Find the organization
    const organization = await prisma.organization.findUnique({
      where: { email },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (organization.emailVerified) {
      return NextResponse.json(
        { error: "Email address is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token and expiry
    const emailVerifyToken = randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update organization with new token
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        emailVerifyToken,
        emailVerifyExpiry,
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
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification email sent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
