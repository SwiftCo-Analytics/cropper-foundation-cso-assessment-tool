import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const acceptInviteSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, password } = acceptInviteSchema.parse(body);

    // Find admin with valid invitation token
    const admin = await prisma.admin.findFirst({
      where: {
        email,
        inviteToken: token,
        inviteExpiry: {
          gt: new Date(), // Token must not be expired
        },
        isInvited: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Update admin to complete setup
    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        isInvited: false,
        inviteToken: null,
        inviteExpiry: null,
        inviteAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Admin account setup completed successfully",
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
      },
    });
  } catch (error) {
    console.error("Error accepting admin invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing invitation token or email" },
        { status: 400 }
      );
    }

    // Verify invitation token
    const admin = await prisma.admin.findFirst({
      where: {
        email,
        inviteToken: token,
        inviteExpiry: {
          gt: new Date(),
        },
        isInvited: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        inviteExpiry: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      admin: {
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Error verifying admin invitation:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation" },
      { status: 500 }
    );
  }
}
