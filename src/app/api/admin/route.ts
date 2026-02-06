import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAdminInviteEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const inviteAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all admins
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isInvited: true,
        inviteExpiry: true,
        inviteAcceptedAt: true,
        createdAt: true,
        invitedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get invited by names
    const adminWithInviterNames = await Promise.all(
      admins.map(async (admin) => {
        if (admin.invitedBy) {
          const inviter = await prisma.admin.findUnique({
            where: { id: admin.invitedBy },
            select: { name: true },
          });
          return {
            ...admin,
            invitedByName: inviter?.name || 'Unknown',
          };
        }
        return {
          ...admin,
          invitedByName: null,
        };
      })
    );

    return NextResponse.json(adminWithInviterNames);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = inviteAdminSchema.parse(body);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: null,
        isInvited: true,
        inviteToken: token,
        inviteExpiry: expires,
        invitedBy: (session.user as any).id,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "";
    const inviteUrl = `${baseUrl}/admin/setup?token=${token}&email=${encodeURIComponent(email)}`;
    const invitedBy = session.user?.name || "An administrator";

    const emailResult = await sendAdminInviteEmail({
      name,
      email,
      inviteUrl,
      invitedBy,
    });

    if (!emailResult.success) {
      console.error("Failed to send admin invite email:", emailResult.error);
      return NextResponse.json(
        { error: "Invitation created but email could not be sent. Please share the setup link manually or try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invitation sent successfully",
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        isInvited: true,
        inviteExpiry: expires.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error inviting admin:", error);
    return NextResponse.json(
      { error: "Failed to invite admin" },
      { status: 500 }
    );
  }
}
