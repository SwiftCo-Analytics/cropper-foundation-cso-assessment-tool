import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };
    const body = await request.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id: decoded.orgId },
    });

    if (!organization || !organization.password) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const valid = await compare(currentPassword, organization.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);
    await prisma.organization.update({
      where: { id: organization.id },
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
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
