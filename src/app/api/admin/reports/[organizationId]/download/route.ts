import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportGenerator } from "@/lib/report-generator";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the specific organization with all its assessments and responses
    const organization = await prisma.organization.findUnique({
      where: {
        id: params.organizationId,
      },
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
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get the most recent completed assessment
    const latestAssessment = organization.assessments
      .filter(a => a.status === "COMPLETED" && a.report)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    if (!latestAssessment || !latestAssessment.report) {
      return NextResponse.json(
        { error: "No completed assessment report found for this organization" },
        { status: 404 }
      );
    }

    // Calculate CSO scores
    const scores = CSOScoreCalculator.calculateCSOScores(latestAssessment.responses);

    // Generate the comprehensive report
    const reportGenerator = new ReportGenerator();
    const reportData = {
      organization: organization,
      assessment: latestAssessment,
      report: latestAssessment.report,
      scores: scores,
      suggestions: latestAssessment.report.suggestions || []
    };

    const pdfBuffer = reportGenerator.generateReport(reportData);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="IGNITE-CSOs-Admin-Report-${organization.name}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating organization report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
} 