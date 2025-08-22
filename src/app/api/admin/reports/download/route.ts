import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportGenerator } from "@/lib/report-generator";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";
import jsPDF from "jspdf";

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
            report: {
              include: {
                suggestions: true,
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

    // Calculate average scores across all organizations
    const allCompletedAssessments = organizations
      .flatMap(org => org.assessments)
      .filter(a => a.status === "COMPLETED" && a.report);

    const averageScores = {
      governanceScore: 0,
      financialScore: 0,
      programmeScore: 0,
      hrScore: 0,
      totalScore: 0,
      governancePercentage: 0,
      financialPercentage: 0,
      programmePercentage: 0,
      hrPercentage: 0,
      totalPercentage: 0,
    };

    if (allCompletedAssessments.length > 0) {
      const totalScores = allCompletedAssessments.reduce((acc, assessment) => {
        const scores = CSOScoreCalculator.calculateCSOScores(assessment.responses);
        return {
          governanceScore: acc.governanceScore + scores.governanceScore,
          financialScore: acc.financialScore + scores.financialScore,
          programmeScore: acc.programmeScore + scores.programmeScore,
          hrScore: acc.hrScore + scores.hrScore,
          totalScore: acc.totalScore + scores.totalScore,
          governancePercentage: acc.governancePercentage + scores.governancePercentage,
          financialPercentage: acc.financialPercentage + scores.financialPercentage,
          programmePercentage: acc.programmePercentage + scores.programmePercentage,
          hrPercentage: acc.hrPercentage + scores.hrPercentage,
          totalPercentage: acc.totalPercentage + scores.totalPercentage,
        };
      }, averageScores);

      const count = allCompletedAssessments.length;
      averageScores.governanceScore = Math.round(totalScores.governanceScore / count);
      averageScores.financialScore = Math.round(totalScores.financialScore / count);
      averageScores.programmeScore = Math.round(totalScores.programmeScore / count);
      averageScores.hrScore = Math.round(totalScores.hrScore / count);
      averageScores.totalScore = Math.round(totalScores.totalScore / count);
      averageScores.governancePercentage = totalScores.governancePercentage / count;
      averageScores.financialPercentage = totalScores.financialPercentage / count;
      averageScores.programmePercentage = totalScores.programmePercentage / count;
      averageScores.hrPercentage = totalScores.hrPercentage / count;
      averageScores.totalPercentage = totalScores.totalPercentage / count;
    }

    // Create PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = 280;
    const margin = 20;

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
      
      if (align === 'center') {
        doc.text(text, 105, yPosition, { align: 'center' });
      } else {
        doc.text(text, x, yPosition);
      }
      yPosition += fontSize + 3;
    };

    // Helper function to add section divider
    const addDivider = () => {
      if (yPosition > pageHeight - 10) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 10;
    };

    // Title Page
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("IGNITE CSOs", 105, 40, { align: "center" });
    
    doc.setFontSize(18);
    doc.text("CSO Self-Assessment", 105, 60, { align: "center" });
    doc.text("System-Wide Report", 105, 75, { align: "center" });
    
    doc.setFontSize(16);
    doc.text("Admin Dashboard Report", 105, 95, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 115, { align: "center" });
    
    doc.addPage();
    yPosition = 20;

    // Project Partners
    addText("🏛 Project Partners", 16, true);
    yPosition += 15;

    const partners = [
      "• The Cropper Foundation",
      "• Veni Apwann", 
      "• European Union (Funding Agency)"
    ];

    partners.forEach(partner => {
      addText(partner, 12, false, margin + 10);
    });

    addText("(Logos for each partner would be placed here in a clean horizontal layout or triangular formation for visual balance.)", 10, false, margin);
    yPosition += 20;

    // System Overview
    addText("🔥 IGNITE CSOs System Overview", 16, true);
    yPosition += 15;

    addText(`Reporting Period: January – December 2024`, 12, false);
    addText(`Date of Report: ${new Date().toLocaleDateString()}`, 12, false);
    addText(`Assessment Tool Used: CPDC Accountability Assessment Tool for CSOs`, 12, false);
    yPosition += 20;

    // System Statistics
    addText("📊 System Statistics", 14, true);
    yPosition += 12;

    const stats = [
      { label: "Total Organizations", value: totalOrganizations.toString() },
      { label: "Total Assessments", value: totalAssessments.toString() },
      { label: "Completed Assessments", value: completedAssessments.toString() },
      { label: "In Progress Assessments", value: inProgressAssessments.toString() },
      { label: "Total Responses", value: totalResponses.toString() },
      { label: "Completion Rate", value: `${completionRate.toFixed(1)}%` }
    ];

    stats.forEach((stat) => {
      addText(`${stat.label}: ${stat.value}`, 12, false);
    });

    yPosition += 15;

    // Average Scores
    addText("📈 Average Performance Across All Organizations", 14, true);
    yPosition += 12;

    const averageData = [
      ['Assessment Area', 'Average Score', 'Max Score', '% Achieved'],
      ['Governing Body Accountability', averageScores.governanceScore.toString(), '115', `${Math.round(averageScores.governancePercentage)}%`],
      ['Financial Management', averageScores.financialScore.toString(), '50', `${Math.round(averageScores.financialPercentage)}%`],
      ['Programme/Project Accountability', averageScores.programmeScore.toString(), '30', `${Math.round(averageScores.programmePercentage)}%`],
      ['Human Resource Accountability', averageScores.hrScore.toString(), '20', `${Math.round(averageScores.hrPercentage)}%`],
      ['Total', averageScores.totalScore.toString(), '215', `${Math.round(averageScores.totalPercentage)}%`]
    ];

    // Create table
    const colWidths = [60, 30, 30, 30];
    const rowHeight = 8;
    let currentY = yPosition;

    averageData.forEach((row, rowIndex) => {
      let currentX = margin;
      
      row.forEach((cell, colIndex) => {
        const width = colWidths[colIndex] || 30;
        
        // Draw cell border
        doc.rect(currentX, currentY, width, rowHeight);
        
        // Add text
        doc.setFontSize(8);
        doc.setFont("helvetica", rowIndex === 0 ? "bold" : "normal");
        
        const lines = doc.splitTextToSize(cell, width - 2);
        lines.forEach((line: string, lineIndex: number) => {
          doc.text(line, currentX + 1, currentY + 4 + (lineIndex * 3));
        });
        
        currentX += width;
      });
      
      currentY += rowHeight;
    });

    yPosition = currentY + 20;

    // Most Active Organizations
    addText("🏆 Most Active Organizations", 14, true);
    yPosition += 12;

    mostActiveOrganizations.forEach((org, index) => {
      addText(`${index + 1}. ${org.name}`, 12, true);
      addText(`   Assessments: ${org.assessmentCount} (${org.completedCount} completed)`, 10, false, margin + 10);
      addText(`   Total Responses: ${org.responseCount}`, 10, false, margin + 10);
      yPosition += 5;
    });

    yPosition += 15;

    // Recommendations Summary
    const allSuggestions = organizations
      .flatMap(org => org.assessments)
      .filter(a => a.report && a.report.suggestions)
      .flatMap(a => a.report!.suggestions!);

    if (allSuggestions.length > 0) {
      addText("📋 System-Wide Recommendations Summary", 14, true);
      yPosition += 12;

      // Group by priority
      const criticalSuggestions = allSuggestions.filter(s => s.priority >= 9);
      const highSuggestions = allSuggestions.filter(s => s.priority >= 7 && s.priority < 9);
      const mediumSuggestions = allSuggestions.filter(s => s.priority >= 5 && s.priority < 7);
      const lowSuggestions = allSuggestions.filter(s => s.priority < 5);

      addText(`Total Recommendations Generated: ${allSuggestions.length}`, 12, false);
      addText(`Critical Priority: ${criticalSuggestions.length}`, 12, false);
      addText(`High Priority: ${highSuggestions.length}`, 12, false);
      addText(`Medium Priority: ${mediumSuggestions.length}`, 12, false);
      addText(`Low Priority: ${lowSuggestions.length}`, 12, false);

      yPosition += 15;

      // Top recommendations across all organizations
      const topRecommendations = allSuggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10);

      addText("🔝 Top 10 System-Wide Recommendations", 14, true);
      yPosition += 12;

      topRecommendations.forEach((suggestion, index) => {
        const priorityLabel = suggestion.priority >= 9 ? 'Critical' :
                             suggestion.priority >= 7 ? 'High' :
                             suggestion.priority >= 5 ? 'Medium' : 'Low';
        
        addText(`${index + 1}. [${priorityLabel}] ${suggestion.suggestion}`, 10, false);
        yPosition += 5;
      });
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="IGNITE-CSOs-System-Report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating system report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
} 