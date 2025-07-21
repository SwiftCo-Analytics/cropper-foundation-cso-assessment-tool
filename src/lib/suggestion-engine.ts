import { prisma } from "./prisma";
import { SuggestionType } from "@/generated/prisma";

interface SuggestionResult {
  type: SuggestionType;
  sourceId?: string;
  suggestion: string;
  priority: number;
  weight: number;
  metadata?: any;
}

export class SuggestionEngine {
  /**
   * Generate suggestions for a completed assessment
   */
  static async generateSuggestions(assessmentId: string): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    try {
      // Get assessment with responses
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          responses: {
            include: {
              question: {
                include: {
                  section: true,
                  suggestions: {
                    where: { isActive: true },
                    orderBy: { priority: 'desc' }
                  }
                }
              }
            }
          }
        }
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Generate question-level suggestions
      const questionSuggestions = await this.generateQuestionSuggestions(assessment);
      suggestions.push(...questionSuggestions);

      // Generate section-level suggestions
      const sectionSuggestions = await this.generateSectionSuggestions(assessment);
      suggestions.push(...sectionSuggestions);

      // Generate assessment-level suggestions
      const assessmentSuggestions = await this.generateAssessmentSuggestions(assessment);
      suggestions.push(...assessmentSuggestions);

      // Generate strategic recommendations
      const strategicSuggestions = await this.generateStrategicSuggestions(assessment);
      suggestions.push(...strategicSuggestions);

      // Save suggestions to database
      await this.saveSuggestions(assessmentId, suggestions);

