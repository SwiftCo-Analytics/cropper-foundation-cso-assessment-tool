import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing verification token or email" },
        { status: 400 }
      );
    }

    // Find organization with the verification token and email
    const organization = await prisma.organization.findFirst({
      where: {
        email,
        emailVerifyToken: token,
        emailVerifyExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update organization to mark email as verified
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    // Send welcome email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/organization/login`;

    const emailResult = await sendWelcomeEmail({
      name: organization.name,
      email: organization.email,
      loginUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Still proceed with verification even if welcome email fails
    }

    return NextResponse.json({
      message: "Email verified successfully! You can now log in to your account.",
      success: true,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Email verification failed" },
      { status: 500 }
    );
  }
}
