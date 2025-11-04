import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendAdminPasswordResetEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

/**
 * Generate a secure random password
 * Returns a password with uppercase, lowercase, numbers, and special characters
 */
function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Prevent deleting self
    if (params.id === (session.user as any).id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Delete the admin
    await prisma.admin.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Handle password reset action
    if (action === "reset-password") {
      // Prevent resetting own password
      if (params.id === (session.user as any).id) {
        return NextResponse.json(
          { error: "You cannot reset your own password" },
          { status: 400 }
        );
      }

      // Check if admin exists
      const admin = await prisma.admin.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Admin not found" },
          { status: 404 }
        );
      }

      // Generate a new secure password
      const newPassword = generateSecurePassword(16);
      
      // Hash the password
      const hashedPassword = await hash(newPassword, 12);

      // Update the admin's password
      await prisma.admin.update({
        where: { id: params.id },
        data: {
          password: hashedPassword,
        },
      });

      // Get the current admin's name for the email
      const currentAdmin = await prisma.admin.findUnique({
        where: { id: (session.user as any).id },
        select: { name: true },
      });

      // Send password reset email
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/admin/login`;

      const emailResult = await sendAdminPasswordResetEmail({
        name: admin.name,
        email: admin.email,
        loginUrl,
        resetBy: currentAdmin?.name || 'System Administrator',
        newPassword,
      });

      // Return the new password even if email fails (so admin can see it in UI)
      return NextResponse.json({
        message: "Password reset successfully",
        newPassword,
        emailSent: emailResult.success,
        emailError: emailResult.success ? undefined : emailResult.error,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
}
