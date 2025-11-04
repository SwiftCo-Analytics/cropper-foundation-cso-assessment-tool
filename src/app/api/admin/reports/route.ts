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
                suggestions: {
                  orderBy: { priority: 'desc' }
                }
              }
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

    // SUGGESTION ANALYTICS
    const suggestionAnalysis = new Map<string, {
      suggestion: string;
      type: string;
      count: number;
      organizations: Set<string>;
      averagePriority: number;
      totalPriority: number;
      metadata: any[];
    }>();

    const suggestionsByType = new Map<string, number>();
    const suggestionsByPriority = new Map<string, number>();
    let totalSuggestions = 0;
    const organizationsWithSuggestions = new Set<string>();
    const suggestionsByCategory = new Map<string, number>();

    // Analyze all suggestions across all organizations
    organizations.forEach(org => {
      org.assessments.forEach(assessment => {
        if (assessment.report && assessment.report.suggestions) {
          assessment.report.suggestions.forEach(suggestion => {
            totalSuggestions++;
            organizationsWithSuggestions.add(org.id);
            
            // Track suggestion text frequency
            const suggestionKey = suggestion.suggestion.trim().toLowerCase();
            if (!suggestionAnalysis.has(suggestionKey)) {
              suggestionAnalysis.set(suggestionKey, {
                suggestion: suggestion.suggestion,
                type: suggestion.type,
                count: 0,
                organizations: new Set(),
                averagePriority: 0,
                totalPriority: 0,
                metadata: []
              });
            }
            
            const analysis = suggestionAnalysis.get(suggestionKey)!;
            analysis.count++;
            analysis.organizations.add(org.id);
            analysis.totalPriority += suggestion.priority;
            analysis.averagePriority = analysis.totalPriority / analysis.count;
            analysis.metadata.push(suggestion.metadata);
            
            // Track by type
            suggestionsByType.set(suggestion.type, (suggestionsByType.get(suggestion.type) || 0) + 1);
            
            // Track by category (from suggestion.category or suggestion.metadata?.category or metadata.sectionTitle)
            let category = 'Uncategorized';
            if (suggestion.metadata && typeof suggestion.metadata === 'object' && suggestion.metadata !== null) {
              const metadata = suggestion.metadata as any;
              // For SECTION type, prefer sectionTitle; otherwise use category
              if (suggestion.type === 'SECTION' && metadata.sectionTitle) {
                category = metadata.sectionTitle;
              } else if (metadata.category) {
                category = metadata.category;
              }
            }
            suggestionsByCategory.set(category, (suggestionsByCategory.get(category) || 0) + 1);

            // Track by priority level
            const priorityLevel = suggestion.priority >= 9 ? 'Critical' :
                                 suggestion.priority >= 7 ? 'High' :
                                 suggestion.priority >= 5 ? 'Medium' : 'Low';
            suggestionsByPriority.set(priorityLevel, (suggestionsByPriority.get(priorityLevel) || 0) + 1);
          });
        }
      });
    });

    // Get most common suggestions
    const mostCommonSuggestions = Array.from(suggestionAnalysis.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(analysis => {
        // Extract category from metadata
        let category = 'Uncategorized';
        if (analysis.metadata && analysis.metadata.length > 0) {
          const firstMetadata = analysis.metadata[0];
          if (firstMetadata && typeof firstMetadata === 'object' && firstMetadata !== null) {
            const metadata = firstMetadata as any;
            // For SECTION type, use sectionTitle; for ASSESSMENT, use category if available
            if (analysis.type === 'SECTION' && metadata.sectionTitle) {
              category = metadata.sectionTitle;
            } else if (metadata.category) {
              category = metadata.category;
            } else if (analysis.type === 'QUESTION') {
              category = 'Question-Based';
            } else if (analysis.type === 'SECTION') {
              category = 'Section-Based';
            } else {
              category = 'Uncategorized';
            }
          }
        } else {
          // Fallback based on type
          if (analysis.type === 'QUESTION') {
            category = 'Question-Based';
          } else if (analysis.type === 'SECTION') {
            category = 'Section-Based';
          } else {
            category = 'Uncategorized';
          }
        }
        
        return {
          suggestion: analysis.suggestion,
          type: analysis.type,
          category: category,
          count: analysis.count,
          organizationCount: analysis.organizations.size,
          averagePriority: Math.round(analysis.averagePriority * 10) / 10,
          prevalence: Math.round((analysis.count / totalSuggestions) * 100 * 10) / 10
        };
      });

    // Calculate average scores across all organizations
    const allCompletedAssessments = organizations
      .flatMap(org => org.assessments)
      .filter(a => a.status === "COMPLETED");

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
        // Calculate scores for this assessment
        const sectionResponses = new Map<string, any[]>();
        for (const response of assessment.responses) {
          const sectionId = response.question.section.id;
          if (!sectionResponses.has(sectionId)) {
            sectionResponses.set(sectionId, []);
          }
          sectionResponses.get(sectionId)!.push(response);
        }

        const governanceResponses = sectionResponses.get('governance-section') || [];
        const financialResponses = sectionResponses.get('financial-section') || [];
        const programmeResponses = sectionResponses.get('programme-section') || [];
        const hrResponses = sectionResponses.get('hr-section') || [];

        const governanceScore = calculateSectionRawScore(governanceResponses, 23);
        const financialScore = calculateSectionRawScore(financialResponses, 10);
        const programmeScore = calculateSectionRawScore(programmeResponses, 6);
        const hrScore = calculateSectionRawScore(hrResponses, 4);

        const totalScore = governanceScore + financialScore + programmeScore + hrScore;

        return {
          governanceScore: acc.governanceScore + governanceScore,
          financialScore: acc.financialScore + financialScore,
          programmeScore: acc.programmeScore + programmeScore,
          hrScore: acc.hrScore + hrScore,
          totalScore: acc.totalScore + totalScore,
        };
      }, { governanceScore: 0, financialScore: 0, programmeScore: 0, hrScore: 0, totalScore: 0 });

      const count = allCompletedAssessments.length;
      averageScores.governanceScore = Math.round(totalScores.governanceScore / count);
      averageScores.financialScore = Math.round(totalScores.financialScore / count);
      averageScores.programmeScore = Math.round(totalScores.programmeScore / count);
      averageScores.hrScore = Math.round(totalScores.hrScore / count);
      averageScores.totalScore = Math.round(totalScores.totalScore / count);

      // Calculate percentages
      averageScores.governancePercentage = (averageScores.governanceScore / 115) * 100;
      averageScores.financialPercentage = (averageScores.financialScore / 50) * 100;
      averageScores.programmePercentage = (averageScores.programmeScore / 30) * 100;
      averageScores.hrPercentage = (averageScores.hrScore / 20) * 100;
      averageScores.totalPercentage = (averageScores.totalScore / 215) * 100;
    }

    // Helper function to calculate section raw score
    function calculateSectionRawScore(responses: any[], maxQuestions: number): number {
      let totalScore = 0;
      let answeredQuestions = 0;

      for (const response of responses) {
        const score = normalizeResponseValue(response.value, response.question.type);
        totalScore += score * 5; // Convert to 5-point scale
        answeredQuestions++;
      }

      // If we have fewer responses than max questions, add zeros for missing responses
      const missingQuestions = maxQuestions - answeredQuestions;
      totalScore += missingQuestions * 0; // Missing questions get 0 points

      return Math.round(totalScore);
    }

    // Calculate suggestion coverage metrics
    const suggestionCoverage = {
      totalSuggestions,
      organizationsWithSuggestions: organizationsWithSuggestions.size,
      coveragePercentage: Math.round((organizationsWithSuggestions.size / totalOrganizations) * 100 * 10) / 10,
      averageSuggestionsPerOrganization: Math.round((totalSuggestions / organizationsWithSuggestions.size) * 10) / 10,
      suggestionsByType: Object.fromEntries(suggestionsByType),
      suggestionsByPriority: Object.fromEntries(suggestionsByPriority),
      suggestionsByCategory: Object.fromEntries(suggestionsByCategory),
    };

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
      suggestionAnalytics: {
        coverage: suggestionCoverage,
        mostCommonSuggestions,
        insights: [
        ]
      },
      averageScores
    });
  } catch (error) {
    console.error("Error fetching admin reports data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
} 