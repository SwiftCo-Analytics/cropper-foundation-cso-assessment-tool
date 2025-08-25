import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ReportGenerator } from "@/lib/report-generator";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";
import ExcelJS from "exceljs";

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

    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "pdf";

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "IGNITE CSOs";
      workbook.created = new Date();

      // Summary sheet
      const summary = workbook.addWorksheet("Summary");
      summary.addRow(["Assessment Area", "Max", "Actual", "% Achieved", "Rating"]);
      summary.addRows([
        ["Governing Body Accountability", 115, scores.governanceScore, Math.round(scores.governancePercentage) + "%", scores.overallLevel],
        ["Financial Management", 50, scores.financialScore, Math.round(scores.financialPercentage) + "%", ""],
        ["Programme/Project Accountability", 30, scores.programmeScore, Math.round(scores.programmePercentage) + "%", ""],
        ["Human Resource Accountability", 20, scores.hrScore, Math.round(scores.hrPercentage) + "%", ""],
        ["Total", 215, scores.totalScore, Math.round(scores.totalPercentage) + "%", scores.overallLevel]
      ]);

      // Assessment highlights
      const assessSheet = workbook.addWorksheet("Assessment Highlights");
      assessSheet.addRow(["Highlights"]);
      const assessItems = (assessment.report.suggestions || [])
        .filter((s: any) => s.metadata?.section?.toLowerCase?.() === "assessment")
        .map((s) => s.suggestion);
      assessItems.forEach((t) => assessSheet.addRow([t]));

      // Section tabs
      const bySection: Record<string, string[]> = {};
      (assessment.report.suggestions || []).forEach((s: any) => {
        const key = typeof s.metadata?.section === "string" ? s.metadata.section.toLowerCase() : undefined;
        if (!key || key === "assessment") return;
        if (!bySection[key]) bySection[key] = [];
        bySection[key].push(s.suggestion);
      });
      Object.entries(bySection).forEach(([key, items]) => {
        const name = key.charAt(0).toUpperCase() + key.slice(1);
        const sheet = workbook.addWorksheet(`${name}`.slice(0, 31));
        sheet.addRow(["Highlights"]);
        items.forEach((t) => sheet.addRow([t]));
      });

      // Action Plan sheet
      const plan = workbook.addWorksheet("Action Plan");
      plan.addRow(["COMMITMENT", "QUESTION", "ANSWER", "OBJECTIVE TO BE ACHIEVED", "CHANGES OR ACTIONS TO BE TAKEN", "TIME FRAME", "RESPONSIBLE PARTY(IES)", "COMPLIANCE INDICATORS"]);
      plan.addRow(["Example: Commitment 1: Governance", "Does the organization have a crisis communication protocol?", "No formal protocol exists", "Establish a clear and tested crisis communication protocol", "1. Draft protocol with board input\n2. Conduct simulation exercise", "Q4 2025", "Executive Director, Board Secretary", "Protocol document approved and simulation completed"]);
      for (let i = 0; i < 6; i++) plan.addRow(["", "", "", "", "", "", "", ""]);

      const buffer = await workbook.xlsx.writeBuffer();
      const response = new NextResponse(buffer as any);
      response.headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      response.headers.set("Content-Disposition", `attachment; filename="IGNITE-CSOs-Report-${assessment.organization.name}-${new Date().toISOString().split('T')[0]}.xlsx"`);
      return response;
    }

    // Default: PDF
    const reportGenerator = new ReportGenerator();
    const reportData = {
      organization: assessment.organization,
      assessment: assessment,
      report: assessment.report,
      scores: scores,
      suggestions: assessment.report.suggestions || []
    };
    const pdfBuffer = reportGenerator.generateReport(reportData);
    const response = new NextResponse(pdfBuffer);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set("Content-Disposition", `attachment; filename="IGNITE-CSOs-Report-${assessment.organization.name}-${new Date().toISOString().split('T')[0]}.pdf"`);
    return response;
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
} 