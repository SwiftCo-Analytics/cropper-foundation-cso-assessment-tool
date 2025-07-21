"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, BarChart, Calendar, Users, CheckCircle, Clock, Lightbulb, Target, AlertTriangle } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import Link from "next/link";

interface OrganizationReportProps {
  params: {
    organizationId: string;
  };
}

interface Organization {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  assessments: Assessment[];
}

interface Assessment {
  id: string;
  name?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
  responses: Response[];
  report?: {
    id: string;
    suggestions: Suggestion[];
  };
}

interface Response {
  id: string;
  value: any;
  createdAt: string;
  question: {
    id: string;
    text: string;
    type: string;
    section: {
      id: string;
      title: string;
    };
  };
}

interface Suggestion {
  id: string;
  type: string;
  sourceId?: string;
  suggestion: string;
  priority: number;
  weight: number;
  metadata?: any;
}

interface SectionStats {
  sectionId: string;
  sectionTitle: string;
  totalQuestions: number;
  answeredQuestions: number;
  completionRate: number;
  responses: Response[];
}

// Helper function to format suggestions contextually
function formatSuggestionContext(suggestion: Suggestion): { prefix: string; category: string; priorityLabel: string } {
  const { type, metadata } = suggestion;
  
  let prefix = "";
  let category = "";
  let priorityLabel = "";

  // Determine priority label
  if (suggestion.priority >= 9) {
    priorityLabel = "Critical Priority";
  } else if (suggestion.priority >= 7) {
    priorityLabel = "High Priority";
  } else if (suggestion.priority >= 5) {
    priorityLabel = "Medium Priority";
  } else {
    priorityLabel = "Low Priority";
  }

  switch (type) {
    case "QUESTION":
      if (metadata && typeof metadata === 'object' && metadata !== null) {
        const meta = metadata as any;
        if (meta.questionText && meta.responseValue !== undefined) {
          prefix = `Based on response "${meta.responseValue}" to "${meta.questionText.substring(0, 40)}${meta.questionText.length > 40 ? '...' : ''}"`;
          category = "Question Response";
        } else {
          prefix = "Based on a specific question response";
          category = "Question Response";
        }
      } else {
        prefix = "Based on a specific question response";
        category = "Question Response";
      }
      break;
      
    case "SECTION":
      if (metadata && typeof metadata === 'object' && metadata !== null) {
        const meta = metadata as any;
        if (meta.sectionTitle && meta.sectionScore !== undefined) {
          const scorePercentage = Math.round(meta.sectionScore * 100);
          prefix = `Based on ${scorePercentage}% score in "${meta.sectionTitle}" section`;
          category = meta.sectionTitle;
        } else {
          prefix = "Based on section performance";
          category = "Section Analysis";
        }
      } else {
        prefix = "Based on section performance";
        category = "Section Analysis";
      }
      break;
      
    case "ASSESSMENT":
      if (metadata && typeof metadata === 'object' && metadata !== null) {
        const meta = metadata as any;
        if (meta.isStrategic) {
          if (meta.overallScore !== undefined) {
            const scorePercentage = Math.round(meta.overallScore * 100);
            prefix = `Based on overall assessment score of ${scorePercentage}%`;
          } else {
            prefix = "Based on overall assessment performance";
          }
          category = meta.category || "Strategic Recommendation";
        } else {
          if (meta.overallScore !== undefined) {
            const scorePercentage = Math.round(meta.overallScore * 100);
            prefix = `Based on overall score of ${scorePercentage}%`;
          } else {
            prefix = "Based on overall performance";
          }
          category = "Overall Assessment";
        }
      } else {
        prefix = "Based on overall performance";
        category = "Overall Assessment";
      }
      break;
      
    default:
      prefix = "Based on assessment";
      category = metadata?.category || type;
  }

  return { prefix, category, priorityLabel };
}

