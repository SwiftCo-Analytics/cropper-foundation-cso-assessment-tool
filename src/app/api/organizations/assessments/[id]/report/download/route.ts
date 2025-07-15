import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

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
        report: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Create a PDF document
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Add content to the PDF
    doc
      .fontSize(20)
      .text("CSO Self-Assessment Report", { align: "center" })
      .moveDown();

    doc
      .fontSize(14)
      .text(`Organization: ${assessment.organization.name}`)
      .text(`Date: ${assessment.completedAt?.toLocaleDateString() || "N/A"}`)
      .moveDown();

    // Group responses by section
    const sectionResponses = assessment.responses.reduce((acc, response) => {
      const sectionId = response.question.sectionId;
      if (!acc[sectionId]) {
        acc[sectionId] = {
          title: response.question.section.title,
          responses: [],
        };
      }
      acc[sectionId].responses.push(response);
      return acc;
    }, {} as Record<string, { title: string; responses: typeof assessment.responses }>);

    // Add sections and responses
    Object.values(sectionResponses).forEach((section) => {
      doc
        .fontSize(16)
        .text(section.title)
        .moveDown();

      section.responses.forEach((response) => {
        doc
          .fontSize(12)
          .text(`Question: ${response.question.text}`)
          .text(`Response: ${formatResponseValue(response.value)}`)
          .moveDown(0.5);
      });

      doc.moveDown();
    });

    // Add report content if available
    if (assessment.report) {
      doc
        .fontSize(16)
        .text("Assessment Report")
        .moveDown();

      const reportContent = assessment.report.content as any;
      
      if (reportContent.recommendations) {
        doc
          .fontSize(14)
          .text("Recommendations:")
          .moveDown(0.5);

        reportContent.recommendations.forEach((rec: string) => {
          doc
            .fontSize(12)
            .text(`• ${rec}`)
            .moveDown(0.5);
        });
      }
    }

    // Finalize the PDF
    doc.end();

    // Combine chunks into a single buffer
    const pdfBuffer = Buffer.concat(chunks);

    // Create and return the response
    const response = new NextResponse(pdfBuffer);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="assessment-report-${assessment.id}.pdf"`
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

function formatResponseValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
} 