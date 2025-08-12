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

      // Generate assessment-level suggestions based on CSO scoring
      const assessmentSuggestions = await this.generateCSOAssessmentSuggestions(csoScores);
      suggestions.push(...assessmentSuggestions);

      // Generate section-level suggestions
      const sectionSuggestions = await this.generateCSOSectionSuggestions(assessment, csoScores);
      suggestions.push(...sectionSuggestions);

      // Generate strategic recommendations
      const strategicSuggestions = await this.generateCSOStrategicSuggestions(assessment, csoScores);
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
    if (totalPercentage >= 5 && totalPercentage <= 40) {
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
        suggestions.push({
          type: SuggestionType.ASSESSMENT,
          suggestion: suggestion.suggestion,
          priority: suggestion.priority,
          weight: suggestion.weight,
          metadata: {
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
    const suggestions: SuggestionResult[] = [];

    // Section-specific suggestions based on CSO scoring
    const sectionSuggestions = [
      {
        sectionId: 'governance-section',
        condition: { score: { min: 23, max: 46 } },
        suggestion: 'Your governance practices need strengthening. Focus on establishing clear board structures, stakeholder engagement processes, and ethical frameworks.',
        priority: 9,
        category: 'Governance'
      },
      {
        sectionId: 'governance-section',
        condition: { score: { min: 47, max: 91 } },
        suggestion: 'Your governance foundation is solid. Continue refining board practices and enhance stakeholder communication.',
        priority: 7,
        category: 'Governance'
      },
      {
        sectionId: 'governance-section',
        condition: { score: { min: 92, max: 115 } },
        suggestion: 'Excellent governance practices! Consider mentoring other organizations and sharing best practices.',
        priority: 5,
        category: 'Governance'
      },
      {
        sectionId: 'financial-section',
        condition: { score: { min: 10, max: 20 } },
        suggestion: 'Strengthen your financial management systems. Implement basic accounting practices and donor due diligence.',
        priority: 9,
        category: 'Financial Management'
      },
      {
        sectionId: 'financial-section',
        condition: { score: { min: 21, max: 40 } },
        suggestion: 'Good financial practices in place. Focus on sustainability and advanced reporting systems.',
        priority: 7,
        category: 'Financial Management'
      },
      {
        sectionId: 'financial-section',
        condition: { score: { min: 41, max: 50 } },
        suggestion: 'Outstanding financial management! Lead sector-wide financial capacity building initiatives.',
        priority: 5,
        category: 'Financial Management'
      },
      {
        sectionId: 'programme-section',
        condition: { score: { min: 6, max: 12 } },
        suggestion: 'Establish comprehensive M&E systems and stakeholder engagement processes for your programmes.',
        priority: 9,
        category: 'Programme/Project Accountability'
      },
      {
        sectionId: 'programme-section',
        condition: { score: { min: 13, max: 24 } },
        suggestion: 'Good programme accountability. Enhance monitoring tools and collaborative partnerships.',
        priority: 7,
        category: 'Programme/Project Accountability'
      },
      {
        sectionId: 'programme-section',
        condition: { score: { min: 25, max: 30 } },
        suggestion: 'Excellent programme practices! Share success stories and lead collaborative initiatives.',
        priority: 5,
        category: 'Programme/Project Accountability'
      },
      {
        sectionId: 'hr-section',
        condition: { score: { min: 4, max: 8 } },
        suggestion: 'Develop comprehensive HR strategies and create motivating work environments.',
        priority: 9,
        category: 'Human Resource Management'
      },
      {
        sectionId: 'hr-section',
        condition: { score: { min: 9, max: 16 } },
        suggestion: 'Good HR practices. Enhance remote work policies and cybersecurity measures.',
        priority: 7,
        category: 'Human Resource Management'
      },
      {
        sectionId: 'hr-section',
        condition: { score: { min: 17, max: 20 } },
        suggestion: 'Outstanding HR practices! Share lessons learned and mentor other organizations.',
        priority: 5,
        category: 'Human Resource Management'
      }
    ];

    // Evaluate section suggestions
    for (const sectionSuggestion of sectionSuggestions) {
      const sectionScore = this.getSectionScore(sectionSuggestion.sectionId, csoScores);
      if (this.evaluateSectionScoreCondition(sectionScore, sectionSuggestion.condition)) {
        suggestions.push({
          type: SuggestionType.SECTION,
          sourceId: sectionSuggestion.sectionId,
          suggestion: sectionSuggestion.suggestion,
          priority: sectionSuggestion.priority,
          weight: 1.0,
          metadata: {
            sectionTitle: this.getSectionTitle(sectionSuggestion.sectionId),
            sectionScore,
            category: sectionSuggestion.category,
            condition: sectionSuggestion.condition
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate CSO-specific strategic suggestions
   */
  private static async generateCSOStrategicSuggestions(assessment: any, csoScores: CSOScores): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];

    // Strategic recommendations based on CSO scoring patterns
    const strategicRecommendations = [
      {
        condition: { overallLevel: 'Emerging' },
        suggestion: "Focus on building foundational systems. Start with governance structure, basic financial tracking, and legal compliance. Small improvements will create significant momentum.",
        priority: 10,
        category: "Strategic"
      },
      {
        condition: { overallLevel: 'Strong Foundation' },
        suggestion: "You have a solid foundation. Identify specific areas for improvement and implement targeted enhancements to move toward sector leadership.",
        priority: 8,
        category: "Strategic"
      },
      {
        condition: { overallLevel: 'Leading' },
        suggestion: "You are a sector leader! Consider sharing your expertise through mentoring, case studies, and collaborative initiatives to support other CSOs.",
        priority: 6,
        category: "Strategic"
      },
      {
        condition: { 
          sectionPercentages: { governance: { max: 40 } }
        },
        suggestion: "Prioritize governance improvements. Strong governance is the foundation for all other organizational practices.",
        priority: 9,
        category: "Strategic"
      },
      {
        condition: { 
          sectionPercentages: { financial: { max: 40 } }
        },
        suggestion: "Strengthen financial management practices. This is critical for donor trust and organizational sustainability.",
        priority: 9,
        category: "Strategic"
      },
      {
        condition: { 
          sectionPercentages: { programme: { max: 40 } }
        },
        suggestion: "Enhance programme accountability systems. This demonstrates impact and builds stakeholder confidence.",
        priority: 8,
        category: "Strategic"
      },
      {
        condition: { 
          sectionPercentages: { hr: { max: 40 } }
        },
        suggestion: "Develop comprehensive HR strategies. Engaged staff and volunteers are essential for organizational success.",
        priority: 8,
        category: "Strategic"
      }
    ];

    // Evaluate strategic recommendations
    for (const recommendation of strategicRecommendations) {
      if (this.evaluateStrategicCSOCondition(csoScores, recommendation.condition)) {
        suggestions.push({
          type: SuggestionType.ASSESSMENT,
          suggestion: recommendation.suggestion,
          priority: recommendation.priority,
          weight: 1.0,
          metadata: {
            category: recommendation.category,
            overallLevel: csoScores.overallLevel,
            totalScore: csoScores.totalScore,
            totalPercentage: csoScores.totalPercentage,
            sectionPercentages: {
              governance: csoScores.governancePercentage,
              financial: csoScores.financialPercentage,
              programme: csoScores.programmePercentage,
              hr: csoScores.hrPercentage
            },
            isStrategic: true
          }
        });
      }
    }

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