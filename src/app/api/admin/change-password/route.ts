import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || !admin.password) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const valid = await compare(currentPassword, admin.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Admin change password error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
