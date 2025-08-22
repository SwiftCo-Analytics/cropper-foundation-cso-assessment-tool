// NOTE: This version removes the dependency on the Response type from prisma, and instead
// expects a minimal response object with the required fields. It also accepts an array of
// objects with at least: id, value, question: { id, type, section: { id } }.
// This allows compatibility with frontend data that may not have all DB fields.

export interface CSOScores {
  governanceScore: number;
  financialScore: number;
  programmeScore: number;
  hrScore: number;
  totalScore: number;
  governancePercentage: number;
  financialPercentage: number;
  programmePercentage: number;
  hrPercentage: number;
  totalPercentage: number;
  overallLevel: 'Emerging Organization' | 'Strong Foundation' | 'Leading Organization';
}

// Minimal type for what we need from a response
export type MinimalResponse = {
  id: string;
  value: any;
  question: {
    id: string;
    type: string;
    section: {
      id: string;
    };
  };
};

export class CSOScoreCalculator {
  /**
   * Calculate CSO-specific scores according to the specified scoring system
   */
  static calculateCSOScores(responses: MinimalResponse[]): CSOScores {
    // Group responses by section
    const sectionResponses = new Map<string, MinimalResponse[]>();
    for (const response of responses) {
      const sectionId = response.question.section.id;
      if (!sectionResponses.has(sectionId)) {
        sectionResponses.set(sectionId, []);
      }
      sectionResponses.get(sectionId)!.push(response);
    }

    // Calculate section scores (raw scores out of maximum possible)
    const governanceResponses = sectionResponses.get('governance-section') || [];
    const financialResponses = sectionResponses.get('financial-section') || [];
    const programmeResponses = sectionResponses.get('programme-section') || [];
    const hrResponses = sectionResponses.get('hr-section') || [];

    const governanceScore = this.calculateSectionRawScore(governanceResponses, 23); // 23 questions max
    const financialScore = this.calculateSectionRawScore(financialResponses, 10); // 10 questions max
    const programmeScore = this.calculateSectionRawScore(programmeResponses, 6); // 6 questions max
    const hrScore = this.calculateSectionRawScore(hrResponses, 4); // 4 questions max

    const totalScore = governanceScore + financialScore + programmeScore + hrScore;

    // Calculate percentages
    const governancePercentage = (governanceScore / 115) * 100; // 23 * 5 = 115 max
    const financialPercentage = (financialScore / 50) * 100; // 10 * 5 = 50 max
    const programmePercentage = (programmeScore / 30) * 100; // 6 * 5 = 30 max
    const hrPercentage = (hrScore / 20) * 100; // 4 * 5 = 20 max
    const totalPercentage = (totalScore / 215) * 100; // 43 * 5 = 215 max

    // Determine overall level
    let overallLevel: 'Emerging Organization' | 'Strong Foundation' | 'Leading Organization';
    if (totalPercentage >= 5 && totalPercentage <= 40) {
      overallLevel = 'Emerging Organization';
    } else if (totalPercentage >= 41 && totalPercentage <= 79) {
      overallLevel = 'Strong Foundation';
    } else {
      overallLevel = 'Leading Organization';
    }

    return {
      governanceScore,
      financialScore,
      programmeScore,
      hrScore,
      totalScore,
      governancePercentage,
      financialPercentage,
      programmePercentage,
      hrPercentage,
      totalPercentage,
      overallLevel,
    };
  }

  /**
   * Calculate raw score for a section based on responses
   */
  private static calculateSectionRawScore(responses: MinimalResponse[], maxQuestions: number): number {
    let totalScore = 0;
    let answeredQuestions = 0;

    for (const response of responses) {
      const score = this.normalizeResponseValue(response.value, response.question.type);
      totalScore += score * 5; // Convert to 5-point scale
      answeredQuestions++;
    }

    // If we have fewer responses than max questions, add zeros for missing responses
    const missingQuestions = maxQuestions - answeredQuestions;
    totalScore += missingQuestions * 0; // Missing questions get 0 points

    return Math.round(totalScore);
  }

  /**
   * Normalize response values to 0-1 scale
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
}
