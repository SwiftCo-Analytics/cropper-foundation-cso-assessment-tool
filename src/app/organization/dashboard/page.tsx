"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, BarChart, ArrowRight } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";

interface Assessment {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
  responses: {
    questionId: string;
    value: any;
  }[];
  report?: {
    id: string;
    content: any;
  };
}

export default function OrganizationDashboard() {
  const router = useRouter();
  const [organization, setOrganization] = useState<any>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("org_token");
    if (!token) {
      router.replace("/organization/login");
      return;
    }

    fetchOrganizationData(token);
  }, [router]);

  async function fetchOrganizationData(token: string) {
    try {
      const response = await fetch("/api/organizations/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch organization data");
      }

      const data = await response.json();
      setOrganization(data.organization);
      setAssessments(data.assessments);
    } catch (error) {
      console.error("Error fetching organization data:", error);
      router.replace("/organization/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReport(assessmentId: string) {
    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch(`/api/organizations/assessments/${assessmentId}/report/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-report-${assessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cropper-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FadeIn>
        <div className="mb-8">
          <motion.h1 
            className="text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Organization Dashboard
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Welcome, {organization?.name}
          </motion.p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[
          {
            title: "Total Assessments",
            value: assessments.length,
            icon: FileText,
            color: "green",
            delay: 0
          },
          {
            title: "Completed",
            value: assessments.filter(a => a.status === "COMPLETED").length,
            icon: BarChart,
            color: "blue",
            delay: 0.1
          },
          {
            title: "In Progress",
            value: assessments.filter(a => a.status === "IN_PROGRESS").length,
            icon: FileText,
            color: "brown",
            delay: 0.2
          }
        ].map((stat, index) => (
          <SlideIn key={index} direction="up" delay={stat.delay}>
            <Hover>
              <div className={`bg-white rounded-xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-${stat.color}-100`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold text-cropper-${stat.color}-800`}>{stat.title}</h3>
                    <p className={`text-3xl font-bold text-cropper-${stat.color}-600`}>{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg bg-cropper-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-cropper-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            </Hover>
          </SlideIn>
        ))}
      </div>

      <ScaleIn>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Your Assessments</h2>
          
          {assessments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-soft p-8">
              <p className="text-gray-600 mb-6">No assessments found.</p>
              <Hover>
                <button
                  onClick={() => router.push("/assessment/new")}
                  className="bg-cropper-green-600 text-white px-6 py-3 rounded-full hover:bg-cropper-green-700 transition-colors duration-300 flex items-center mx-auto"
                >
                  Start New Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Hover>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {assessments.map((assessment, index) => (
                <SlideIn key={assessment.id} direction="right" delay={index * 0.1}>
                  <Hover>
                    <div className="bg-white rounded-xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium">
                              Assessment {assessment.id.slice(0, 8)}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                assessment.status === "COMPLETED"
                                  ? "bg-cropper-green-100 text-cropper-green-800"
                                  : "bg-cropper-brown-100 text-cropper-brown-800"
                              }`}
                            >
                              {assessment.status}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Started: {new Date(assessment.startedAt).toLocaleDateString()}</p>
                            {assessment.completedAt && (
                              <p>
                                Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {assessment.status === "IN_PROGRESS" ? (
                            <button
                              onClick={() => router.push(`/assessment/${assessment.id}`)}
                              className="bg-cropper-green-600 text-white px-6 py-2 rounded-full hover:bg-cropper-green-700 transition-colors duration-300 flex items-center"
                            >
                              Continue Assessment
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => router.push(`/assessment/${assessment.id}`)}
                                className="text-cropper-green-600 hover:text-cropper-green-700 font-medium flex items-center"
                              >
                                View Responses
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadReport(assessment.id)}
                                className="bg-cropper-blue-600 text-white px-6 py-2 rounded-full hover:bg-cropper-blue-700 transition-colors duration-300 flex items-center"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Hover>
                </SlideIn>
              ))}
            </div>
          )}
        </div>
      </ScaleIn>
    </div>
  );
} 