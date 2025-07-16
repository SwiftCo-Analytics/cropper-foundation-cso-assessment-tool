import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Get most active organizations (by assessment count)
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

    // Analyze most common responses by question type
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
          
          // Count response values
          const value = response.value;
          if (value !== null && value !== undefined && value !== "") {
            const valueStr = String(value);
            analysis.responseCounts.set(valueStr, (analysis.responseCounts.get(valueStr) || 0) + 1);
            
            // For numeric responses, calculate average
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
          responseCounts: Object.fromEntries(analysis.responseCounts),
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
        averageScore: 0, // Could be calculated based on question weights
      };
    });

    // Monthly activity trends
    const monthlyActivity = new Map();
    const currentYear = new Date().getFullYear();
    
    organizations.forEach(org => {
      org.assessments.forEach(assessment => {
        const month = new Date(assessment.createdAt).getMonth();
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        monthlyActivity.set(monthKey, (monthlyActivity.get(monthKey) || 0) + 1);
      });
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAssessments = organizations.reduce((sum, org) => 
      sum + org.assessments.filter(a => new Date(a.createdAt) >= thirtyDaysAgo).length, 0
    );

    const recentResponses = organizations.reduce((sum, org) => 
      sum + org.assessments.reduce((aSum, assessment) => 
        aSum + assessment.responses.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length, 0
      ), 0
    );

    return NextResponse.json({
      overview: {
        totalOrganizations,
        totalAssessments,
        completedAssessments,
        inProgressAssessments,
        totalResponses,
        completionRate,
        recentAssessments,
        recentResponses,
      },
      mostActiveOrganizations,
      topQuestions,
      sectionAnalysis,
      monthlyActivity: Object.fromEntries(monthlyActivity),
    });
  } catch (error) {
    console.error("Error fetching admin reports data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
} 