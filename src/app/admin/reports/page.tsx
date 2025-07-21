"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  BarChart, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity,
  Target,
  PieChart,
  FileText,
  Eye,
  Award,
  Lightbulb,
  AlertTriangle,
  TrendingDown
} from "lucide-react";

const formatQuestionType = (type: string) => {
  const formatMap: Record<string, { label: string; color: string }> = {
    SINGLE_CHOICE: { label: "Single Choice", color: "green" },
    MULTIPLE_CHOICE: { label: "Multiple Choice", color: "blue" },
    TEXT: { label: "Text Input", color: "brown" },
    LIKERT_SCALE: { label: "Likert Scale", color: "green" },
    BOOLEAN: { label: "Yes/No", color: "blue" },
    YES_NO: { label: "Yes/No", color: "blue" }
  };

  return formatMap[type] || { label: type, color: "brown" };
};
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import Link from "next/link";

interface ReportsData {
  overview: {
    totalOrganizations: number;
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    totalResponses: number;
    completionRate: number;
    recentAssessments: number;
    recentResponses: number;
  };
  mostActiveOrganizations: Array<{
    id: string;
    name: string;
    email: string;
    assessmentCount: number;
    completedCount: number;
    responseCount: number;
  }>;
  topQuestions: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    sectionTitle: string;
    totalResponses: number;
    mostCommonResponse: string | null;
    mostCommonCount: number;
    averageScore: number;
    responseCounts: Record<string, number>;
  }>;
  sectionAnalysis: Array<{
    sectionId: string;
    sectionTitle: string;
    totalQuestions: number;
    totalResponses: number;
    completionRate: number;
    averageScore: number;
  }>;
  monthlyActivity: Record<string, number>;
  suggestionAnalytics: {
    coverage: {
      totalSuggestions: number;
      organizationsWithSuggestions: number;
      coveragePercentage: number;
      averageSuggestionsPerOrganization: number;
      suggestionsByType: Record<string, number>;
      suggestionsByPriority: Record<string, number>;
    };
    mostCommonSuggestions: Array<{
      suggestion: string;
      type: string;
      count: number;
      organizationCount: number;
      averagePriority: number;
      prevalence: number;
    }>;
    insights: Array<{
      title: string;
      value: string | number;
      description: string;
    }>;
  };
}

