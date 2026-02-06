import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminForgotPasswordEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !admin.password) {
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a reset link." },
        { status: 200 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

    const result = await sendAdminForgotPasswordEmail({
      name: admin.name,
      email: admin.email,
      resetUrl,
    });

    if (!result.success) {
      console.error("Failed to send admin forgot-password email:", result.error);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a reset link.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Admin forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
