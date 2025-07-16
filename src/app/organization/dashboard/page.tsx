"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, Clock, Plus, ArrowRight, Calendar, AlertCircle, Download, Edit2, X } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";

interface Assessment {
  id: string;
  name?: string;
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

interface Organization {
  id: string;
  name: string;
  email: string;
}

export default function OrganizationDashboard() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAssessment, setEditingAssessment] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("org_token");
    if (token) {
      fetchOrganizationData(token);
    } else {
      router.push("/organization/login");
    }
  }, [router]);

  async function fetchOrganizationData(token: string) {
    try {
      const response = await fetch("/api/organizations/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setAssessments(data.assessments || []);
      } else {
        localStorage.removeItem("org_token");
        router.push("/organization/login");
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
      localStorage.removeItem("org_token");
      router.push("/organization/login");
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

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `assessment-report-${assessmentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  }

  async function handleStartNewAssessment() {
    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch("/api/organizations/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/assessment/${data.assessment.id}`);
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
    }
  }

  async function handleRenameAssessment(assessmentId: string, newName: string) {
    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch(`/api/organizations/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setAssessments(prev => 
          prev.map(a => 
            a.id === assessmentId ? { ...a, name: newName } : a
          )
        );
        setEditingAssessment(null);
        setEditingName("");
      }
    } catch (error) {
      console.error("Error renaming assessment:", error);
    }
  }

  function startEditing(assessment: Assessment) {
    setEditingAssessment(assessment.id);
    setEditingName(assessment.name || "");
  }

  function cancelEditing() {
    setEditingAssessment(null);
    setEditingName("");
  }

  async function handleDeleteAssessment(assessmentId: string) {
    // Find the assessment to check its status
    const assessment = assessments.find(a => a.id === assessmentId);
    
    // Prevent deletion of completed assessments
    if (assessment?.status === "COMPLETED") {
      alert("Completed assessments cannot be deleted.");
      return;
    }

    if (!confirm("Are you sure you want to delete this assessment? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch(`/api/organizations/assessments/${assessmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      } else {
        console.error("Failed to delete assessment");
      }
    } catch (error) {
      console.error("Error deleting assessment:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cropper-mint-600"></div>
      </div>
    );
  }

  return (
    <div className="content-container section-spacing">
      <FadeIn>
        <div className="page-header">
          <motion.h1 
            className="page-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Organization Dashboard
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Welcome back, <span className="font-semibold text-cropper-mint-700">{organization?.name}</span>
          </motion.p>
        </div>
      </FadeIn>

      <div className="grid-stats mb-16">
        {[
          {
            title: "Total Assessments",
            value: assessments.length,
            icon: FileText,
            color: "green",
            delay: 0,
            description: "All assessments created"
          },
          {
            title: "Completed",
            value: assessments.filter(a => a.status === "COMPLETED").length,
            icon: CheckCircle,
            color: "blue",
            delay: 0.1,
            description: "Successfully finished"
          },
          {
            title: "In Progress",
            value: assessments.filter(a => a.status === "IN_PROGRESS").length,
            icon: Clock,
            color: "brown",
            delay: 0.2,
            description: "Currently being worked on"
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

      <ScaleIn>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-heading mb-2">Your Assessments</h2>
              <p className="text-body">Manage and track your assessment progress</p>
            </div>
            <Hover>
              <button
                onClick={handleStartNewAssessment}
                className="btn-primary btn-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Start New Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </Hover>
          </div>
          
          {assessments.length === 0 ? (
            <div className="text-center py-16 card card-lg">
              <div className="w-24 h-24 bg-cropper-mint-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-cropper-mint-600" />
              </div>
              <h3 className="text-heading mb-4">No assessments yet</h3>
              <p className="text-body mb-8 max-w-md mx-auto">
                Get started by creating your first assessment to evaluate your organization's current state.
              </p>
              <Hover>
                <button
                  onClick={handleStartNewAssessment}
                  className="btn-primary btn-lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start Your First Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Hover>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {assessments.map((assessment, index) => (
                <SlideIn key={assessment.id} direction="right" delay={index * 0.1}>
                  <Hover>
                    <div className="card h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            {editingAssessment === assessment.id ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleRenameAssessment(assessment.id, editingName)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleRenameAssessment(assessment.id, editingName);
                                  } else if (e.key === "Escape") {
                                    cancelEditing();
                                  }
                                }}
                                className="text-xl font-semibold focus:outline-none border-b-2 border-gray-300 focus:border-cropper-mint-600 bg-transparent"
                                placeholder="Enter assessment name"
                                autoFocus
                              />
                            ) : (
                              <h3 className="text-subheading text-gray-900">
                                {assessment.name || `Assessment ${assessment.id.slice(0, 8)}`}
                              </h3>
                            )}
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                assessment.status === "COMPLETED"
                                  ? "bg-cropper-mint-100 text-cropper-mint-800"
                                  : "bg-cropper-brown-100 text-cropper-brown-800"
                              }`}
                            >
                              {assessment.status === "COMPLETED" ? "Completed" : "In Progress"}
                            </span>
                          </div>
                          
                          <div className="space-y-3 text-caption">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Started: {new Date(assessment.startedAt).toLocaleDateString()} at {new Date(assessment.startedAt).toLocaleTimeString()}</span>
                            </div>
                            {assessment.completedAt && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-cropper-mint-600" />
                                <span>Completed: {new Date(assessment.completedAt).toLocaleDateString()} at {new Date(assessment.completedAt).toLocaleTimeString()}</span>
                              </div>
                            )}
                            {assessment.status === "IN_PROGRESS" && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-cropper-brown-600" />
                                <span className="text-cropper-brown-600 font-medium">
                                  Progress saved - you can continue where you left off
                                </span>
                              </div>
                            )}
                            {assessment.status === "IN_PROGRESS" && (
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-red-600 text-xs">
                                  Some sections may have mandatory questions that need to be completed
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        {editingAssessment === assessment.id ? (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleRenameAssessment(assessment.id, editingName)}
                              className="btn-primary btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-4">
                              {assessment.status === "IN_PROGRESS" ? (
                                <>
                                  <button
                                    onClick={() => startEditing(assessment)}
                                    className="text-cropper-blue-600 hover:text-cropper-blue-700 font-medium"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => router.push(`/assessment/${assessment.id}`)}
                                    className="btn-primary"
                                  >
                                    Continue Assessment
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => router.push(`/assessment/${assessment.id}/report`)}
                                    className="nav-link flex items-center"
                                  >
                                    View Report
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadReport(assessment.id)}
                                    className="btn-secondary"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Report
                                  </button>
                                </>
                              )}
                            </div>
                            {assessment.status === "IN_PROGRESS" ? (
                              <button
                                onClick={() => handleDeleteAssessment(assessment.id)}
                                className="text-red-600 hover:text-red-700 font-medium flex items-center"
                                title="Delete assessment"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                className="text-gray-400 cursor-not-allowed flex items-center"
                                title="Completed assessments cannot be deleted"
                                disabled
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
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