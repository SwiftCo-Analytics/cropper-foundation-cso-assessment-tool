import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // Helper function to normalize response values to 0-1 scale
    const normalizeResponseValue = (value: any, questionType: string): number => {
      switch (questionType) {
        case 'BOOLEAN':
          return value === true ? 1 : 0;
        case 'LIKERT_SCALE':
          // Assuming 5-point scale (1-5)
          return (Number(value) - 1) / 4;
        case 'SINGLE_CHOICE':
          // For single choice, we need to know the options to normalize
          // This is a simplified version - you might want to store option weights
          return 0.5; // Default middle value
        case 'MULTIPLE_CHOICE':
          // For multiple choice, count selected options vs total options
          if (Array.isArray(value)) {
            return value.length > 0 ? 0.7 : 0; // Simplified
          }
          return 0;
        case 'TEXT':
          // For text, we could implement sentiment analysis or keyword matching
          // For now, return a neutral score
          return 0.5;
        default:
          return 0;
      }
    };

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
            
            // Normalize the score for all response types
            const normalizedScore = normalizeResponseValue(value, response.question.type);
            analysis.scores.push(normalizedScore);
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
            ? (analysis.scores.reduce((sum: number, score: number) => sum + score, 0) / analysis.scores.length) * 4 + 1
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
    addText("Administrative Report", 18, true, margin, 'center');
    yPosition += 5;
    
    // Date and time
    const dateTime = `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    addText(dateTime, 10, false, margin, 'center');
    yPosition += 15;

    // Overview Section
    addText("Overview Statistics", 16, true, margin, 'center');
    yPosition += 10;
    
    // Create a table-like layout for statistics
    const stats = [
      { label: "Total Organizations", value: totalOrganizations.toString() },
      { label: "Total Assessments", value: totalAssessments.toString() },
      { label: "Completed Assessments", value: completedAssessments.toString() },
      { label: "In Progress Assessments", value: inProgressAssessments.toString() },
      { label: "Total Responses", value: totalResponses.toString() },
      { label: "Completion Rate", value: `${completionRate.toFixed(1)}%` }
    ];

    stats.forEach((stat, index) => {
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

    // Most Active Organizations
    addText("Most Active Organizations", 16, true, margin, 'center');
    yPosition += 10;

    mostActiveOrganizations.forEach((org, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Organization name with ranking
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${org.name}`, margin, yPosition);
      yPosition += 8;
      
      // Organization details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      addBulletPoint(`Email: ${org.email}`, 10, 15);
      addBulletPoint(`Assessments: ${org.assessmentCount} (${org.completedCount} completed)`, 10, 15);
      addBulletPoint(`Total Responses: ${org.responseCount}`, 10, 15);
      yPosition += 5;
    });

    addDivider();

    // Top Questions
    addText("Most Answered Questions", 16, true, margin, 'center');
    yPosition += 10;

    topQuestions.slice(0, 10).forEach((question, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Question text with ranking
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${index + 1}. ${question.questionText}`;
      // Handle long question text
      if (questionText.length > 80) {
        const words = questionText.split(' ');
        let line = '';
        let firstLine = true;
        for (const word of words) {
          if ((line + word).length > 80) {
            doc.text(line, margin, yPosition);
            yPosition += 6;
            line = word + ' ';
            firstLine = false;
          } else {
            line += word + ' ';
          }
        }
        if (line.trim()) {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        }
      } else {
        doc.text(questionText, margin, yPosition);
        yPosition += 8;
      }
      
      // Question details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      addBulletPoint(`Section: ${question.sectionTitle}`, 10, 15);
      addBulletPoint(`Type: ${formatQuestionType(question.questionType)}`, 10, 15);
      addBulletPoint(`Total Responses: ${question.totalResponses}`, 10, 15);
      addBulletPoint(`Most Common Response: ${question.mostCommonResponse || "N/A"} (${question.mostCommonCount} times)`, 10, 15);
      yPosition += 5;
    });

    addDivider();

    // Section Analysis
    addText("Section Completion Analysis", 16, true, margin, 'center');
    yPosition += 10;

    sectionAnalysis.forEach((section) => {
      if (yPosition > pageHeight - 25) {
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
      addBulletPoint(`Questions: ${section.totalQuestions}`, 10, 15);
      addBulletPoint(`Total Responses: ${section.totalResponses}`, 10, 15);
      addBulletPoint(`Completion Rate: ${section.completionRate.toFixed(1)}%`, 10, 15);
      yPosition += 5;
    });

    addDivider();

    // Suggestion Analytics
    const allSuggestions = organizations
      .flatMap(org => org.assessments)
      .filter(assessment => assessment.report && assessment.report.suggestions)
      .flatMap(assessment => assessment.report!.suggestions!);

    if (allSuggestions.length > 0) {
      addText("Suggestion Analytics", 16, true, margin, 'center');
      yPosition += 10;

      // Overall statistics
      const totalSuggestions = allSuggestions.length;
      const organizationsWithSuggestions = new Set(
        organizations
          .filter(org => org.assessments.some(a => a.report && a.report.suggestions && a.report.suggestions.length > 0))
          .map(org => org.id)
      ).size;

      addText(`Total Suggestions Generated: ${totalSuggestions}`, 12, true);
      addText(`Organizations with Suggestions: ${organizationsWithSuggestions} of ${totalOrganizations}`, 12, false);
      addText(`Coverage: ${Math.round((organizationsWithSuggestions / totalOrganizations) * 100)}%`, 12, false);
      yPosition += 10;

      // Most common suggestions
      const suggestionFrequency = new Map();
      allSuggestions.forEach(suggestion => {
        const key = suggestion.suggestion.trim().toLowerCase();
        suggestionFrequency.set(key, (suggestionFrequency.get(key) || 0) + 1);
      });

      const mostCommonSuggestions = Array.from(suggestionFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      addText("Most Common Suggestions:", 14, true);
      yPosition += 8;

      mostCommonSuggestions.forEach(([suggestionText, count], index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Find the original suggestion to get metadata
        const originalSuggestion = allSuggestions.find(s => s.suggestion.trim().toLowerCase() === suggestionText);
        const percentage = Math.round((count / totalSuggestions) * 100);
        
        addText(`${index + 1}. (${count} times, ${percentage}% of all suggestions)`, 11, true);
        
        // Handle long suggestion text
        const displayText = originalSuggestion?.suggestion || suggestionText;
        if (displayText.length > 90) {
          const words = displayText.split(' ');
          let line = '';
          for (const word of words) {
            if ((line + word).length > 90) {
              addBulletPoint(line, 10, 15);
              line = word + ' ';
            } else {
              line += word + ' ';
            }
          }
          if (line.trim()) {
            addBulletPoint(line, 10, 15);
          }
        } else {
          addBulletPoint(displayText, 10, 15);
        }
        
        yPosition += 5;
      });

      // Suggestions by type breakdown
      const suggestionsByType = new Map();
      allSuggestions.forEach(suggestion => {
        const type = suggestion.type;
        suggestionsByType.set(type, (suggestionsByType.get(type) || 0) + 1);
      });

      addDivider();
      addText("Suggestions by Category:", 14, true);
      yPosition += 8;

      Array.from(suggestionsByType.entries()).forEach(([type, count]) => {
        if (yPosition > pageHeight - 15) {
          doc.addPage();
          yPosition = 20;
        }
        
        const categoryName = type === 'QUESTION' ? 'Question-Based' :
                            type === 'SECTION' ? 'Section-Based' :
                            type === 'ASSESSMENT' ? 'Overall Assessment' : type;
        const percentage = Math.round((count / totalSuggestions) * 100);
        
        addBulletPoint(`${categoryName}: ${count} suggestions (${percentage}%)`, 10, 15);
      });

      addDivider();
    }

    // Monthly Activity
    addText("Monthly Activity", 16, true, margin, 'center');
    yPosition += 10;

    // Create a table for monthly activity
    const monthlyEntries = Array.from(monthlyActivity.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    monthlyEntries.forEach(([month, count]) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }
      
      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(monthName, margin, yPosition);
      doc.text(count.toString(), margin + 120, yPosition);
      yPosition += 6;
    });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
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