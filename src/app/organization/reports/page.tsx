"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart, Calendar, Users, CheckCircle, Clock, TrendingUp, TrendingDown, Target, Activity, Award, FileText } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import Link from "next/link";

interface ReportsData {
  overview: {
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    totalResponses: number;
    completionRate: number;
    recentAssessments: number;
    recentResponses: number;
  };
  assessmentScores: Array<{
    id: string;
    name: string;
    completedAt: string;
    averageScore: number;
    totalResponses: number;
    numericResponses: number;
  }>;
  sectionAnalysis: Array<{
    sectionId: string;
    sectionTitle: string;
    totalQuestions: number;
    totalResponses: number;
    completionRate: number;
    averageScore: number;
  }>;
  monthlyProgress: Record<string, { started: number; completed: number }>;
  improvementTrends: {
    hasImprovement: boolean;
    latestScore: number;
    previousScore: number;
    improvement: number;
  } | null;
  topResponsePatterns: Array<{
    questionId: string;
    questionText: string;
    sectionTitle: string;
    totalResponses: number;
    mostCommonResponse: string | null;
    mostCommonCount: number;
    averageScore: number;
    responseCounts: Record<string, number>;
  }>;
}

export default function OrganizationReports() {
  const router = useRouter();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("org_token");
    if (token) {
      fetchReportsData(token);
    } else {
      router.push("/organization/login");
    }
  }, [router]);

  async function fetchReportsData(token: string) {
    try {
      const response = await fetch("/api/organizations/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("org_token");
          router.push("/organization/login");
          return;
        }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cropper-mint-600"></div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Reports</h1>
          <Link
            href="/organization/dashboard"
            className="text-cropper-mint-600 hover:text-cropper-mint-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { overview, assessmentScores, sectionAnalysis, monthlyProgress, improvementTrends, topResponsePatterns } = reportsData;

  return (
    <div className="content-container section-spacing">
      <FadeIn>
        <div className="page-header">
          <Link
            href="/organization/dashboard"
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
            Your Organization Reports
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Track your progress and identify areas for improvement
          </motion.p>
        </div>
      </FadeIn>

      {/* Overview Statistics */}
      <div className="grid-stats mb-16">
        {[
          {
            title: "Total Assessments",
            value: overview.totalAssessments,
            icon: FileText,
            color: "blue",
            delay: 0,
            description: "All assessments created"
          },
          {
            title: "Completed",
            value: overview.completedAssessments,
            icon: CheckCircle,
            color: "green",
            delay: 0.1,
            description: "Successfully finished"
          },
          {
            title: "In Progress",
            value: overview.inProgressAssessments,
            icon: Clock,
            color: "brown",
            delay: 0.2,
            description: "Currently being worked on"
          },
          {
            title: "Completion Rate",
            value: `${overview.completionRate.toFixed(1)}%`,
            icon: Target,
            color: "blue",
            delay: 0.3,
            description: "Overall completion rate"
          },
          {
            title: "Total Responses",
            value: overview.totalResponses,
            icon: BarChart,
            color: "brown",
            delay: 0.4,
            description: "All responses collected"
          },
          {
            title: "Recent Activity",
            value: overview.recentAssessments,
            icon: Activity,
            color: "brown",
            delay: 0.5,
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

      {/* Improvement Trends */}
      {improvementTrends && (
        <ScaleIn delay={0.6}>
          <div className="card card-lg mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading">Progress Trends</h2>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                improvementTrends.hasImprovement 
                  ? 'bg-cropper-green-100 text-cropper-green-800' 
                  : 'bg-cropper-brown-100 text-cropper-brown-800'
              }`}>
                {improvementTrends.hasImprovement ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {improvementTrends.hasImprovement ? 'Improving' : 'Needs Attention'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-caption text-gray-600 mb-2">Latest Score</h3>
                <p className="text-3xl font-bold text-cropper-green-600">
                  {improvementTrends.latestScore.toFixed(1)}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-caption text-gray-600 mb-2">Previous Score</h3>
                <p className="text-3xl font-bold text-cropper-brown-600">
                  {improvementTrends.previousScore.toFixed(1)}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-caption text-gray-600 mb-2">Change</h3>
                <p className={`text-3xl font-bold ${
                  improvementTrends.improvement >= 0 
                    ? 'text-cropper-green-600' 
                    : 'text-cropper-brown-600'
                }`}>
                  {improvementTrends.improvement >= 0 ? '+' : ''}{improvementTrends.improvement.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Assessment Scores Timeline */}
      {assessmentScores.length > 0 && (
        <ScaleIn delay={0.7}>
          <div className="card card-lg mb-16">
            <h2 className="text-heading mb-6">Assessment Performance</h2>
            <div className="space-y-4">
              {assessmentScores.map((assessment, index) => (
                <SlideIn key={assessment.id} direction="up" delay={0.8 + index * 0.1}>
                  <Hover>
                    <div className="border rounded-lg p-4 hover:border-cropper-green-300 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-subheading font-semibold">
                            {assessment.name || `Assessment ${assessment.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-caption text-gray-600">
                            Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cropper-green-600">
                            {assessment.averageScore.toFixed(1)}
                          </div>
                          <div className="text-caption text-gray-600">
                            Average Score
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between text-sm text-gray-600">
                        <span>Total Responses: {assessment.totalResponses}</span>
                        <span>Numeric Responses: {assessment.numericResponses}</span>
                      </div>
                    </div>
                  </Hover>
                </SlideIn>
              ))}
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Section Analysis */}
      <ScaleIn delay={0.8}>
        <div className="card card-lg mb-16">
          <h2 className="text-heading mb-6">Section Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectionAnalysis.map((section, index) => (
              <SlideIn key={section.sectionId} direction="up" delay={0.9 + index * 0.1}>
                <Hover>
                  <div className="border rounded-lg p-4 hover:border-cropper-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-subheading">{section.sectionTitle}</h3>
                      <span className="text-sm font-medium text-gray-600">
                        {section.totalResponses} / {section.totalQuestions * overview.totalAssessments} responses
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
                    
                    {section.averageScore > 0 && (
                      <div className="text-sm text-gray-600">
                        <span>Average Score: {section.averageScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Hover>
              </SlideIn>
            ))}
          </div>
        </div>
      </ScaleIn>

      {/* Monthly Progress */}
      {Object.keys(monthlyProgress).length > 0 && (
        <ScaleIn delay={0.9}>
          <div className="card card-lg mb-16">
            <h2 className="text-heading mb-6">Monthly Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(monthlyProgress)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, data], index) => (
                  <SlideIn key={month} direction="up" delay={1.0 + index * 0.1}>
                    <Hover>
                      <div className="border rounded-lg p-4 hover:border-cropper-purple-300 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-subheading">
                            {new Date(month + '-01').toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </h3>
                          <Calendar className="h-5 w-5 text-cropper-purple-600" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Started:</span>
                            <span className="font-medium">{data.started}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Completed:</span>
                            <span className="font-medium text-cropper-green-600">{data.completed}</span>
                          </div>
                        </div>
                      </div>
                    </Hover>
                  </SlideIn>
                ))}
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Response Patterns */}
      {topResponsePatterns.length > 0 && (
        <ScaleIn delay={1.0}>
          <div className="card card-lg">
            <h2 className="text-heading mb-6">Common Response Patterns</h2>
            <div className="space-y-4">
              {topResponsePatterns.slice(0, 5).map((pattern, index) => (
                <SlideIn key={pattern.questionId} direction="up" delay={1.1 + index * 0.1}>
                  <Hover>
                    <div className="border rounded-lg p-4 hover:border-cropper-brown-300 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-subheading mb-2">{pattern.questionText}</h3>
                          <p className="text-caption text-gray-600 mb-3">{pattern.sectionTitle}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Total Responses:</span>
                              <span className="font-medium">{pattern.totalResponses}</span>
                            </div>
                            {pattern.mostCommonResponse && (
                              <div className="flex justify-between text-sm">
                                <span>Most Common:</span>
                                <span className="font-medium">{pattern.mostCommonResponse}</span>
                              </div>
                            )}
                            {pattern.averageScore > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>Average Score:</span>
                                <span className="font-medium">{pattern.averageScore.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Award className="h-6 w-6 text-cropper-brown-600 ml-4" />
                      </div>
                    </div>
                  </Hover>
                </SlideIn>
              ))}
            </div>
          </div>
        </ScaleIn>
      )}
    </div>
  );
} 