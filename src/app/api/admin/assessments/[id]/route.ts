import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        report: true,
        organization: {
          select: { name: true },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Cascade delete in correct order due to foreign key constraints
    if (assessment.report) {
      await prisma.reportSuggestion.deleteMany({
        where: { reportId: assessment.report.id },
      });
      await prisma.report.delete({
        where: { id: assessment.report.id },
      });
    }

    await prisma.response.deleteMany({
      where: { assessmentId: params.id },
    });

    await prisma.assessment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Assessment and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}
