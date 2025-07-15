import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };

    // Create a new assessment for the organization
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: decoded.orgId,
        status: "IN_PROGRESS",
        name: `Assessment ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      },
    });

    return NextResponse.json({
      assessmentId: assessment.id,
      status: assessment.status,
    });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
} 