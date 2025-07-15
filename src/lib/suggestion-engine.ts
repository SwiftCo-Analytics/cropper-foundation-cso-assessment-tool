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
        if (this.evaluateSectionCondition(sectionScore, suggestion.condition)) {
          suggestions.push({
            type: SuggestionType.SECTION,
            sourceId: sectionId,
            suggestion: suggestion.suggestion,
            priority: suggestion.priority,
            weight: suggestion.weight,
            metadata: {
              sectionTitle: section.title,
              sectionScore,
              condition: suggestion.condition
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

    // Get assessment suggestions
    const assessmentSuggestions = await prisma.assessmentSuggestion.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    for (const suggestion of assessmentSuggestions) {
      if (this.evaluateAssessmentCondition(overallScore, suggestion.condition)) {
        suggestions.push({
          type: SuggestionType.ASSESSMENT,
          suggestion: suggestion.suggestion,
          priority: suggestion.priority,
          weight: suggestion.weight,
          metadata: {
            overallScore,
            condition: suggestion.condition
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
   * Evaluate a section condition against a section score
   */
  private static evaluateSectionCondition(sectionScore: number, condition: any): boolean {
    const { minScore, maxScore } = condition;
    return sectionScore >= minScore && sectionScore <= maxScore;
  }

  /**
   * Evaluate an assessment condition against an overall score
   */
  private static evaluateAssessmentCondition(overallScore: number, condition: any): boolean {
    const { overallScore: scoreRange } = condition;
    const { min, max } = scoreRange;
    return overallScore >= min && overallScore <= max;
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