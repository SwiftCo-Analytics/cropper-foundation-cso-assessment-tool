import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";

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
            report: true,
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

    // Calculate organization statistics
    const totalAssessments = organization.assessments.length;
    const completedAssessments = organization.assessments.filter(a => a.status === "COMPLETED").length;
    const inProgressAssessments = totalAssessments - completedAssessments;
    const totalResponses = organization.assessments.reduce((sum, assessment) => 
      sum + assessment.responses.length, 0
    );
    const completionRate = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0;

    // Group responses by section for analysis
    const sectionAnalysis = new Map<string, {
      sectionId: string;
      sectionTitle: string;
      totalQuestions: number;
      totalResponses: number;
      questions: Map<string, {
        questionId: string;
        questionText: string;
        questionType: string;
        totalResponses: number;
        responseCounts: Map<string, number>;
      }>;
    }>();
    
    organization.assessments.forEach(assessment => {
      assessment.responses.forEach(response => {
        const sectionId = response.question.sectionId;
        const sectionTitle = response.question.section.title;
        
        if (!sectionAnalysis.has(sectionId)) {
          sectionAnalysis.set(sectionId, {
            sectionId,
            sectionTitle,
            totalQuestions: 0,
            totalResponses: 0,
            questions: new Map(),
          });
        }
        
        const section = sectionAnalysis.get(sectionId)!;
        section.totalResponses++;
        
        const questionId = response.question.id;
        if (!section.questions.has(questionId)) {
          section.questions.set(questionId, {
            questionId,
            questionText: response.question.text,
            questionType: response.question.type,
            totalResponses: 0,
            responseCounts: new Map(),
          });
        }
        
        const question = section.questions.get(questionId)!;
        question.totalResponses++;
        
        const value = response.value;
        if (value !== null && value !== undefined && value !== "") {
          const valueStr = String(value);
          question.responseCounts.set(valueStr, (question.responseCounts.get(valueStr) || 0) + 1);
        }
      });
    });

    // Create PDF document using jsPDF
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = 280;
    const margin = 20;
    const pageWidth = 210;
    const centerX = pageWidth / 2;

    // Helper function to add text and handle page breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, x: number = margin, align: 'left' | 'center' | 'right' = 'left') => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      // Handle alignment
      let textX = x;
      if (align === 'center') {
        const textWidth = doc.getTextWidth(text);
        textX = centerX - (textWidth / 2);
      } else if (align === 'right') {
        const textWidth = doc.getTextWidth(text);
        textX = pageWidth - margin - textWidth;
      }
      
      doc.text(text, textX, yPosition);
      yPosition += fontSize + 3;
    };

    // Helper function to add section divider
    const addDivider = () => {
      if (yPosition > pageHeight - 10) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    };

    // Helper function to add bullet points
    const addBulletPoint = (text: string, fontSize: number = 10, indent: number = 10) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.text('•', margin, yPosition);
      doc.text(text, margin + indent, yPosition);
      yPosition += fontSize + 2;
    };

    // Helper function to format question type
    const formatQuestionType = (type: string) => {
      switch (type) {
        case 'TEXT':
          return 'Text';
        case 'NUMBER':
          return 'Number';
        case 'BOOLEAN':
          return 'Yes/No';
        case 'MULTIPLE_CHOICE':
          return 'Multiple Choice';
        case 'SINGLE_CHOICE':
          return 'Single Choice';
        case 'LIKERT_SCALE':
          return 'Likert Scale';
        default:
          return type;
      }
    };

    // Title and header
    addText("CSO Self-Assessment Tool", 24, true, margin, 'center');
    addText("Organization Report", 18, true, margin, 'center');
    yPosition += 5;
    
    // Date and time
    const dateTime = `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    addText(dateTime, 10, false, margin, 'center');
    yPosition += 15;

    // Organization Information
    addText("Organization Information", 16, true, margin, 'center');
    yPosition += 10;
    
    addText(`Name: ${organization.name}`, 12, false);
    addText(`Email: ${organization.email}`, 12, false);
    addText(`Created: ${organization.createdAt.toLocaleDateString()}`, 12, false);
    yPosition += 10;

    // Overview Statistics
    addText("Overview Statistics", 16, true, margin, 'center');
    yPosition += 10;
    
    const stats = [
      { label: "Total Assessments", value: totalAssessments.toString() },
      { label: "Completed Assessments", value: completedAssessments.toString() },
      { label: "In Progress Assessments", value: inProgressAssessments.toString() },
      { label: "Total Responses", value: totalResponses.toString() },
      { label: "Completion Rate", value: `${completionRate.toFixed(1)}%` }
    ];

    stats.forEach((stat) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.label + ":", margin, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.text(stat.value, margin + 80, yPosition);
      yPosition += 8;
    });

    addDivider();

    // Assessment Details
    addText("Assessment Details", 16, true, margin, 'center');
    yPosition += 10;

    organization.assessments.forEach((assessment, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Assessment header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Assessment ${index + 1}`, margin, yPosition);
      yPosition += 8;
      
      // Assessment details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      addBulletPoint(`Status: ${assessment.status}`, 10, 15);
      addBulletPoint(`Created: ${assessment.createdAt.toLocaleDateString()}`, 10, 15);
      if (assessment.completedAt) {
        addBulletPoint(`Completed: ${assessment.completedAt.toLocaleDateString()}`, 10, 15);
      }
      addBulletPoint(`Responses: ${assessment.responses.length}`, 10, 15);
      
      // Add report recommendations if available
      if (assessment.report) {
        const reportContent = assessment.report.content as any;
        if (reportContent.recommendations && reportContent.recommendations.length > 0) {
          addBulletPoint("Recommendations:", 10, 15);
          reportContent.recommendations.forEach((rec: string) => {
            addBulletPoint(rec, 10, 25);
          });
        }
      }
      
      yPosition += 10;
    });

    addDivider();

    // Section Analysis
    addText("Section Analysis", 16, true, margin, 'center');
    yPosition += 10;

    Array.from(sectionAnalysis.values()).forEach((section) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Section title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.sectionTitle, margin, yPosition);
      yPosition += 8;
      
      // Section details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      addBulletPoint(`Total Responses: ${section.totalResponses}`, 10, 15);
      addBulletPoint(`Questions Answered: ${section.questions.size}`, 10, 15);
      
      // Most common responses for this section
      const questionAnalysis = Array.from(section.questions.values())
        .sort((a, b) => b.totalResponses - a.totalResponses)
        .slice(0, 3);
      
      if (questionAnalysis.length > 0) {
        addBulletPoint("Most Answered Questions:", 10, 15);
        questionAnalysis.forEach((question) => {
          const entries = Array.from(question.responseCounts.entries());
          const mostCommon = entries.sort((a, b) => b[1] - a[1])[0];
          
          addBulletPoint(`${question.questionText}`, 10, 25);
          if (mostCommon) {
            addBulletPoint(`Most common: "${mostCommon[0]}" (${mostCommon[1]} times)`, 10, 35);
          }
        });
      }
      
      yPosition += 10;
    });

    addDivider();

    // Response Analysis
    addText("Response Analysis", 16, true, margin, 'center');
    yPosition += 10;

    // Analyze all responses across the organization
    const allResponses = organization.assessments.flatMap(a => a.responses);
    const responseTypes = new Map();
    
    allResponses.forEach(response => {
      const type = response.question.type;
      responseTypes.set(type, (responseTypes.get(type) || 0) + 1);
    });

    addText("Response Types:", 12, true);
    yPosition += 8;
    
    Array.from(responseTypes.entries()).forEach(([type, count]) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }
      
      addBulletPoint(`${formatQuestionType(type)}: ${count} responses`, 10, 15);
    });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${organization.name}-report-${new Date().toISOString().split('T')[0]}.pdf"`,
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