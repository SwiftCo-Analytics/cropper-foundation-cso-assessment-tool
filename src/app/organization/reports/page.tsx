"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { IgniteReportViewer } from "@/components/ui/ignite-report-viewer";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";

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
  suggestions: Array<{
    id: string;
    type: string;
    sourceId?: string;
    suggestion: string;
    priority: number;
    weight: number;
    metadata?: any;
  }>;
  organization: {
    name: string;
    email: string;
    createdAt: string;
  };
  latestAssessment: {
    id: string;
    name?: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    responses: Array<{
      id: string;
      value: any;
      question: {
        id: string;
        text: string;
        type: string;
        section: {
          id: string;
          title: string;
        };
      };
    }>;
  };
}

export default function OrganizationReports() {
  const router = useRouter();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  async function handleDownloadReport() {
    if (!reportsData?.latestAssessment) return;
    
    setDownloading(true);
    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch(`/api/organizations/assessments/${reportsData.latestAssessment.id}/report/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IGNITE-CSOs-Report-${reportsData.organization.name}-${new Date().toISOString().split('T')[0]}.pdf`;
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

  // Calculate CSO scores from the latest assessment
  const scores = reportsData.latestAssessment && reportsData.latestAssessment.status === "COMPLETED"
    ? CSOScoreCalculator.calculateCSOScores(reportsData.latestAssessment.responses)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/organization/dashboard"
          className="inline-flex items-center text-cropper-mint-600 hover:text-cropper-mint-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {scores ? (
        <IgniteReportViewer
          organizationName={reportsData.organization.name}
          assessmentDate={reportsData.latestAssessment.completedAt || reportsData.latestAssessment.startedAt}
          scores={scores}
          suggestions={reportsData.suggestions}
          assessmentId={reportsData.latestAssessment.id}
          onDownload={handleDownloadReport}
        />
      ) : (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">IGNITE CSOs</h1>
            <h2 className="text-2xl font-semibold mb-2">CSO Self-Assessment</h2>
            <h3 className="text-xl mb-4">Your Organisation's Report</h3>
            <h4 className="text-lg font-medium">{reportsData.organization.name}</h4>
          </div>

          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No Completed Assessment Found</h2>
            <p className="text-lg mb-6">
              To generate your IGNITE CSOs report, you need to complete at least one assessment.
            </p>
            <Link
              href="/assessment/new"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <span>Start New Assessment</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 