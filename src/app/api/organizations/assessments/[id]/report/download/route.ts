import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ReportGenerator } from "@/lib/report-generator";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: params.id,
        organizationId: decoded.orgId,
      },
      include: {
        organization: true,
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
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    if (!assessment.report) {
      return NextResponse.json(
        { error: "Assessment report not found" },
        { status: 404 }
      );
    }

    // Calculate CSO scores
    const scores = CSOScoreCalculator.calculateCSOScores(assessment.responses);

    // Generate the comprehensive report
    const reportGenerator = new ReportGenerator();
    const reportData = {
      organization: assessment.organization,
      assessment: assessment,
      report: assessment.report,
      scores: scores,
      suggestions: assessment.report.suggestions || []
    };

    const pdfBuffer = reportGenerator.generateReport(reportData);

    // Create and return the response
    const response = new NextResponse(pdfBuffer);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="IGNITE-CSOs-Report-${assessment.organization.name}-${new Date().toISOString().split('T')[0]}.pdf"`
    );

    return response;
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
} 