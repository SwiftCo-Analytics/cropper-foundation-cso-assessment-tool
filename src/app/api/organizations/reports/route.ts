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

    // Calculate average scores per assessment
    const assessmentScores = organization.assessments
      .filter(a => a.status === "COMPLETED")
      .map(assessment => {
        const numericResponses = assessment.responses.filter(r => 
          typeof r.value === 'number' && r.value >= 1 && r.value <= 5
        );
        const averageScore = numericResponses.length > 0 
          ? numericResponses.reduce((sum, r) => sum + (r.value as number), 0) / numericResponses.length 
          : 0;
        
        return {
          id: assessment.id,
          name: assessment.name,
          completedAt: assessment.completedAt,
          averageScore,
          totalResponses: assessment.responses.length,
          numericResponses: numericResponses.length,
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
      const numericResponses = sectionResponses.filter(r => 
        typeof r.value === 'number' && r.value >= 1 && r.value <= 5
      );
      const averageScore = numericResponses.length > 0 
        ? numericResponses.reduce((sum, r) => sum + (r.value as number), 0) / numericResponses.length 
        : 0;
      
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        totalQuestions,
        totalResponses,
        completionRate,
        averageScore,
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
          
          if (typeof value === 'number') {
            pattern.scores.push(value);
          }
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
            ? pattern.scores.reduce((sum: number, score: number) => sum + score, 0) / pattern.scores.length 
            : 0,
          responseCounts: Object.fromEntries(pattern.responseCounts),
        };
      })
      .sort((a, b) => b.totalResponses - a.totalResponses)
      .slice(0, 10);

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
    });
  } catch (error) {
    console.error("Error fetching organization reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
} 