export default function AdminReports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    fetchReportsData();
  }, [status, router]);

  async function fetchReportsData() {
    try {
      const response = await fetch("/api/admin/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports data");
      }
      const data = await response.json();
      setReportsData(data);
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReport() {
    setDownloading(true);
    try {
      const response = await fetch("/api/admin/reports/download");
      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin-reports-${new Date().toISOString().split('T')[0]}.pdf`;
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

  if (!reportsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Reports</h1>
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

  const { overview, mostActiveOrganizations, topQuestions, sectionAnalysis, monthlyActivity, suggestionAnalytics } = reportsData;

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
            General Reports
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Comprehensive analytics across all organizations
          </motion.p>
        </div>
      </FadeIn>

      {/* Overview Statistics */}
      <div className="grid-stats mb-16">
        {[
          {
            title: "Total Organizations",
            value: overview.totalOrganizations,
            icon: Users,
            color: "blue",
            delay: 0,
            description: "Registered organizations"
          },
          {
            title: "Total Assessments",
            value: overview.totalAssessments,
            icon: FileText,
            color: "green",
            delay: 0.1,
            description: "All assessments created"
          },
          {
            title: "Completed",
            value: overview.completedAssessments,
            icon: CheckCircle,
            color: "green",
            delay: 0.2,
            description: "Successfully finished"
          },
          {
            title: "In Progress",
            value: overview.inProgressAssessments,
            icon: Clock,
            color: "brown",
            delay: 0.3,
            description: "Currently being worked on"
          },
          {
            title: "Completion Rate",
            value: `${overview.completionRate.toFixed(1)}%`,
            icon: Target,
            color: "blue",
            delay: 0.4,
            description: "Overall completion rate"
          },
          {
            title: "Total Responses",
            value: overview.totalResponses,
            icon: BarChart,
            color: "brown",
            delay: 0.5,
            description: "All responses collected"
          },
          {
            title: "Recent Activity",
            value: overview.recentAssessments,
            icon: Activity,
            color: "brown",
            delay: 0.6,
            description: "Last 30 days"
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

      {/* Suggestion Analytics */}
      {suggestionAnalytics && suggestionAnalytics.coverage.totalSuggestions > 0 && (
        <ScaleIn delay={0.8}>
          <div className="card card-lg mb-16">
            <h2 className="text-heading mb-6 flex items-center">
              <Lightbulb className="h-6 w-6 mr-3 text-cropper-blue-600" />
              Suggestion Analytics
            </h2>
            
            {/* Suggestion Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {suggestionAnalytics.insights.map((insight, index) => (
                <SlideIn key={insight.title} direction="up" delay={0.9 + index * 0.1}>
                  <Hover>
                    <div className="card border-blue-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-12 w-12 rounded-lg bg-cropper-blue-100 flex items-center justify-center`}>
                          {insight.title.includes('Priority') ? (
                            <AlertTriangle className="h-6 w-6 text-cropper-blue-600" />
                          ) : insight.title.includes('Organizations') ? (
                            <Users className="h-6 w-6 text-cropper-blue-600" />
                          ) : (
                            <Lightbulb className="h-6 w-6 text-cropper-blue-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-cropper-blue-800 mb-2">{insight.value}</h3>
                        <p className="text-subheading text-gray-900 mb-1">{insight.title}</p>
                        <p className="text-caption">{insight.description}</p>
                      </div>
                    </div>
                  </Hover>
                </SlideIn>
              ))}
            </div>

            {/* Most Common Suggestions */}
            <div className="mb-8">
              <h3 className="text-subheading font-semibold mb-4">Most Common Recommendations</h3>
              <div className="space-y-4">
                {suggestionAnalytics.mostCommonSuggestions.slice(0, 5).map((suggestion, index) => (
                  <SlideIn key={index} direction="up" delay={1.2 + index * 0.1}>
                    <Hover>
                      <div className="border rounded-lg p-4 hover:border-cropper-blue-300 transition-all duration-300">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-cropper-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-cropper-blue-600">{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded text-xs font-medium">
                                {suggestion.type === 'QUESTION' ? 'Question-Based' :
                                 suggestion.type === 'SECTION' ? 'Section-Based' :
                                 suggestion.type === 'ASSESSMENT' ? 'Overall Assessment' : suggestion.type}
                              </span>
                              <span className="px-2 py-1 bg-cropper-green-100 text-cropper-green-800 rounded text-xs font-medium">
                                {suggestion.count} organizations ({suggestion.prevalence}%)
                              </span>
                              <span className="px-2 py-1 bg-cropper-orange-100 text-cropper-orange-800 rounded text-xs font-medium">
                                Avg Priority: {suggestion.averagePriority}
                              </span>
                            </div>
                            <p className="text-gray-900 text-sm leading-relaxed">{suggestion.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    </Hover>
                  </SlideIn>
                ))}
              </div>
            </div>

            {/* Suggestion Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Type */}
              <div>
                <h4 className="text-subheading font-medium mb-3">By Category</h4>
                <div className="space-y-2">
                  {Object.entries(suggestionAnalytics.coverage.suggestionsByType).map(([type, count]) => {
                    const percentage = Math.round((count / suggestionAnalytics.coverage.totalSuggestions) * 100);
                    const categoryName = type === 'QUESTION' ? 'Question-Based' :
                                        type === 'SECTION' ? 'Section-Based' :
                                        type === 'ASSESSMENT' ? 'Overall Assessment' : type;
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{categoryName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-cropper-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Priority */}
              <div>
                <h4 className="text-subheading font-medium mb-3">By Priority Level</h4>
                <div className="space-y-2">
                  {Object.entries(suggestionAnalytics.coverage.suggestionsByPriority).map(([priority, count]) => {
                    const percentage = Math.round((count / suggestionAnalytics.coverage.totalSuggestions) * 100);
                    
                    return (
                      <div key={priority} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className={`text-sm font-medium ${
                          priority === 'Critical' ? 'text-red-700' :
                          priority === 'High' ? 'text-orange-700' :
                          priority === 'Medium' ? 'text-yellow-700' : 'text-green-700'
                        }`}>{priority} Priority</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                priority === 'Critical' ? 'bg-red-500' :
                                priority === 'High' ? 'bg-orange-500' :
                                priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Most Active Organizations */}
      <div className="mb-16">
        <motion.h2 
          className="text-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          Most Active Organizations
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mostActiveOrganizations.map((org, index) => (
            <SlideIn key={org.id} direction="up" delay={0.7 + index * 0.1}>
              <Hover>
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-subheading font-semibold">{org.name}</h3>
                      <p className="text-caption text-gray-600">{org.email}</p>
                    </div>
                    <Award className="h-6 w-6 text-cropper-green-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Assessments:</span>
                      <span className="font-medium">{org.assessmentCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium text-cropper-green-600">{org.completedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Responses:</span>
                      <span className="font-medium">{org.responseCount}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/admin/reports/${org.id}`}
                      className="btn-primary btn-sm w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </div>
                </div>
              </Hover>
            </SlideIn>
          ))}
        </div>
      </div>

      {/* Top Questions Analysis */}
      <div className="mb-16">
        <motion.h2 
          className="text-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          Most Answered Questions
        </motion.h2>
        <div className="space-y-4">
          {topQuestions.slice(0, 10).map((question, index) => (
            <SlideIn key={question.questionId} direction="up" delay={0.9 + index * 0.1}>
              <Hover>
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-subheading font-semibold mb-2">{question.questionText}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                         <span className="bg-cropper-blue-100 text-cropper-blue-800 px-2 py-1 rounded">
                           {question.sectionTitle}
                         </span>
                         <span className={`bg-cropper-${formatQuestionType(question.questionType).color}-100 text-cropper-${formatQuestionType(question.questionType).color}-800 px-2 py-1 rounded`}>
                           {formatQuestionType(question.questionType).label}
                         </span>
                       </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Responses:</span>
                          <div className="font-semibold">{question.totalResponses}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Most Common:</span>
                          <div className="font-semibold">{question.mostCommonResponse || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Count:</span>
                          <div className="font-semibold text-cropper-green-600">{question.mostCommonCount}</div>
                        </div>
                        {question.averageScore > 0 && (
                          <div>
                            <span className="text-gray-600">Avg Score:</span>
                            <div className="font-semibold">{question.averageScore.toFixed(1)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Hover>
            </SlideIn>
          ))}
        </div>
      </div>

      {/* Section Analysis */}
      <div className="mb-16">
        <motion.h2 
          className="text-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0 }}
        >
          Section Completion Analysis
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionAnalysis.map((section, index) => (
            <SlideIn key={section.sectionId} direction="up" delay={1.1 + index * 0.1}>
              <Hover>
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-subheading font-semibold">{section.sectionTitle}</h3>
                    <PieChart className="h-6 w-6 text-cropper-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Questions:</span>
                      <span className="font-medium">{section.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Responses:</span>
                      <span className="font-medium">{section.totalResponses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completion:</span>
                      <span className="font-medium text-cropper-green-600">
                        {section.completionRate != null ? section.completionRate.toFixed(1) : 0.00}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                         className="bg-cropper-green-600 h-2 rounded-full transition-all duration-300"
                         style={{ width: `${Math.min(section.completionRate, 100)}%` }}
                       ></div>
                    </div>
                  </div>
                </div>
              </Hover>
            </SlideIn>
          ))}
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="mb-16">
        <motion.h2 
          className="text-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2 }}
        >
          Monthly Activity Trends
        </motion.h2>
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-cropper-green-600" />
              <span className="text-subheading font-semibold">Assessment Activity</span>
            </div>
          </div>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {Object.entries(monthlyActivity).map(([month, count]) => (
              <div key={month} className="text-center">
                <div className="text-xs text-gray-600 mb-1">
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                </div>
                <div className="bg-cropper-green-100 rounded p-2">
                  <div className="text-sm font-semibold text-cropper-green-800">{count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <SlideIn direction="up" delay={1.4}>
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="btn-primary"
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
        </SlideIn>
      </div>
    </div>
  );
} 