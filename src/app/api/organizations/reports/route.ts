import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };

    // Get the organization with all assessments and responses
    const organization = await prisma.organization.findUnique({
      where: { id: decoded.orgId },
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

    // Calculate organization statistics
    const totalAssessments = organization.assessments.length;
    const completedAssessments = organization.assessments.filter(a => a.status === "COMPLETED").length;
    const inProgressAssessments = totalAssessments - completedAssessments;
    const totalResponses = organization.assessments.reduce((sum, assessment) => 
      sum + assessment.responses.length, 0
    );
    const completionRate = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0;

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

    // Calculate average scores per assessment
    const assessmentScores = organization.assessments
      .filter(a => a.status === "COMPLETED")
      .map(assessment => {
        const validResponses = assessment.responses.filter(r => 
          r.value !== null && r.value !== undefined && r.value !== ""
        );
        
        const normalizedScores = validResponses.map(r => 
          normalizeResponseValue(r.value, r.question.type)
        );
        
        const averageScore = normalizedScores.length > 0 
          ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length 
          : 0;
        
        // Convert to 1-5 scale for display
        const displayScore = averageScore * 4 + 1;
        
        return {
          id: assessment.id,
          name: assessment.name,
          completedAt: assessment.completedAt,
          averageScore: displayScore,
          totalResponses: assessment.responses.length,
          numericResponses: normalizedScores.length,
        };
      })
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    // Calculate progress over time
    const monthlyProgress = new Map();
    const currentYear = new Date().getFullYear();
    
    organization.assessments.forEach(assessment => {
      const month = new Date(assessment.startedAt).getMonth();
      const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      const existing = monthlyProgress.get(monthKey) || { started: 0, completed: 0 };
      
      existing.started++;
      if (assessment.status === "COMPLETED") {
        existing.completed++;
      }
      monthlyProgress.set(monthKey, existing);
    });

    // Section completion analysis
    const sectionAnalysis = sections.map(section => {
      const totalQuestions = section.questions.length;
      const totalResponses = organization.assessments.reduce((sum, assessment) => 
        sum + assessment.responses.filter(r => 
          section.questions.some(q => q.id === r.questionId)
        ).length, 0
      );
      const completionRate = totalQuestions > 0 ? (totalResponses / (totalQuestions * totalAssessments)) * 100 : 0;
      
      // Calculate average scores for this section
      const sectionResponses = organization.assessments.flatMap(assessment => 
        assessment.responses.filter(r => 
          section.questions.some(q => q.id === r.questionId)
        )
      );
      const validResponses = sectionResponses.filter(r => 
        r.value !== null && r.value !== undefined && r.value !== ""
      );
      
      const normalizedScores = validResponses.map(r => 
        normalizeResponseValue(r.value, r.question.type)
      );
      
      const averageScore = normalizedScores.length > 0 
        ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length 
        : 0;
      
      // Convert to 1-5 scale for display
      const displayScore = averageScore * 4 + 1;
      
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        totalQuestions,
        totalResponses,
        completionRate,
        averageScore: displayScore,
      };
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAssessments = organization.assessments.filter(a => 
      new Date(a.startedAt) >= thirtyDaysAgo
    ).length;

    const recentResponses = organization.assessments.reduce((sum, assessment) => 
      sum + assessment.responses.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length, 0
    );

    // Calculate improvement trends
    const improvementTrends = assessmentScores.length >= 2 ? {
      hasImprovement: assessmentScores[0].averageScore > assessmentScores[1]?.averageScore,
      latestScore: assessmentScores[0].averageScore,
      previousScore: assessmentScores[1]?.averageScore || 0,
      improvement: assessmentScores[0].averageScore - (assessmentScores[1]?.averageScore || 0),
    } : null;

    // Most common response patterns
    const responsePatterns = new Map();
    
    organization.assessments.forEach(assessment => {
      assessment.responses.forEach(response => {
        const questionId = response.question.id;
        const questionText = response.question.text;
        const sectionTitle = response.question.section.title;
        
        if (!responsePatterns.has(questionId)) {
          responsePatterns.set(questionId, {
            questionId,
            questionText,
            sectionTitle,
            totalResponses: 0,
            responseCounts: new Map(),
            averageScore: 0,
            scores: [],
          });
        }
        
        const pattern = responsePatterns.get(questionId);
        pattern.totalResponses++;
        
        const value = response.value;
        if (value !== null && value !== undefined && value !== "") {
          const valueStr = String(value);
          pattern.responseCounts.set(valueStr, (pattern.responseCounts.get(valueStr) || 0) + 1);
          
          // Normalize the score for all response types
          const normalizedScore = normalizeResponseValue(value, response.question.type);
          pattern.scores.push(normalizedScore);
        }
      });
    });

    // Calculate averages and get top patterns
    const topResponsePatterns = Array.from(responsePatterns.values())
      .map(pattern => {
        const entries = Array.from(pattern.responseCounts.entries()) as [string, number][];
        const mostCommonResponse = entries.sort((a, b) => b[1] - a[1])[0];
        
        return {
          ...pattern,
          mostCommonResponse: mostCommonResponse ? mostCommonResponse[0] : null,
          mostCommonCount: mostCommonResponse ? mostCommonResponse[1] : 0,
          averageScore: pattern.scores.length > 0 
            ? (pattern.scores.reduce((sum: number, score: number) => sum + score, 0) / pattern.scores.length) * 4 + 1
            : 0,
          responseCounts: Object.fromEntries(pattern.responseCounts),
        };
      })
      .sort((a, b) => b.totalResponses - a.totalResponses)
      .slice(0, 10);

    // Get suggestions from latest completed assessment
    let suggestions: any[] = [];
    const latestCompletedAssessment = organization.assessments
      .filter(a => a.status === "COMPLETED")
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    if (latestCompletedAssessment) {
      const report = await prisma.report.findUnique({
        where: { assessmentId: latestCompletedAssessment.id },
        include: {
          suggestions: {
            orderBy: { priority: 'desc' }
          }
        }
      });
      
      if (report) {
        suggestions = report.suggestions;
      }
    }

    // Get the latest completed assessment
    const latestAssessment = organization.assessments
      .filter(a => a.status === "COMPLETED")
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    return NextResponse.json({
      overview: {
        totalAssessments,
        completedAssessments,
        inProgressAssessments,
        totalResponses,
        completionRate,
        recentAssessments,
        recentResponses,
      },
      assessmentScores,
      sectionAnalysis,
      monthlyProgress: Object.fromEntries(monthlyProgress),
      improvementTrends,
      topResponsePatterns,
      suggestions,
      organization: {
        name: organization.name,
        email: organization.email,
        createdAt: organization.createdAt,
      },
      latestAssessment: latestAssessment || null,
    });
  } catch (error) {
    console.error("Error fetching organization reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
} 