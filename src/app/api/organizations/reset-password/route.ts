import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = schema.parse(body);

    const organization = await prisma.organization.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
