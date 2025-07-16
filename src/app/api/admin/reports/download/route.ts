import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all organizations with their assessments and responses
    const organizations = await prisma.organization.findMany({
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
          },
        },
      },
    });

    // Get all sections and questions for analysis
    const sections = await prisma.section.findMany({
      include: {
        questions: {
          include: {
            responses: true,
          },
        },
      },
    });

    // Calculate overall statistics
    const totalOrganizations = organizations.length;
    const totalAssessments = organizations.reduce((sum, org) => sum + org.assessments.length, 0);
    const completedAssessments = organizations.reduce((sum, org) => 
      sum + org.assessments.filter(a => a.status === "COMPLETED").length, 0
    );
    const inProgressAssessments = totalAssessments - completedAssessments;
    const totalResponses = organizations.reduce((sum, org) => 
      sum + org.assessments.reduce((aSum, assessment) => 
        aSum + assessment.responses.length, 0
      ), 0
    );

    // Calculate completion rate
    const completionRate = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0;

    // Get most active organizations
    const mostActiveOrganizations = organizations
      .map(org => ({
        id: org.id,
        name: org.name,
        email: org.email,
        assessmentCount: org.assessments.length,
        completedCount: org.assessments.filter(a => a.status === "COMPLETED").length,
        responseCount: org.assessments.reduce((sum, a) => sum + a.responses.length, 0),
      }))
      .sort((a, b) => b.assessmentCount - a.assessmentCount)
      .slice(0, 10);

    // Analyze most common responses
    const responseAnalysis = new Map();
    
    organizations.forEach(org => {
      org.assessments.forEach(assessment => {
        assessment.responses.forEach(response => {
          const questionId = response.question.id;
          const questionText = response.question.text;
          const questionType = response.question.type;
          const sectionTitle = response.question.section.title;
          
          if (!responseAnalysis.has(questionId)) {
            responseAnalysis.set(questionId, {
              questionId,
              questionText,
              questionType,
              sectionTitle,
              totalResponses: 0,
              responseCounts: new Map(),
              averageScore: 0,
              scores: [],
            });
          }
          
          const analysis = responseAnalysis.get(questionId);
          analysis.totalResponses++;
          
          const value = response.value;
          if (value !== null && value !== undefined && value !== "") {
            const valueStr = String(value);
            analysis.responseCounts.set(valueStr, (analysis.responseCounts.get(valueStr) || 0) + 1);
            
            if (typeof value === 'number') {
              analysis.scores.push(value);
            }
          }
        });
      });
    });

    // Calculate averages and sort by frequency
    const topQuestions = Array.from(responseAnalysis.values())
      .map(analysis => {
        const entries = Array.from(analysis.responseCounts.entries()) as [string, number][];
        const mostCommonResponse = entries.sort((a, b) => b[1] - a[1])[0];
        
        return {
          ...analysis,
          mostCommonResponse: mostCommonResponse ? mostCommonResponse[0] : null,
          mostCommonCount: mostCommonResponse ? mostCommonResponse[1] : 0,
          averageScore: analysis.scores.length > 0 
            ? analysis.scores.reduce((sum: number, score: number) => sum + score, 0) / analysis.scores.length 
            : 0,
        };
      })
      .sort((a, b) => b.totalResponses - a.totalResponses)
      .slice(0, 20);

    // Section completion analysis
    const sectionAnalysis = sections.map(section => {
      const totalQuestions = section.questions.length;
      const totalResponses = section.questions.reduce((sum, q) => sum + q.responses.length, 0);
      const completionRate = totalQuestions > 0 ? (totalResponses / (totalQuestions * totalAssessments)) * 100 : 0;
      
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        totalQuestions,
        totalResponses,
        completionRate,
      };
    });

    // Create PDF document
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Add content to the PDF
    doc
      .fontSize(24)
      .text("CSO Self-Assessment Tool - Admin Report", { align: "center" })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`)
      .moveDown(2);

    // Overview Section
    doc
      .fontSize(16)
      .text("Overview Statistics", { underline: true })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Total Organizations: ${totalOrganizations}`)
      .text(`Total Assessments: ${totalAssessments}`)
      .text(`Completed Assessments: ${completedAssessments}`)
      .text(`In Progress Assessments: ${inProgressAssessments}`)
      .text(`Total Responses: ${totalResponses}`)
      .text(`Completion Rate: ${completionRate.toFixed(1)}%`)
      .moveDown(2);

    // Most Active Organizations
    doc
      .fontSize(16)
      .text("Most Active Organizations", { underline: true })
      .moveDown();

    mostActiveOrganizations.forEach((org, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${org.name}`)
        .fontSize(10)
        .text(`   Email: ${org.email}`)
        .text(`   Assessments: ${org.assessmentCount} (${org.completedCount} completed)`)
        .text(`   Total Responses: ${org.responseCount}`)
        .moveDown();
    });

    doc.moveDown();

    // Top Questions
    doc
      .fontSize(16)
      .text("Most Answered Questions", { underline: true })
      .moveDown();

    topQuestions.slice(0, 10).forEach((question, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${question.questionText}`)
        .fontSize(10)
        .text(`   Section: ${question.sectionTitle}`)
        .text(`   Type: ${question.questionType}`)
        .text(`   Total Responses: ${question.totalResponses}`)
        .text(`   Most Common Response: ${question.mostCommonResponse || "N/A"} (${question.mostCommonCount} times)`)
        .text(`   Average Score: ${question.averageScore > 0 ? question.averageScore.toFixed(1) : "N/A"}`)
        .moveDown();
    });

    doc.moveDown();

    // Section Analysis
    doc
      .fontSize(16)
      .text("Section Completion Analysis", { underline: true })
      .moveDown();

    sectionAnalysis.forEach((section) => {
      doc
        .fontSize(12)
        .text(`${section.sectionTitle}`)
        .fontSize(10)
        .text(`   Questions: ${section.totalQuestions}`)
        .text(`   Total Responses: ${section.totalResponses}`)
        .text(`   Completion Rate: ${section.completionRate.toFixed(1)}%`)
        .moveDown();
    });

    // Monthly Activity
    const monthlyActivity = new Map();
    const currentYear = new Date().getFullYear();
    
    organizations.forEach(org => {
      org.assessments.forEach(assessment => {
        const month = new Date(assessment.createdAt).getMonth();
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        monthlyActivity.set(monthKey, (monthlyActivity.get(monthKey) || 0) + 1);
      });
    });

    doc
      .fontSize(16)
      .text("Monthly Activity", { underline: true })
      .moveDown();

    Array.from(monthlyActivity.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([month, count]) => {
        const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        doc
          .fontSize(10)
          .text(`${monthName}: ${count} assessments`);
      });

    doc.end();

    return new Response(Buffer.concat(chunks), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="admin-reports-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating admin report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
} 