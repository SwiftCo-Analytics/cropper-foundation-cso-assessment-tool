import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
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
    const { name, email, password } = createAdminSchema.parse(body);

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

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create admin directly (no invitation flow)
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isInvited: false,
        inviteToken: null,
        inviteExpiry: null,
        invitedBy: (session.user as any).id,
        inviteAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        isInvited: false,
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