export default function OrganizationReport({ params }: OrganizationReportProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    fetchOrganizationData();
  }, [status, router, params.organizationId]);

  async function fetchOrganizationData() {
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}`);
      if (!response.ok) {
        router.push("/admin/dashboard");
        return;
      }
      const data = await response.json();
      setOrganization(data);
      calculateSectionStats(data);
    } catch (error) {
      console.error("Error fetching organization data:", error);
      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function calculateSectionStats(org: Organization) {
    const sections = new Map<string, SectionStats>();
    
    // Group responses by section
    org.assessments.forEach(assessment => {
      assessment.responses.forEach(response => {
        const sectionId = response.question.section.id;
        const sectionTitle = response.question.section.title;
        
        if (!sections.has(sectionId)) {
          sections.set(sectionId, {
            sectionId,
            sectionTitle,
            totalQuestions: 0,
            answeredQuestions: 0,
            completionRate: 0,
            responses: []
          });
        }
        
        const section = sections.get(sectionId)!;
        section.responses.push(response);
        
        // Count answered questions (non-null, non-empty responses)
        if (response.value !== null && response.value !== undefined && response.value !== "") {
          section.answeredQuestions++;
        }
        section.totalQuestions++;
      });
    });
    
    // Calculate completion rates
    sections.forEach(section => {
      section.completionRate = section.totalQuestions > 0 
        ? (section.answeredQuestions / section.totalQuestions) * 100 
        : 0;
    });
    
    setSectionStats(Array.from(sections.values()));
  }

  async function handleDownloadReport() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/admin/reports/${params.organizationId}/download`);
      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${organization?.name}-assessment-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setDownloading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cropper-green-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h1>
          <Link
            href="/admin/dashboard"
            className="text-cropper-green-600 hover:text-cropper-green-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedAssessments = organization.assessments.filter(a => a.status === "COMPLETED");
  const inProgressAssessments = organization.assessments.filter(a => a.status === "IN_PROGRESS");
  const totalResponses = organization.assessments.reduce((total, assessment) => 
    total + assessment.responses.length, 0
  );

  // Aggregate all suggestions for this organization
  const allSuggestions = organization.assessments
    .filter(a => a.report && a.report.suggestions)
    .flatMap(a => a.report!.suggestions);

  return (
    <div className="content-container section-spacing">
      <FadeIn>
        <div className="page-header">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-cropper-mint-600 hover:text-cropper-mint-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <motion.h1 
            className="page-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Organization Report
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {organization.name}
          </motion.p>
        </div>
      </FadeIn>

      {/* Organization Overview */}
      <div className="grid-stats mb-16">
        {[
          {
            title: "Total Assessments",
            value: organization.assessments.length,
            icon: BarChart,
            color: "blue",
            delay: 0,
            description: "All assessments created"
          },
          {
            title: "Completed",
            value: completedAssessments.length,
            icon: CheckCircle,
            color: "green",
            delay: 0.1,
            description: "Successfully finished"
          },
          {
            title: "In Progress",
            value: inProgressAssessments.length,
            icon: Clock,
            color: "orange",
            delay: 0.2,
            description: "Currently being worked on"
          },
          {
            title: "Total Responses",
            value: totalResponses,
            icon: Users,
            color: "purple",
            delay: 0.3,
            description: "All responses collected"
          }
        ].map((stat, index) => (
          <SlideIn key={index} direction="up" delay={stat.delay}>
            <Hover>
              <div className={`card border-${stat.color}-100 h-full`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-16 w-16 rounded-xl bg-cropper-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`h-8 w-8 text-cropper-${stat.color}-600`} />
                  </div>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold text-cropper-${stat.color}-800 mb-2`}>{stat.value}</h3>
                  <p className="text-subheading text-gray-900 mb-1">{stat.title}</p>
                  <p className="text-caption">{stat.description}</p>
                </div>
              </div>
            </Hover>
          </SlideIn>
        ))}
      </div>

      {/* Organization Suggestions */}
      {allSuggestions.length > 0 && (
        <ScaleIn delay={0.5}>
          <div className="card card-lg mb-16">
            <h2 className="text-heading mb-6 flex items-center">
              <Lightbulb className="h-6 w-6 mr-3 text-cropper-blue-600" />
              Generated Recommendations
            </h2>
            
            {/* Suggestion Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card border-blue-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-cropper-blue-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-cropper-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cropper-blue-800 mb-2">{allSuggestions.length}</h3>
                  <p className="text-subheading text-gray-900 mb-1">Total Recommendations</p>
                  <p className="text-caption">Generated across all assessments</p>
                </div>
              </div>

              <div className="card border-orange-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-cropper-orange-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-cropper-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cropper-orange-800 mb-2">
                    {allSuggestions.filter(s => s.priority >= 7).length}
                  </h3>
                  <p className="text-subheading text-gray-900 mb-1">High Priority</p>
                  <p className="text-caption">Critical and high priority items</p>
                </div>
              </div>

              <div className="card border-green-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-cropper-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-cropper-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cropper-green-800 mb-2">
                    {organization.assessments.filter(a => a.report && a.report.suggestions && a.report.suggestions.length > 0).length}
                  </h3>
                  <p className="text-subheading text-gray-900 mb-1">Assessments with Recommendations</p>
                  <p className="text-caption">Out of {completedAssessments.length} completed</p>
                </div>
              </div>
            </div>

            {/* Top Recommendations */}
            <div className="mb-8">
              <h3 className="text-subheading font-semibold mb-4">Top Priority Recommendations</h3>
              <div className="space-y-4">
                {allSuggestions
                  .sort((a, b) => b.priority - a.priority)
                  .slice(0, 8)
                  .map((suggestion, index) => {
                    const { prefix, category, priorityLabel } = formatSuggestionContext(suggestion);
                    
                    return (
                      <SlideIn key={suggestion.id} direction="up" delay={0.6 + index * 0.1}>
                        <Hover>
                          <div className="border rounded-lg p-4 hover:border-cropper-blue-300 transition-all duration-300">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-cropper-blue-100 rounded-full flex items-center justify-center">
                                  <Target className="h-4 w-4 text-cropper-blue-600" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded text-xs font-medium">
                                    {category}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    suggestion.priority >= 9 
                                      ? 'bg-red-100 text-red-800'
                                      : suggestion.priority >= 7
                                      ? 'bg-orange-100 text-orange-800'
                                      : suggestion.priority >= 5
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {priorityLabel}
                                  </span>
                                </div>
                                <div className="mb-1">
                                  <p className="text-xs text-gray-600 font-medium">{prefix}:</p>
                                </div>
                                <p className="text-gray-900 text-sm leading-relaxed">{suggestion.suggestion}</p>
                              </div>
                            </div>
                          </div>
                        </Hover>
                      </SlideIn>
                    );
                  })}
              </div>
            </div>

            {/* Recommendation Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['QUESTION', 'SECTION', 'ASSESSMENT'].map(type => {
                const typeSuggestions = allSuggestions.filter(s => s.type === type);
                const categoryName = type === 'QUESTION' ? 'Question-Based' :
                                   type === 'SECTION' ? 'Section-Based' :
                                   'Overall Assessment';
                
                if (typeSuggestions.length === 0) return null;
                
                const avgPriority = typeSuggestions.reduce((sum, s) => sum + s.priority, 0) / typeSuggestions.length;
                
                return (
                  <div key={type} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{categoryName}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Count:</span>
                        <span className="font-medium">{typeSuggestions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Priority:</span>
                        <span className="font-medium">{avgPriority.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Priority:</span>
                        <span className="font-medium text-orange-600">
                          {typeSuggestions.filter(s => s.priority >= 7).length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Section Statistics */}
      <ScaleIn delay={sectionStats.length > 0 ? 0.5 : 0.4}>
        <div className="card card-lg mb-16">
          <h2 className="text-heading mb-6">Section Completion Analysis</h2>
          <div className="space-y-4">
            {sectionStats.map((section, index) => (
              <SlideIn key={section.sectionId} direction="up" delay={0.6 + index * 0.1}>
                <Hover>
                  <div className="border rounded-lg p-4 hover:border-cropper-green-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-subheading">{section.sectionTitle}</h3>
                      <span className="text-sm font-medium text-gray-600">
                        {section.answeredQuestions} / {section.totalQuestions} questions
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Completion Rate</span>
                        <span>{section.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-cropper-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${section.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {section.responses.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p>Latest response: {new Date(section.responses[section.responses.length - 1]?.createdAt || '').toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </Hover>
              </SlideIn>
            ))}
          </div>
        </div>
      </ScaleIn>

      {/* Assessment Timeline */}
      <ScaleIn delay={0.6}>
        <div className="card card-lg">
          <h2 className="text-heading mb-6">Assessment Timeline</h2>
          <div className="space-y-4">
            {organization.assessments.map((assessment, index) => (
              <SlideIn key={assessment.id} direction="up" delay={index * 0.1}>
                <Hover>
                  <div className="border rounded-lg p-4 hover:border-cropper-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-subheading">
                          {assessment.name || `Assessment ${assessment.id.slice(0, 8)}`}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Started: {new Date(assessment.startedAt).toLocaleDateString()}
                          </span>
                          {assessment.completedAt && (
                            <span className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {assessment.responses.length} responses
                          </span>
                          {assessment.report && assessment.report.suggestions && (
                            <span className="flex items-center">
                              <Lightbulb className="h-4 w-4 mr-1" />
                              {assessment.report.suggestions.length} recommendations
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          assessment.status === "COMPLETED"
                            ? "bg-cropper-green-100 text-cropper-green-800"
                            : "bg-cropper-brown-100 text-cropper-brown-800"
                        }`}>
                          {assessment.status === "COMPLETED" ? "Completed" : "In Progress"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Hover>
              </SlideIn>
            ))}
          </div>
        </div>
      </ScaleIn>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-16">
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="bg-cropper-mint-600 text-white px-6 py-3 rounded-full hover:bg-cropper-mint-700 transition-colors duration-300 flex items-center justify-center"
        >
          {downloading ? (
            "Generating Report..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Full Report
            </>
          )}
        </button>
        
        <Link
          href="/admin/dashboard"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
} 