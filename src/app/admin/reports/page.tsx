"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-cropper-green-600 hover:text-cropper-green-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Title Page */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">IGNITE CSOs</h1>
          <h2 className="text-2xl font-semibold mb-2">CSO Self-Assessment</h2>
          <h3 className="text-xl mb-4">System-Wide Report</h3>
          <h4 className="text-lg font-medium">Admin Dashboard Report</h4>
          <p className="text-sm opacity-90">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        {/* System Overview */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            🔥 IGNITE CSOs System Overview
          </h2>
          <div className="space-y-2 text-lg">
            <p>Date of Report: {new Date().toLocaleDateString()}</p>
            <p>Assessment Tool Used: CPDC Accountability Assessment Tool for CSOs</p>
          </div>
        </div>

        {/* System Statistics */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📊 System Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Organizations</h3>
              <p className="text-3xl font-bold text-blue-600">{reportsData.overview.totalOrganizations}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Total Assessments</h3>
              <p className="text-3xl font-bold text-green-600">{reportsData.overview.totalAssessments}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Completed Assessments</h3>
              <p className="text-3xl font-bold text-purple-600">{reportsData.overview.completedAssessments}</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-600">{reportsData.overview.inProgressAssessments}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Total Responses</h3>
              <p className="text-3xl font-bold text-red-600">{reportsData.overview.totalResponses}</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-800 mb-2">Completion Rate</h3>
              <p className="text-3xl font-bold text-indigo-600">{reportsData.overview.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Average Performance */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📈 Average Performance Across All Organizations
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left">Assessment Area</th>
                  <th className="border border-gray-300 p-3 text-center">Average Score</th>
                  <th className="border border-gray-300 p-3 text-center">Max Score</th>
                  <th className="border border-gray-300 p-3 text-center">% Achieved</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Governing Body Accountability</td>
                  <td className="border border-gray-300 p-3 text-center">{reportsData.averageScores.governanceScore}</td>
                  <td className="border border-gray-300 p-3 text-center">115</td>
                  <td className="border border-gray-300 p-3 text-center">{Math.round(reportsData.averageScores.governancePercentage)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Financial Management</td>
                  <td className="border border-gray-300 p-3 text-center">{reportsData.averageScores.financialScore}</td>
                  <td className="border border-gray-300 p-3 text-center">50</td>
                  <td className="border border-gray-300 p-3 text-center">{Math.round(reportsData.averageScores.financialPercentage)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Programme/Project Accountability</td>
                  <td className="border border-gray-300 p-3 text-center">{reportsData.averageScores.programmeScore}</td>
                  <td className="border border-gray-300 p-3 text-center">30</td>
                  <td className="border border-gray-300 p-3 text-center">{Math.round(reportsData.averageScores.programmePercentage)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Human Resource Accountability</td>
                  <td className="border border-gray-300 p-3 text-center">{reportsData.averageScores.hrScore}</td>
                  <td className="border border-gray-300 p-3 text-center">20</td>
                  <td className="border border-gray-300 p-3 text-center">{Math.round(reportsData.averageScores.hrPercentage)}%</td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-gray-300 p-3">Total</td>
                  <td className="border border-gray-300 p-3 text-center">{reportsData.averageScores.totalScore}</td>
                  <td className="border border-gray-300 p-3 text-center">215</td>
                  <td className="border border-gray-300 p-3 text-center">{Math.round(reportsData.averageScores.totalPercentage)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Organizations */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🏆 Most Active Organizations
          </h2>
          
          <div className="space-y-4">
            {reportsData.mostActiveOrganizations.slice(0, 10).map((org, index) => (
              <div key={org.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{index + 1}. {org.name}</h3>
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
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📋 System-Wide Recommendations Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Recommendations</h3>
              <p className="text-2xl font-bold text-blue-600">{reportsData.suggestionAnalytics.coverage.totalSuggestions}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Organizations with Recommendations</h3>
              <p className="text-2xl font-bold text-green-600">{reportsData.suggestionAnalytics.coverage.organizationsWithSuggestions}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Coverage Rate</h3>
              <p className="text-2xl font-bold text-purple-600">{reportsData.suggestionAnalytics.coverage.coveragePercentage.toFixed(1)}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Avg per Organization</h3>
              <p className="text-2xl font-bold text-yellow-600">{reportsData.suggestionAnalytics.coverage.averageSuggestionsPerOrganization.toFixed(1)}</p>
            </div>
          </div>

          {/* Top Recommendations */}
          <h3 className="text-xl font-semibold mb-4">🔝 Top System-Wide Recommendations</h3>
          <div className="space-y-3">
            {reportsData.suggestionAnalytics.mostCommonSuggestions.slice(0, 10).map((suggestion, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{index + 1}. {suggestion.suggestion}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: {suggestion.type} | 
                      Organizations: {suggestion.organizationCount} | Prevalence: {suggestion.prevalence.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <div className="p-8 bg-gray-50 border-t">
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>{downloading ? 'Generating PDF...' : 'Download System Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 