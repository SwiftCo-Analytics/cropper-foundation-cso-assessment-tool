"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuestionType } from "@/generated/prisma";
import { Loader2, Plus, Trash2, Edit2, MoveVertical, Download, Eye, EyeOff, X, ArrowRight, BarChart, CheckCircle, Clock, Settings, KeyRound, Copy, Check, Shield, UserPlus, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import Link from "next/link";

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  weight: number;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  description: string | null;
  type: QuestionType;
  options: string[] | null;
  order: number;
  weight: number;
  isHidden: boolean;
  mandatory: boolean;
}

interface OrgAssessment {
  id: string;
  name: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  assessments: OrgAssessment[];
}

const formatQuestionType = (type: QuestionType) => {
  const formatMap = {
    SINGLE_CHOICE: { label: "Single Choice", color: "blue" },
    MULTIPLE_CHOICE: { label: "Multiple Choice", color: "green" },
    TEXT: { label: "Text Input", color: "purple" },
    LIKERT_SCALE: { label: "Likert Scale", color: "orange" },
    BOOLEAN: { label: "Yes/No", color: "pink" }
  };

  return formatMap[type] || { label: type, color: "gray" };
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newSectionData, setNewSectionData] = useState({
    title: "",
    description: "",
    weight: 1.0,
  });
  const [newQuestionData, setNewQuestionData] = useState({
    text: "",
    description: "",
    type: "SINGLE_CHOICE" as QuestionType,
    options: "",
    weight: 1.0,
    mandatory: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orgPasswordResetData, setOrgPasswordResetData] = useState<{
    orgId: string;
    orgName: string;
    newPassword: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [isResettingOrgPassword, setIsResettingOrgPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [isDeletingOrg, setIsDeletingOrg] = useState<string | null>(null);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState<string | null>(null);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    fetchSections();
    fetchOrganizations();
  }, [status, router]);

  async function fetchSections() {
    try {
      const response = await fetch("/api/sections");
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }
      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrganizations() {
    try {
      const response = await fetch("/api/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const data = await response.json();
      setOrganizations(data);
      setFilteredOrganizations(data);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  }

  // Helper function to show success message temporarily
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000); // Hide after 3 seconds
  };

  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSectionData.title,
          description: newSectionData.description || null,
          order: sections.length,
        }),
      });

      if (response.ok) {
        setNewSectionData({ title: "", description: "", weight: 1.0 });
        setIsEditingSection(false);
        showSuccess("Section added successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error adding section:", error);
    }
  }

  async function handleUpdateSection(sectionId: string, data: Partial<Section>) {
    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showSuccess("Section updated successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error updating section:", error);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Are you sure you want to delete this section?")) return;
    
    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSelectedSection(null);
        showSuccess("Section deleted successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSection) return;

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedSection,
          text: newQuestionData.text,
          description: newQuestionData.description || null,
          type: newQuestionData.type,
          options: newQuestionData.type === "TEXT" ? null : newQuestionData.options.split(",").map(o => o.trim()),
          order: sections.find(s => s.id === selectedSection)?.questions.length || 0,
          isHidden: false,
          mandatory: newQuestionData.mandatory,
        }),
      });

      if (response.ok) {
        setNewQuestionData({
          text: "",
          description: "",
          type: "SINGLE_CHOICE",
          options: "",
          weight: 1.0,
          mandatory: false,
        });
        setShowNewQuestionForm(false);
        showSuccess("Question added successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error adding question:", error);
    }
  }

  async function handleUpdateQuestion(questionId: string, data: Partial<Question>) {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showSuccess("Question updated successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error updating question:", error);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    const question = sections
      .find(s => s.id === selectedSection)
      ?.questions.find(q => q.id === questionId);
    
    if (!question) return;
    
    if (!confirm(`Are you sure you want to delete the question "${question.text}"?`)) return;
    
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSuccess("Question deleted successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  }

  async function handleToggleQuestionVisibility(questionId: string, currentlyHidden: boolean) {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !currentlyHidden }),
      });

      if (response.ok) {
        showSuccess(`Question ${currentlyHidden ? 'shown' : 'hidden'} successfully!`);
        fetchSections();
      }
    } catch (error) {
      console.error("Error toggling question visibility:", error);
    }
  }

  async function handleReorderSection(sectionId: string, newOrder: number) {
    try {
      const response = await fetch(`/api/sections/${sectionId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });

      if (response.ok) {
        fetchSections();
      }
    } catch (error) {
      console.error("Error reordering section:", error);
    }
  }

  async function handleReorderQuestion(questionId: string, newOrder: number) {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });

      if (response.ok) {
        fetchSections();
      }
    } catch (error) {
      console.error("Error reordering question:", error);
    }
  }

  async function handleDownloadResponses(organizationId: string) {
    try {
      const response = await fetch(`/api/admin/reports/${organizationId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `organization-report-${organizationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading responses:", error);
    }
  }

  async function handleResetOrgPassword(orgId: string, orgName: string) {
    if (!confirm(`Are you sure you want to reset the password for ${orgName}? A new password will be generated and displayed.`)) {
      return;
    }

    setIsResettingOrgPassword(orgId);

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset-password" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setOrgPasswordResetData({
        orgId,
        orgName,
        newPassword: data.newPassword,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });

      showSuccess("Password reset successfully! The new password has been displayed.");
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsResettingOrgPassword(null);
    }
  }

  function handleCopyPassword() {
    if (orgPasswordResetData) {
      navigator.clipboard.writeText(orgPasswordResetData.newPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  }

  async function handleDeleteOrganization(orgId: string, orgName: string) {
    if (!confirm(`Are you sure you want to delete "${orgName}" and ALL of its assessments, responses, and reports? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingOrg(orgId);

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete organization");
      }

      showSuccess(`Organization "${orgName}" deleted successfully.`);
      fetchOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete organization");
    } finally {
      setIsDeletingOrg(null);
    }
  }

  async function handleDeleteAssessment(assessmentId: string, orgName: string) {
    if (!confirm(`Are you sure you want to delete this assessment for "${orgName}"? All responses and reports will be permanently deleted.`)) {
      return;
    }

    setIsDeletingAssessment(assessmentId);

    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete assessment");
      }

      showSuccess("Assessment deleted successfully.");
      fetchOrganizations();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete assessment");
    } finally {
      setIsDeletingAssessment(null);
    }
  }

  const recentSignups = [...organizations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const searchedOrganizations = filteredOrganizations.filter((org) => {
    if (!orgSearchQuery) return true;
    const query = orgSearchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.email.toLowerCase().includes(query)
    );
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  async function handleEditSection(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSection) return;

    try {
      const response = await fetch(`/api/sections/${editingSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingSection.title,
          description: editingSection.description,
        }),
      });

      if (response.ok) {
        setEditingSection(null);
        setIsEditingSection(false);
        showSuccess("Section updated successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error updating section:", error);
    }
  }

  async function handleEditQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      const response = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editingQuestion.text,
          description: editingQuestion.description,
          type: editingQuestion.type,
          options: editingQuestion.type === "TEXT" ? null : editingQuestion.options,
          mandatory: editingQuestion.mandatory,
        }),
      });

      if (response.ok) {
        setEditingQuestion(null);
        showSuccess("Question updated successfully!");
        fetchSections();
      }
    } catch (error) {
      console.error("Error updating question:", error);
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
            Admin Dashboard
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Welcome, {session?.user?.name}
          </motion.p>
          
          {/* Navigation */}
          <motion.div 
            className="flex space-x-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Link
              href="/admin/reports"
              className="btn-primary"
            >
              <BarChart className="mr-2 h-5 w-5" />
              View All Reports
            </Link>
            <Link
              href="/admin/suggestions"
              className="btn-secondary"
            >
              <Settings className="mr-2 h-5 w-5" />
              Manage Suggestions
            </Link>
            <Link
              href="/admin/admins"
              className="btn-secondary"
            >
              <Shield className="mr-2 h-5 w-5" />
              Manage Admins
            </Link>
          </motion.div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div 
            className="bg-cropper-mint-50 text-cropper-mint-800 p-4 rounded-lg mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-cropper-mint-600 hover:text-cropper-mint-800">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <motion.div 
            className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </FadeIn>

      {/* Sections Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-heading">Sections</h2>
            <Hover>
              <button
                onClick={() => setIsEditingSection(true)}
                className="btn-primary btn-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </button>
            </Hover>
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MoveVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <div>
                      <h3 className="text-subheading">{section.title}</h3>
                      {section.description && (
                        <p className="text-caption">{section.description}</p>
                      )}
                      <p className="text-caption">Weight: {Math.round(section.weight * 100)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingSection(section);
                        setIsEditingSection(true);
                      }}
                      className="text-cropper-blue-600 hover:text-cropper-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedSection(section.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSection === section.id
                          ? "bg-cropper-mint-100 text-cropper-mint-800"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {section.questions.length} questions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Management */}
        {selectedSection && (
          <FadeIn delay={0.3}>
            <div className="card card-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading">
                  Questions for {sections.find(s => s.id === selectedSection)?.title}
                </h2>
                <Hover>
                  <button
                    onClick={() => setShowNewQuestionForm(true)}
                    className="btn-primary btn-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </button>
                </Hover>
              </div>
              
              {/* Question Badge Legend */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-caption font-medium mb-2">Question Types:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Single Choice</span>
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Multiple Choice</span>
                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">Text Input</span>
                  <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">Likert Scale</span>
                  <span className="px-2 py-1 rounded-full bg-pink-100 text-pink-800 border border-pink-200">Yes/No</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">Hidden</span>
                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">Mandatory</span>
                </div>
              </div>

              <div className="space-y-4">
                {sections
                  .find(s => s.id === selectedSection)
                  ?.questions.sort((a, b) => a.order - b.order)
                  .map((question) => {
                    const typeInfo = formatQuestionType(question.type);
                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800 border border-${typeInfo.color}-200`}>
                                {typeInfo.label}
                              </span>
                              {question.isHidden && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                  Hidden
                                </span>
                              )}
                              {question.mandatory && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <h4 className="text-subheading mb-1">{question.text}</h4>
                            {question.description && (
                              <p className="text-caption mb-2">{question.description}</p>
                            )}
                            {question.options && question.options.length > 0 && (
                              <div className="text-caption">
                                <strong>Options:</strong> {question.options.join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleToggleQuestionVisibility(question.id, question.isHidden)}
                              className={`p-1 rounded ${
                                question.isHidden 
                                  ? "text-gray-600 hover:text-gray-800" 
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                              title={question.isHidden ? "Show question" : "Hide question"}
                            >
                              {question.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setEditingQuestion(question)}
                              className="text-cropper-blue-600 hover:text-cropper-blue-700 p-1 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </FadeIn>
        )}
      </div>

      {/* Recent Signups */}
      <SlideIn direction="up" delay={0.2}>
        <div className="mt-12">
          <div className="flex items-center space-x-3 mb-6">
            <UserPlus className="h-6 w-6 text-cropper-mint-600" />
            <h2 className="text-heading">Recent Organization Signups</h2>
          </div>
          {recentSignups.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-caption">No organizations have signed up yet.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Organization</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Signed Up</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Assessments</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignups.map((org) => {
                      const completedCount = org.assessments.filter(a => a.status === "COMPLETED").length;
                      return (
                        <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{org.name}</td>
                          <td className="py-3 px-4 text-gray-600">{org.email}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-gray-900">{formatDate(org.createdAt)}</span>
                              <span className="text-xs text-gray-500">{formatRelativeTime(org.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 bg-cropper-blue-50 text-cropper-blue-700 rounded-full text-xs font-medium">
                              {org.assessments.length}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              completedCount > 0
                                ? "bg-cropper-mint-50 text-cropper-mint-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {completedCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SlideIn>

      {/* Organizations Management */}
      <SlideIn direction="up" delay={0.3}>
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading">Organizations</h2>
            <div className="flex items-center space-x-3">
              <span className="text-caption">{searchedOrganizations.length} organizations</span>
              <input
                type="text"
                placeholder="Search organizations..."
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
                className="input-primary text-sm py-2 px-3 w-64"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchedOrganizations.map((org) => {
              const isExpanded = expandedOrg === org.id;
              const completedCount = org.assessments.filter(a => a.status === "COMPLETED").length;
              const inProgressCount = org.assessments.filter(a => a.status === "IN_PROGRESS").length;

              return (
                <div key={org.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-subheading truncate">{org.name}</h3>
                      <p className="text-caption truncate">{org.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Joined {formatDate(org.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-3">
                      <span className="px-3 py-1 bg-cropper-mint-100 text-cropper-mint-800 rounded-full text-sm font-medium whitespace-nowrap">
                        {org.assessments.length} assessments
                      </span>
                      {completedCount > 0 && (
                        <span className="flex items-center text-xs text-cropper-mint-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {completedCount} completed
                        </span>
                      )}
                      {inProgressCount > 0 && (
                        <span className="flex items-center text-xs text-cropper-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {inProgressCount} in progress
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Link
                      href={`/admin/reports/${org.id}`}
                      className="btn-primary btn-sm flex-1"
                    >
                      View Reports
                    </Link>
                    <button
                      onClick={() => handleResetOrgPassword(org.id, org.name)}
                      disabled={isResettingOrgPassword === org.id}
                      className="btn-secondary btn-sm"
                      title="Reset password"
                    >
                      {isResettingOrgPassword === org.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadResponses(org.id)}
                      className="btn-secondary btn-sm"
                      title="Download reports"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                      className="btn-secondary btn-sm"
                      title={isExpanded ? "Collapse" : "Manage assessments"}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Expanded Assessment Management */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Assessments</h4>
                      </div>

                      {org.assessments.length === 0 ? (
                        <p className="text-caption text-center py-2">No assessments</p>
                      ) : (
                        <div className="space-y-2">
                          {org.assessments.map((assessment) => (
                            <div
                              key={assessment.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                  {assessment.name || "Untitled Assessment"}
                                </p>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    assessment.status === "COMPLETED"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {assessment.status === "COMPLETED" ? (
                                      <><CheckCircle className="h-3 w-3 mr-0.5" /> Completed</>
                                    ) : (
                                      <><Clock className="h-3 w-3 mr-0.5" /> In Progress</>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(assessment.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteAssessment(assessment.id, org.name)}
                                disabled={isDeletingAssessment === assessment.id}
                                className="ml-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete assessment"
                              >
                                {isDeletingAssessment === assessment.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Delete Organization Button */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleDeleteOrganization(org.id, org.name)}
                          disabled={isDeletingOrg === org.id}
                          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {isDeletingOrg === org.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              <span>Delete Organization</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SlideIn>

      {/* Add Section Form */}
      {isEditingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ScaleIn>
            <div className="card card-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading">{editingSection ? "Edit Section" : "Add New Section"}</h3>
                <button
                  onClick={() => {
                    setIsEditingSection(false);
                    setEditingSection(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={editingSection ? handleEditSection : handleAddSection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={editingSection?.title || newSectionData.title}
                    onChange={(e) => 
                      editingSection 
                        ? setEditingSection({ ...editingSection, title: e.target.value })
                        : setNewSectionData({ ...newSectionData, title: e.target.value })
                    }
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editingSection?.description || newSectionData.description}
                    onChange={(e) => 
                      editingSection 
                        ? setEditingSection({ ...editingSection, description: e.target.value })
                        : setNewSectionData({ ...newSectionData, description: e.target.value })
                    }
                    className="input-primary"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    {editingSection ? "Update Section" : "Add Section"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSection(false);
                      setEditingSection(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      )}

      {/* Add Question Form */}
      {showNewQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ScaleIn>
            <div className="card card-lg max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading">Add New Question</h3>
                <button
                  onClick={() => setShowNewQuestionForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={newQuestionData.text}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, text: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newQuestionData.description}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, description: e.target.value })}
                    className="input-primary"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={newQuestionData.type}
                      onChange={(e) => setNewQuestionData({ ...newQuestionData, type: e.target.value as QuestionType })}
                      className="input-primary"
                    >
                      <option value="SINGLE_CHOICE">Single Choice</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TEXT">Text Input</option>
                      <option value="LIKERT_SCALE">Likert Scale</option>
                      <option value="BOOLEAN">Yes/No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated, for choice questions)
                    </label>
                    <input
                      type="text"
                      value={newQuestionData.options}
                      onChange={(e) => setNewQuestionData({ ...newQuestionData, options: e.target.value })}
                      className="input-primary"
                      placeholder="Option 1, Option 2, Option 3"
                      disabled={newQuestionData.type === "TEXT"}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="mandatory"
                    checked={newQuestionData.mandatory}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, mandatory: e.target.checked })}
                    className="h-4 w-4 text-cropper-mint-600 focus:ring-cropper-mint-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mandatory" className="text-sm font-medium text-gray-700">
                    This question is mandatory
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Add Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewQuestionForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      )}

      {/* Edit Question Form */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ScaleIn>
            <div className="card card-lg max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading">Edit Question</h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editingQuestion.description || ""}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
                    className="input-primary"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={editingQuestion.type}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                      className="input-primary"
                    >
                      <option value="SINGLE_CHOICE">Single Choice</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TEXT">Text Input</option>
                      <option value="LIKERT_SCALE">Likert Scale</option>
                      <option value="BOOLEAN">Yes/No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated, for choice questions)
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.options?.join(", ") || ""}
                      onChange={(e) => setEditingQuestion({ 
                        ...editingQuestion, 
                        options: e.target.value.split(",").map(o => o.trim()).filter(o => o)
                      })}
                      className="input-primary"
                      placeholder="Option 1, Option 2, Option 3"
                      disabled={editingQuestion.type === "TEXT"}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-mandatory"
                    checked={editingQuestion.mandatory}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, mandatory: e.target.checked })}
                    className="h-4 w-4 text-cropper-mint-600 focus:ring-cropper-mint-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-mandatory" className="text-sm font-medium text-gray-700">
                    This question is mandatory
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Update Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      )}

      {/* Organization Password Reset Success Modal */}
      {orgPasswordResetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ScaleIn>
            <div className="card card-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading">Password Reset Successful</h3>
                <button
                  onClick={() => {
                    setOrgPasswordResetData(null);
                    setPasswordCopied(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Password has been reset for <strong>{orgPasswordResetData.orgName}</strong>
                  </p>
                  {orgPasswordResetData.emailSent ? (
                    <p className="text-sm text-green-700">
                      ✓ An email with the new password has been sent to the organization.
                    </p>
                  ) : (
                    <div className="text-sm">
                      <p className="text-yellow-700 mb-2">
                        ⚠ Email could not be sent: {orgPasswordResetData.emailError || "Unknown error"}
                      </p>
                      <p className="text-gray-700">
                        Please share the password below with the organization manually.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Temporary Password:
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md p-3 font-mono text-lg text-center tracking-wider">
                      {orgPasswordResetData.newPassword}
                    </div>
                    <button
                      onClick={handleCopyPassword}
                      className="btn-secondary btn-sm px-3"
                      title="Copy password"
                    >
                      {passwordCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Important: The organization should change this password immediately after logging in.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setOrgPasswordResetData(null);
                      setPasswordCopied(false);
                    }}
                    className="btn-primary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      )}
    </div>
  );
} 