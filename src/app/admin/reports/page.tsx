"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { RecommendationsBarChart, RecommendationsByCategoryChart, SimpleBarChart } from "@/components/ui/charts";

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
      suggestionsByCategory: Record<string, number>;
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
      type: string;
      title: string;
      description: string;
      impact: string;
      recommendations: string[];
    }>;
  };
  averageScores: {
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
      a.download = `IGNITE-CSOs-System-Report-${new Date().toISOString().split('T')[0]}.pdf`;
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-cropper-green-600 hover:text-cropper-green-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-soft rounded-2xl border border-cropper-green-200 overflow-hidden">
        {/* Title Page */}
        <div className="relative text-white">
          <div className="absolute inset-0 bg-cropper-green-400"></div>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.4),transparent_60%)]"></div>
          <div className="absolute inset-0 bg-black/15"></div>
          <div className="relative p-12 sm:p-16 text-center">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm ring-1 ring-white/20">Admin Dashboard Report</span>
              <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold tracking-tight drop-shadow-md">IGNITE CSOs</h1>
              <h2 className="mt-2 text-xl sm:text-2xl font-display font-semibold drop-shadow-sm">CSO Self-Assessment</h2>
              <h3 className="mt-3 text-lg sm:text-xl font-medium text-white/90 drop-shadow-sm">System-Wide Report</h3>
              <p className="mt-4 text-sm text-white/90 drop-shadow-sm">Generated on: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="p-8 border-b bg-gray-50">
          <h2 className="text-2xl font-display font-bold mb-2 text-gray-900">IGNITE CSOs System Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="card">
              <p className="text-caption">Date of Report</p>
              <p className="text-lg font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="card">
              <p className="text-caption">Assessment Tool</p>
              <p className="text-lg font-medium text-gray-900">CPDC Accountability Assessment Tool for CSOs</p>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-display font-bold mb-6 text-gray-900">System Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Organizations</h3>
              <p className="text-3xl font-bold text-cropper-green-700">{reportsData.overview.totalOrganizations}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Assessments</h3>
              <p className="text-3xl font-bold text-cropper-green-700">{reportsData.overview.totalAssessments}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Completed Assessments</h3>
              <p className="text-3xl font-bold text-cropper-green-700">{reportsData.overview.completedAssessments}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">In Progress</h3>
              <p className="text-3xl font-bold text-cropper-green-700">{reportsData.overview.inProgressAssessments}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Responses</h3>
              <p className="text-3xl font-bold text-cropper-green-700">{reportsData.overview.totalResponses}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Completion Rate</h3>
              <p className="text-3xl font-bold text-cropper-green-700">{reportsData.overview.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Average Performance */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-display font-bold mb-2 text-gray-900">Average Performance Across All Organizations</h2>
          <p className="text-caption mb-4">Scores and percentages per assessment area</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-soft">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="p-3 text-left">Assessment Area</th>
                  <th className="p-3 text-center">Average Score</th>
                  <th className="p-3 text-center">Max Score</th>
                  <th className="p-3 text-center">% Achieved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="p-3 font-medium">Governing Body Accountability</td>
                  <td className="p-3 text-center">{reportsData.averageScores.governanceScore}</td>
                  <td className="p-3 text-center">115</td>
                  <td className="p-3 text-center">{Math.round(reportsData.averageScores.governancePercentage)}%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Financial Management</td>
                  <td className="p-3 text-center">{reportsData.averageScores.financialScore}</td>
                  <td className="p-3 text-center">50</td>
                  <td className="p-3 text-center">{Math.round(reportsData.averageScores.financialPercentage)}%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Programme/Project Accountability</td>
                  <td className="p-3 text-center">{reportsData.averageScores.programmeScore}</td>
                  <td className="p-3 text-center">30</td>
                  <td className="p-3 text-center">{Math.round(reportsData.averageScores.programmePercentage)}%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Human Resource Accountability</td>
                  <td className="p-3 text-center">{reportsData.averageScores.hrScore}</td>
                  <td className="p-3 text-center">20</td>
                  <td className="p-3 text-center">{Math.round(reportsData.averageScores.hrPercentage)}%</td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-center">{reportsData.averageScores.totalScore}</td>
                  <td className="p-3 text-center">215</td>
                  <td className="p-3 text-center">{Math.round(reportsData.averageScores.totalPercentage)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Organizations */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-display font-bold mb-6 text-gray-900">Most Active Organizations</h2>
          <div className="space-y-4">
            {reportsData.mostActiveOrganizations.slice(0, 10).map((org, index) => (
              <div key={org.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{index + 1}. {org.name}</h3>
                    <p className="text-sm text-gray-600">{org.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Assessments: {org.assessmentCount} ({org.completedCount} completed)</p>
                    <p className="text-sm text-gray-600">Total Responses: {org.responseCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Summary */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-display font-bold mb-6 text-gray-900">System-Wide Recommendations Summary</h2>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <h3 className="font-semibold text-md text-gray-900">Total Recommendations</h3>
              <p className="text-lg font-bold text-cropper-green-700">{reportsData.suggestionAnalytics.coverage.totalSuggestions}</p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-md text-gray-900">Organizations with Recommendations</h3>
              <p className="text-lg font-bold text-cropper-green-700">{reportsData.suggestionAnalytics.coverage.organizationsWithSuggestions}</p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-md text-gray-900">Coverage Rate</h3>
              <p className="text-lg font-bold text-cropper-green-700">{reportsData.suggestionAnalytics.coverage.coveragePercentage.toFixed(1)}%</p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-m text-gray-900">Avg. Recommendations per Organization</h3>
              <p className="text-lg font-bold text-cropper-green-700">{reportsData.suggestionAnalytics.coverage.averageSuggestionsPerOrganization.toFixed(1)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="card">
              <RecommendationsBarChart
                title="Top System-Wide Recommendations"
                data={reportsData.suggestionAnalytics.mostCommonSuggestions.slice(0, 10)}
                height={360}
              />
            </div>
            <div className="card">
              <RecommendationsByCategoryChart
                title="Recommendations by Category"
                data={reportsData.suggestionAnalytics.mostCommonSuggestions}
                height={360}
              />
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="p-8 bg-gray-50 border-t">
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="btn-primary disabled:bg-gray-400"
          >
            <Download className="h-5 w-5" />
            <span>{downloading ? 'Generating PDF...' : 'Download System Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 