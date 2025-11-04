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

interface CSOScores {
  totalScore: number;
  governanceScore: number;
  financialScore: number;
  programmeScore: number;
  hrScore: number;
  governancePercentage: number;
  financialPercentage: number;
  programmePercentage: number;
  hrPercentage: number;
  totalPercentage: number;
  overallLevel: 'Emerging' | 'Strong Foundation' | 'Leading';
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

      // Calculate CSO-specific scores
      const csoScores = this.calculateCSOScores(assessment.responses);

      // Generate all types of suggestions
      const assessmentSuggestions = await this.generateCSOAssessmentSuggestions(csoScores);
      const sectionSuggestions = await this.generateCSOSectionSuggestions(assessment, csoScores);
      const strategicSuggestions = await this.generateCSOStrategicSuggestions(assessment, csoScores);

      // Combine all suggestions
      const allSuggestions = [...assessmentSuggestions, ...sectionSuggestions, ...strategicSuggestions];

      // Deduplicate and prioritize suggestions by category
      const deduplicatedSuggestions = this.deduplicateSuggestionsByCategory(allSuggestions);

      // Save suggestions to database
      await this.saveSuggestions(assessmentId, deduplicatedSuggestions);

      return deduplicatedSuggestions;
    } catch (error) {
      console.error("Error generating suggestions:", error);
      throw error;
    }
  }

  /**
   * Deduplicate suggestions by category, keeping the highest priority one for each category
   */
  private static deduplicateSuggestionsByCategory(suggestions: SuggestionResult[]): SuggestionResult[] {
    const categoryMap = new Map<string, SuggestionResult>();

    for (const suggestion of suggestions) {
      const category = suggestion.metadata?.category || 'General';
      
      // If we don't have a suggestion for this category yet, or if this one has higher priority
      if (!categoryMap.has(category) || suggestion.priority > categoryMap.get(category)!.priority) {
        categoryMap.set(category, suggestion);
      }
    }

    // Convert back to array and sort by priority
    return Array.from(categoryMap.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate CSO-specific scores according to the specified scoring system
   */
  private static calculateCSOScores(responses: any[]): CSOScores {
    // Group responses by section
    const sectionResponses = new Map<string, any[]>();
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
    let overallLevel: 'Emerging' | 'Strong Foundation' | 'Leading';
    if (totalPercentage >= 0 && totalPercentage <= 40) {
      overallLevel = 'Emerging';
    } else if (totalPercentage >= 41 && totalPercentage <= 79) {
      overallLevel = 'Strong Foundation';
    } else {
      overallLevel = 'Leading';
    }

    return {
      totalScore,
      governanceScore,
      financialScore,
      programmeScore,
      hrScore,
      governancePercentage,
      financialPercentage,
      programmePercentage,
      hrPercentage,
      totalPercentage,
      overallLevel
    };
  }

  /**
   * Calculate raw score for a section (sum of all response values)
   */
  private static calculateSectionRawScore(responses: any[], maxQuestions: number): number {
    let totalScore = 0;
    let answeredQuestions = 0;

    for (const response of responses) {
      const value = response.value;
      if (value !== null && value !== undefined && value !== "") {
        if (response.question.type === 'LIKERT_SCALE') {
          totalScore += Number(value);
        } else if (response.question.type === 'BOOLEAN') {
          totalScore += value === true ? 5 : 1; // Yes = 5, No = 1
        }
        answeredQuestions++;
      }
    }

    // If not all questions are answered, scale the score proportionally
    if (answeredQuestions < maxQuestions) {
      const scaleFactor = maxQuestions / answeredQuestions;
      totalScore = totalScore * scaleFactor;
    }

    return Math.round(totalScore);
  }

  /**
   * Generate CSO-specific assessment-level suggestions
   */
  private static async generateCSOAssessmentSuggestions(csoScores: CSOScores): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    // Get assessment suggestions from database
    const assessmentSuggestions = await prisma.assessmentSuggestion.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    for (const suggestion of assessmentSuggestions) {
      if (this.evaluateCSOCondition(csoScores, suggestion.condition)) {
        // Determine section context (if any) from condition
        let sectionKey: string | undefined = undefined;
        let sectionTitle: string | undefined = undefined;
        let sectionScore: number | undefined = undefined;
        let sectionPercentage: number | undefined = undefined;

        const sectionScoreCondition = (suggestion.condition as any)?.sectionScore;
        if (sectionScoreCondition?.section) {
          const sectionId = sectionScoreCondition.section as string;
          sectionTitle = this.getSectionTitle(sectionId);
          // Map to key used by UI: governance | financial | programme | hr
          switch (sectionId) {
            case 'governance-section':
              sectionKey = 'governance';
              sectionScore = csoScores.governanceScore;
              sectionPercentage = csoScores.governancePercentage;
              break;
            case 'financial-section':
              sectionKey = 'financial';
              sectionScore = csoScores.financialScore;
              sectionPercentage = csoScores.financialPercentage;
              break;
            case 'programme-section':
              sectionKey = 'programme';
              sectionScore = csoScores.programmeScore;
              sectionPercentage = csoScores.programmePercentage;
              break;
            case 'hr-section':
              sectionKey = 'hr';
              sectionScore = csoScores.hrScore;
              sectionPercentage = csoScores.hrPercentage;
              break;
          }
        }

        suggestions.push({
          type: SuggestionType.ASSESSMENT,
          suggestion: suggestion.suggestion,
          priority: suggestion.priority,
          weight: suggestion.weight,
          metadata: {
            section: sectionKey ?? 'assessment',
            sectionTitle,
            sectionScore,
            sectionPercentage,
            overallScore: csoScores.totalScore,
            overallPercentage: csoScores.totalPercentage,
            overallLevel: csoScores.overallLevel,
            sectionScores: {
              governance: csoScores.governanceScore,
              financial: csoScores.financialScore,
              programme: csoScores.programmeScore,
              hr: csoScores.hrScore
            },
            sectionPercentages: {
              governance: csoScores.governancePercentage,
              financial: csoScores.financialPercentage,
              programme: csoScores.programmePercentage,
              hr: csoScores.hrPercentage
            },
            condition: suggestion.condition,
            category: suggestion.category
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate CSO-specific section-level suggestions
   */
  private static async generateCSOSectionSuggestions(assessment: any, csoScores: CSOScores): Promise<SuggestionResult[]> {
    // We don't need hardcoded section suggestions since we have database suggestions
    // that handle section-specific conditions properly
    return [];
  }

  /**
   * Generate CSO-specific strategic suggestions
   */
  private static async generateCSOStrategicSuggestions(assessment: any, csoScores: CSOScores): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    return suggestions;
  }

  /**
   * Evaluate CSO condition against calculated scores
   */
  private static evaluateCSOCondition(csoScores: CSOScores, condition: any): boolean {
    // Handle overall score conditions
    if (condition.overallScore) {
      const { min, max } = condition.overallScore;
      if (min !== undefined && csoScores.totalScore < min) return false;
      if (max !== undefined && csoScores.totalScore > max) return false;
    }

    // Handle section score conditions
    if (condition.sectionScore) {
      const { section, min, max } = condition.sectionScore;
      const sectionScore = this.getSectionScore(section, csoScores);
      if (min !== undefined && sectionScore < min) return false;
      if (max !== undefined && sectionScore > max) return false;
    }

    return true;
  }

  /**
   * Evaluate section score condition
   */
  private static evaluateSectionScoreCondition(sectionScore: number, condition: any): boolean {
    if (condition.score) {
      const { min, max } = condition.score;
      if (min !== undefined && sectionScore < min) return false;
      if (max !== undefined && sectionScore > max) return false;
    }
    return true;
  }

  /**
   * Evaluate strategic CSO condition
   */
  private static evaluateStrategicCSOCondition(csoScores: CSOScores, condition: any): boolean {
    // Handle overall level conditions
    if (condition.overallLevel && csoScores.overallLevel !== condition.overallLevel) {
      return false;
    }

    // Handle section percentage conditions
    if (condition.sectionPercentages) {
      for (const [section, percentageCondition] of Object.entries(condition.sectionPercentages)) {
        const sectionPercentage = this.getSectionPercentage(section, csoScores);
        const { min, max } = percentageCondition as any;
        if (min !== undefined && sectionPercentage < min) return false;
        if (max !== undefined && sectionPercentage > max) return false;
      }
    }

    return true;
  }

  /**
   * Get section score by section ID
   */
  private static getSectionScore(sectionId: string, csoScores: CSOScores): number {
    switch (sectionId) {
      case 'governance-section':
        return csoScores.governanceScore;
      case 'financial-section':
        return csoScores.financialScore;
      case 'programme-section':
        return csoScores.programmeScore;
      case 'hr-section':
        return csoScores.hrScore;
      default:
        return 0;
    }
  }

  /**
   * Get section percentage by section name
   */
  private static getSectionPercentage(section: string, csoScores: CSOScores): number {
    switch (section) {
      case 'governance':
        return csoScores.governancePercentage;
      case 'financial':
        return csoScores.financialPercentage;
      case 'programme':
        return csoScores.programmePercentage;
      case 'hr':
        return csoScores.hrPercentage;
      default:
        return 0;
    }
  }

  /**
   * Get section title by section ID
   */
  private static getSectionTitle(sectionId: string): string {
    switch (sectionId) {
      case 'governance-section':
        return 'Governance';
      case 'financial-section':
        return 'Financial Management';
      case 'programme-section':
        return 'Programme/Project Accountability';
      case 'hr-section':
        return 'Human Resource Accountability';
      default:
        return 'Unknown Section';
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

    // Clear existing suggestions
    await prisma.reportSuggestion.deleteMany({
      where: { reportId: report.id }
    });

    // Save new suggestions
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

  /**
   * Get CSO scores for an assessment
   */
  static async getCSOScores(assessmentId: string): Promise<CSOScores | null> {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        responses: {
          include: {
            question: {
              include: {
                section: true
              }
            }
          }
        }
      }
    });

    if (!assessment) {
      return null;
    }

    return this.calculateCSOScores(assessment.responses);
  }
}  