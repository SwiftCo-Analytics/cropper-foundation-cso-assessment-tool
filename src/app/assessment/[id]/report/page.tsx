"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

interface AssessmentReportProps {
  params: {
    id: string;
  };
}

interface Assessment {
  id: string;
  name?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
  organization: {
    name: string;
  };
}

export default function AssessmentReport({ params }: AssessmentReportProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const response = await fetch(`/api/assessments/${params.id}`);
        if (!response.ok) {
          router.push("/organization/dashboard");
          return;
        }
        const data = await response.json();
        setAssessment(data);
      } catch (error) {
        console.error("Error loading assessment:", error);
        router.push("/organization/dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [params.id, router]);

  async function handleDownloadReport() {
    setDownloading(true);
    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch(`/api/organizations/assessments/${params.id}/report/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-report-${params.id}.pdf`;
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

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
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

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/organization/dashboard"
            className="inline-flex items-center text-cropper-mint-600 hover:text-cropper-mint-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Assessment Complete
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {assessment.organization.name}
              </p>
              {assessment.name && (
                <p className="mt-1 text-sm text-gray-600">
                  Assessment: {assessment.name}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-cropper-mint-600">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Assessment Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Started:</span>{" "}
                  {new Date(assessment.startedAt).toLocaleDateString()} at{" "}
                  {new Date(assessment.startedAt).toLocaleTimeString()}
                </p>
                {assessment.completedAt && (
                  <p>
                    <span className="font-medium">Completed:</span>{" "}
                    {new Date(assessment.completedAt).toLocaleDateString()} at{" "}
                    {new Date(assessment.completedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  assessment.status === "COMPLETED"
                    ? "bg-cropper-mint-100 text-cropper-mint-800"
                    : "bg-cropper-brown-100 text-cropper-brown-800"
                }`}>
                  {assessment.status === "COMPLETED" ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Next Steps
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Your assessment has been completed successfully. You can now download a detailed report 
              that includes your responses, scores, and recommendations for improving your organization's 
              CSO practices.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="bg-cropper-mint-600 text-white px-6 py-3 rounded-full hover:bg-cropper-mint-700 transition-colors duration-300 flex items-center justify-center"
              >
                {downloading ? (
                  "Downloading..."
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </button>
              
              <Link
                href="/organization/dashboard"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 