      return suggestions;
    } catch (error) {
      console.error("Error generating suggestions:", error);
      throw error;
    }
  }

  /**
   * Generate question-level suggestions based on individual responses
   */
  private static async generateQuestionSuggestions(assessment: any): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    for (const response of assessment.responses) {
      const question = response.question;
      
      for (const suggestion of question.suggestions) {
        if (this.evaluateCondition(response.value, suggestion.condition)) {
          suggestions.push({
            type: SuggestionType.QUESTION,
            sourceId: question.id,
            suggestion: suggestion.suggestion,
            priority: suggestion.priority,
            weight: suggestion.weight,
            metadata: {
              questionText: question.text,
              responseValue: response.value,
              condition: suggestion.condition
            }
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate section-level suggestions based on aggregated scores
   */
  private static async generateSectionSuggestions(assessment: any): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    // Group responses by section
    const sectionResponses = new Map<string, any[]>();
    for (const response of assessment.responses) {
      const sectionId = response.question.section.id;
      if (!sectionResponses.has(sectionId)) {
        sectionResponses.set(sectionId, []);
      }
      sectionResponses.get(sectionId)!.push(response);
    }

    // Calculate section scores and check suggestions
    for (const [sectionId, responses] of sectionResponses) {
      const section = responses[0].question.section;
      const sectionScore = this.calculateSectionScore(responses, section);

      // Get section suggestions
      const sectionSuggestions = await prisma.sectionSuggestion.findMany({
        where: {
          sectionId,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      });

      for (const suggestion of sectionSuggestions) {
        if (this.evaluateSectionCondition(sectionScore, suggestion.condition, section, responses)) {
          suggestions.push({
            type: SuggestionType.SECTION,
            sourceId: sectionId,
            suggestion: suggestion.suggestion,
            priority: suggestion.priority,
            weight: suggestion.weight,
            metadata: {
              sectionTitle: section.title,
              sectionScore,
              condition: suggestion.condition,
              questionCount: section.questions?.length || 0,
              responseCount: responses.length
            }
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate assessment-level suggestions based on overall score
   */
  private static async generateAssessmentSuggestions(assessment: any): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    // Calculate overall assessment score
    const overallScore = this.calculateOverallScore(assessment.responses);
    const sectionScores = this.calculateSectionScores(assessment.responses);

    // Get assessment suggestions
    const assessmentSuggestions = await prisma.assessmentSuggestion.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    for (const suggestion of assessmentSuggestions) {
      if (this.evaluateAssessmentCondition(overallScore, suggestion.condition, assessment, sectionScores)) {
        suggestions.push({
          type: SuggestionType.ASSESSMENT,
          suggestion: suggestion.suggestion,
          priority: suggestion.priority,
          weight: suggestion.weight,
          metadata: {
            overallScore,
            condition: suggestion.condition,
            sectionCount: assessment.responses.reduce((acc: string[], r: any) => {
              if (!acc.includes(r.question.section.id)) acc.push(r.question.section.id);
              return acc;
            }, [] as string[]).length,
            questionCount: assessment.responses.length,
            sectionScores
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate strategic recommendations based on assessment patterns
   */
  private static async generateStrategicSuggestions(assessment: any): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    // Calculate scores
    const overallScore = this.calculateOverallScore(assessment.responses);
    const sectionScores = this.calculateSectionScores(assessment.responses);

    // Strategic recommendations based on patterns
    const strategicRecommendations = [
      {
        condition: { overallScore: { max: 0.6 } },
        suggestion: "Your organization shows significant opportunities for improvement. Consider implementing a comprehensive improvement plan with clear milestones and regular progress reviews.",
        priority: 8, // Critical Issue - poor overall performance
        category: "Strategic"
      },
      {
        condition: { overallScore: { min: 0.6, max: 0.8 } },
        suggestion: "Your organization demonstrates good practices with room for enhancement. Focus on specific areas of weakness to achieve excellence.",
        priority: 5, // Significant Issue - moderate performance gaps
        category: "Strategic"
      },
      {
        condition: { overallScore: { min: 0.8 } },
        suggestion: "Excellent performance! Continue maintaining high standards and consider sharing best practices with other organizations.",
        priority: 2, // Moderate Improvement - already performing well
        category: "Strategic"
      },
      {
        condition: { 
          responses: { 'security-q1': false },
          category: "Security"
        },
        suggestion: "Develop and implement a comprehensive security policy that covers all aspects of your organization's operations.",
        priority: 9, // Urgent Action Required - security policy missing
        category: "Security"
      },
      {
        condition: { 
          responses: { 'security-q2': 'Never' },
          category: "Security"
        },
        suggestion: "Implement regular security awareness training programs to ensure all employees understand security best practices.",
        priority: 7, // High Priority Action - security training gaps
        category: "Security"
      },
      {
        condition: { 
          responses: { 'compliance-q1': false },
          category: "Compliance"
        },
        suggestion: "Appoint a dedicated compliance officer to oversee regulatory requirements and ensure ongoing compliance.",
        priority: 8, // Critical Issue - compliance oversight missing
        category: "Compliance"
      },
      {
        condition: { 
          responses: { 'operations-q1': false },
          category: "Operations"
        },
        suggestion: "Document all key operational procedures to ensure consistency and enable effective training and quality control.",
        priority: 6, // Major Improvement Needed - operational documentation gaps
        category: "Operations"
      },
      {
        condition: {},
        suggestion: "Consider conducting regular assessments to track progress and identify areas for continuous improvement.",
        priority: 3, // Recommended Action - general improvement practice
        category: "General"
      }
    ];

    // Evaluate each strategic recommendation
    for (const recommendation of strategicRecommendations) {
      if (this.evaluateStrategicCondition(recommendation.condition, assessment, sectionScores, overallScore)) {
        suggestions.push({
          type: SuggestionType.ASSESSMENT, // Use ASSESSMENT type for strategic suggestions
          suggestion: recommendation.suggestion,
          priority: recommendation.priority,
          weight: 1.0,
          metadata: {
            category: recommendation.category,
            overallScore,
            sectionScores,
            isStrategic: true
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Evaluate a condition against a response value
   */
  private static evaluateCondition(responseValue: any, condition: any): boolean {
    const { value, operator } = condition;

    switch (operator) {
      case 'equals':
        return responseValue === value;
      case 'contains':
        return String(responseValue).includes(String(value));
      case 'greater_than':
        return Number(responseValue) > Number(value);
      case 'less_than':
        return Number(responseValue) < Number(value);
      case 'greater_than_or_equal':
        return Number(responseValue) >= Number(value);
      case 'less_than_or_equal':
        return Number(responseValue) <= Number(value);
      default:
        return false;
    }
  }

  /**
   * Evaluate a section condition against a section score and context
   */
  private static evaluateSectionCondition(sectionScore: number, condition: any, section: any, responses: any[]): boolean {
    // Handle simple score range conditions
    if (condition.minScore !== undefined || condition.maxScore !== undefined) {
      const { minScore = 0, maxScore = 1 } = condition;
      return sectionScore >= minScore && sectionScore <= maxScore;
    }

    // Handle advanced conditions with full context
    if (condition.questionPercentage) {
      const { operator, value, questionType, expectedValue } = condition.questionPercentage;
      const matchingResponses = responses.filter(r => {
        if (questionType && r.question.type !== questionType) return false;
        if (expectedValue !== undefined && r.value !== expectedValue) return false;
        return true;
      });
      const percentage = (matchingResponses.length / responses.length) * 100;
      
      switch (operator) {
        case 'less_than':
          return percentage < value;
        case 'greater_than':
          return percentage > value;
        case 'equals':
          return Math.abs(percentage - value) < 1; // Within 1%
        default:
          return false;
      }
    }

    // Handle custom JSON conditions
    if (typeof condition === 'object' && !condition.minScore && !condition.maxScore) {
      // For advanced JSON conditions, we can add more complex logic here
      // For now, fall back to the strategic condition evaluator
      return this.evaluateStrategicCondition(condition, { responses }, { [section.id]: sectionScore }, sectionScore);
    }

    return false;
  }

  /**
   * Evaluate an assessment condition against an overall score and context
   */
  private static evaluateAssessmentCondition(overallScore: number, condition: any, assessment: any, sectionScores: Record<string, number>): boolean {
    // Handle simple score range conditions
    if (condition.overallScore) {
      const { min = 0, max = 1 } = condition.overallScore;
      return overallScore >= min && overallScore <= max;
    }

    // Handle section count conditions
    if (condition.sectionCount) {
      const { operator, value, belowThreshold } = condition.sectionCount;
      const sectionsBelowThreshold = Object.values(sectionScores).filter(score => score < belowThreshold).length;
      
      switch (operator) {
        case 'greater_than':
          return sectionsBelowThreshold > value;
        case 'less_than':
          return sectionsBelowThreshold < value;
        case 'equals':
          return sectionsBelowThreshold === value;
        default:
          return false;
      }
    }

    // Handle question percentage conditions
    if (condition.questionPercentage) {
      const { operator, value, questionType, expectedValue } = condition.questionPercentage;
      const matchingResponses = assessment.responses.filter((r: any) => {
        if (questionType && r.question.type !== questionType) return false;
        if (expectedValue !== undefined && r.value !== expectedValue) return false;
        return true;
      });
      const percentage = (matchingResponses.length / assessment.responses.length) * 100;
      
      switch (operator) {
        case 'less_than':
          return percentage < value;
        case 'greater_than':
          return percentage > value;
        case 'equals':
          return Math.abs(percentage - value) < 1; // Within 1%
        default:
          return false;
      }
    }

    // Handle custom JSON conditions
    if (typeof condition === 'object' && !condition.overallScore && !condition.sectionCount && !condition.questionPercentage) {
      // For advanced JSON conditions, we can add more complex logic here
      // For now, fall back to the strategic condition evaluator
      return this.evaluateStrategicCondition(condition, assessment, sectionScores, overallScore);
    }

    return false;
  }

  /**
   * Calculate section score based on responses
   */
  private static calculateSectionScore(responses: any[], section: any): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const response of responses) {
      const question = response.question;
      const weight = question.weight;
      const score = this.normalizeResponseValue(response.value, question.type);
      
      totalWeight += weight;
      weightedSum += score * weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate overall assessment score
   */
  private static calculateOverallScore(responses: any[]): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const response of responses) {
      const question = response.question;
      const section = question.section;
      const questionWeight = question.weight;
      const sectionWeight = section.weight;
      const combinedWeight = questionWeight * sectionWeight;
      
      const score = this.normalizeResponseValue(response.value, question.type);
      
      totalWeight += combinedWeight;
      weightedSum += score * combinedWeight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate scores for each section
   */
  private static calculateSectionScores(responses: any[]): Record<string, number> {
    const sectionScores: Record<string, number> = {};
    const sectionResponses = new Map<string, any[]>();

    // Group responses by section
    for (const response of responses) {
      const sectionId = response.question.section.id;
      if (!sectionResponses.has(sectionId)) {
        sectionResponses.set(sectionId, []);
      }
      sectionResponses.get(sectionId)!.push(response);
    }

    // Calculate scores for each section
    for (const [sectionId, sectionResps] of sectionResponses) {
      const numericResponses = sectionResps.filter(r => 
        typeof r.value === 'number' && r.value >= 1 && r.value <= 5
      );
      
      if (numericResponses.length > 0) {
        const totalScore = numericResponses.reduce((sum, r) => sum + (r.value as number), 0);
        sectionScores[sectionId] = totalScore / numericResponses.length;
      } else {
        sectionScores[sectionId] = 0;
      }
    }

    return sectionScores;
  }

  /**
   * Evaluate strategic condition
   */
  private static evaluateStrategicCondition(
    condition: any,
    assessment: any,
    sectionScores: Record<string, number>,
    overallScore: number
  ): boolean {
    if (!condition || Object.keys(condition).length === 0) {
      return true; // No condition means always apply
    }

    // Check overall score conditions
    if (condition.overallScore) {
      const { min, max } = condition.overallScore;
      if (min !== undefined && overallScore < min) return false;
      if (max !== undefined && overallScore > max) return false;
    }

    // Check response value conditions
    if (condition.responses) {
      for (const [questionId, expectedValue] of Object.entries(condition.responses)) {
        const response = assessment.responses.find((r: any) => r.questionId === questionId);
        if (response && response.value !== expectedValue) return false;
      }
    }

    return true;
  }

  /**
   * Normalize response value to a 0-1 scale
   */
  private static normalizeResponseValue(value: any, questionType: string): number {
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
  }

  /**
   * Save generated suggestions to the database
   */
  private static async saveSuggestions(assessmentId: string, suggestions: SuggestionResult[]): Promise<void> {
    // Get or create report
    let report = await prisma.report.findUnique({
      where: { assessmentId }
    });

    if (!report) {
      report = await prisma.report.create({
        data: { 
          assessmentId,
          content: {} // Initialize with empty content
        }
      });
    }

    // Save suggestions
    for (const suggestion of suggestions) {
      await prisma.reportSuggestion.create({
        data: {
          reportId: report.id,
          type: suggestion.type,
          sourceId: suggestion.sourceId,
          suggestion: suggestion.suggestion,
          priority: suggestion.priority,
          weight: suggestion.weight,
          metadata: suggestion.metadata
        }
      });
    }
  }

  /**
   * Get suggestions for a specific assessment
   */
  static async getAssessmentSuggestions(assessmentId: string): Promise<any[]> {
    const report = await prisma.report.findUnique({
      where: { assessmentId },
      include: {
        suggestions: {
          orderBy: [
            { priority: 'desc' },
            { weight: 'desc' }
          ]
        }
      }
    });

    return report?.suggestions || [];
  }
}  