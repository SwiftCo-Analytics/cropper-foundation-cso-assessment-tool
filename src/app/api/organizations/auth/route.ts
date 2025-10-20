import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sign } from "jsonwebtoken";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "register") {
      const body = await request.json();
      const { name, email, password } = registerSchema.parse(body);

      const existingOrg = await prisma.organization.findUnique({
        where: { email },
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: "Organization already exists" },
          { status: 400 }
        );
      }

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

      return NextResponse.json({ 
        message: "Organization created successfully. Please check your email to verify your account.",
        emailSent: emailResult.success,
        organization: { id: organization.id, name: organization.name, email: organization.email }
      });
    }

    if (action === "login") {
      const body = await request.json();
      const { email, password } = loginSchema.parse(body);

      const organization = await prisma.organization.findUnique({
        where: { email },
      });

      if (!organization || !organization.password) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const isValidPassword = await compare(password, organization.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Check if email is verified
      if (!organization.emailVerified) {
        return NextResponse.json(
          { error: "Please verify your email address before logging in. Check your email for the verification link." },
          { status: 403 }
        );
      }

      const token = sign(
        { orgId: organization.id },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: "7d" }
      );

      return NextResponse.json({ token, organization: { id: organization.id, name: organization.name, email: organization.email } });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
} 