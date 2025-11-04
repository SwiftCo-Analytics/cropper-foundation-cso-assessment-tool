import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuggestionEngine } from "@/lib/suggestion-engine";
import { hash } from "bcryptjs";
import { sendOrganizationPasswordResetEmail } from "@/lib/email";

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        assessments: {
          include: {
            responses: {
              include: {
                question: {
                  include: {
                    section: true,
                  },
                },
              },
            },
            report: {
              include: {
                suggestions: {
                  orderBy: { priority: 'desc' }
                }
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Auto-generate suggestions for completed assessments that don't have suggestions
    for (const assessment of organization.assessments) {
      if (assessment.status === "COMPLETED") {
        const hasSuggestions = assessment.report?.suggestions && assessment.report.suggestions.length > 0;
        if (!hasSuggestions) {
          try {
            console.log(`Auto-generating suggestions for completed assessment ${assessment.id}`);
            await SuggestionEngine.generateSuggestions(assessment.id);
          } catch (error) {
            console.error(`Error auto-generating suggestions for assessment ${assessment.id}:`, error);
            // Continue with other assessments even if one fails
          }
        }
      }
    }

    // Re-fetch organization with updated suggestions
    const updatedOrganization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        assessments: {
          include: {
            responses: {
              include: {
                question: {
                  include: {
                    section: true,
                  },
                },
              },
            },
            report: {
              include: {
                suggestions: {
                  orderBy: { priority: 'desc' }
                }
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json(updatedOrganization || organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
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
      // Check if organization exists
      const organization = await prisma.organization.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }

      // Generate a new secure password
      const newPassword = generateSecurePassword(16);
      
      // Hash the password
      const hashedPassword = await hash(newPassword, 12);

      // Update the organization's password
      await prisma.organization.update({
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
      const loginUrl = `${baseUrl}/organization/login`;

      const emailResult = await sendOrganizationPasswordResetEmail({
        name: organization.name,
        email: organization.email,
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
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
} 