"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { IgniteReportViewer } from "@/components/ui/ignite-report-viewer";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";

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
  assessmentId: string;
  questionId: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
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

export default function OrganizationReport({ params }: OrganizationReportProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error("Error fetching organization data:", error);
      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
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
      a.download = `IGNITE-CSOs-Admin-Report-${organization?.name}-${new Date().toISOString().split('T')[0]}.pdf`;
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

  // Get the most recent completed assessment
  const latestAssessment = organization.assessments
    .filter(a => a.status === "COMPLETED")
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

  // Calculate CSO scores from the latest assessment
  const scores = latestAssessment && latestAssessment.responses.length > 0
    ? CSOScoreCalculator.calculateCSOScores(latestAssessment.responses)
    : null;

  // Get suggestions from the latest assessment
  const suggestions = latestAssessment?.report?.suggestions || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin/reports"
          className="inline-flex items-center text-cropper-green-600 hover:text-cropper-green-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Link>
      </div>

      {scores ? (
        <IgniteReportViewer
          organizationName={organization.name}
          assessmentDate={latestAssessment.completedAt || latestAssessment.startedAt}
          scores={scores}
          assessmentId={latestAssessment.id}
          suggestions={suggestions}
          onDownload={handleDownloadReport}
        />
      ) : (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">IGNITE CSOs</h1>
            <h2 className="text-2xl font-semibold mb-2">CSO Self-Assessment</h2>
            <h3 className="text-xl mb-4">Organization Report</h3>
            <h4 className="text-lg font-medium">{organization.name}</h4>
            <p className="text-sm opacity-90">Admin Dashboard Report</p>
          </div>

          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No Completed Assessment Found</h2>
            <p className="text-lg mb-6">
              This organization has not completed any assessments yet. To generate an IGNITE CSOs report, 
              the organization needs to complete at least one assessment.
            </p>
            <div className="text-sm text-gray-600">
              <p>Organization: {organization.name}</p>
              <p>Email: {organization.email}</p>
              <p>Created: {new Date(organization.createdAt).toLocaleDateString()}</p>
              <p>Total Assessments: {organization.assessments.length}</p>
              <p>Completed Assessments: {organization.assessments.filter(a => a.status === "COMPLETED").length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 