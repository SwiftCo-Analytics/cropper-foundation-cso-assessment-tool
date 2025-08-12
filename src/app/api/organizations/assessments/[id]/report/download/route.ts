import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";

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

    // Create a PDF document
    const doc = new jsPDF();
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.text("CSO Self-Assessment Report", 105, yPosition, { align: "center" });
    yPosition += 15;

    // Add organization info
    doc.setFontSize(14);
    doc.text(`Organization: ${assessment.organization.name}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${assessment.completedAt?.toLocaleDateString() || "N/A"}`, 20, yPosition);
    yPosition += 15;

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
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, 20, yPosition);
      yPosition += 10;

      section.responses.forEach((response) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        const questionText = `Question: ${response.question.text}`;
        const responseText = `Response: ${formatResponseValue(response.value)}`;
        
        // Split long text to fit page width
        const questionLines = doc.splitTextToSize(questionText, 170);
        const responseLines = doc.splitTextToSize(responseText, 170);
        
        doc.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5;
        
        doc.text(responseLines, 20, yPosition);
        yPosition += responseLines.length * 5 + 5;
      });

      yPosition += 10;
    });

    // Add report content if available
    if (assessment.report) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Assessment Report", 20, yPosition);
      yPosition += 10;

      // Add suggestions if available
      if (assessment.report.suggestions && assessment.report.suggestions.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Recommendations:", 20, yPosition);
        yPosition += 10;

        // Group suggestions by priority
        const criticalSuggestions = assessment.report.suggestions.filter(s => s.priority >= 9);
        const highSuggestions = assessment.report.suggestions.filter(s => s.priority >= 7 && s.priority < 9);
        const mediumSuggestions = assessment.report.suggestions.filter(s => s.priority >= 5 && s.priority < 7);
        const lowSuggestions = assessment.report.suggestions.filter(s => s.priority < 5);

        // Helper function to add suggestion with priority label
        const addSuggestionWithPriority = (suggestion: any, priorityLabel: string) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`[${priorityLabel}]`, 20, yPosition);
          yPosition += 8;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          
          // Add context if available
          let context = "";
          if (suggestion.metadata && typeof suggestion.metadata === 'object') {
            const metadata = suggestion.metadata as any;
            if (suggestion.type === 'QUESTION' && metadata.questionText) {
              context = ` (Question: "${metadata.questionText.substring(0, 40)}...")`;
            } else if (suggestion.type === 'SECTION' && metadata.sectionTitle) {
              context = ` (Section: ${metadata.sectionTitle})`;
            } else if (suggestion.type === 'ASSESSMENT' && metadata.overallPercentage !== undefined) {
              context = ` (Overall Score: ${Math.round(metadata.overallPercentage)}%)`;
            }
          }
          
          if (context) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text(context, 25, yPosition);
            yPosition += 6;
          }

          // Add the suggestion text
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const suggestionLines = doc.splitTextToSize(`• ${suggestion.suggestion}`, 170);
          doc.text(suggestionLines, 25, yPosition);
          yPosition += suggestionLines.length * 5 + 8;
        };

        // Add suggestions by priority
        if (criticalSuggestions.length > 0) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Critical Priority:", 20, yPosition);
          yPosition += 8;
          
          criticalSuggestions.forEach(suggestion => {
            addSuggestionWithPriority(suggestion, "Critical");
          });
        }

        if (highSuggestions.length > 0) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("High Priority:", 20, yPosition);
          yPosition += 8;
          
          highSuggestions.forEach(suggestion => {
            addSuggestionWithPriority(suggestion, "High");
          });
        }

        if (mediumSuggestions.length > 0) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Medium Priority:", 20, yPosition);
          yPosition += 8;
          
          mediumSuggestions.forEach(suggestion => {
            addSuggestionWithPriority(suggestion, "Medium");
          });
        }

        if (lowSuggestions.length > 0) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Low Priority:", 20, yPosition);
          yPosition += 8;
          
          lowSuggestions.forEach(suggestion => {
            addSuggestionWithPriority(suggestion, "Low");
          });
        }

        // Add summary
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Recommendations: ${assessment.report.suggestions.length}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Critical: ${criticalSuggestions.length} | High: ${highSuggestions.length} | Medium: ${mediumSuggestions.length} | Low: ${lowSuggestions.length}`, 20, yPosition);
      }

      const reportContent = assessment.report.content as any;
      
      if (reportContent.recommendations) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Additional Recommendations:", 20, yPosition);
        yPosition += 10;

        reportContent.recommendations.forEach((rec: string) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          
          const recommendationLines = doc.splitTextToSize(`• ${rec}`, 170);
          doc.text(recommendationLines, 20, yPosition);
          yPosition += recommendationLines.length * 5 + 5;
        });
      }
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer");

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