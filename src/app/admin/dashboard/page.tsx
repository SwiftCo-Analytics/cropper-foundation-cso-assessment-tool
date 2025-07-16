"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuestionType } from "@/generated/prisma";
import { Loader2, Plus, Trash2, Edit2, MoveVertical, Download, Eye, EyeOff, X, ArrowRight, BarChart, CheckCircle, Clock, Settings } from "lucide-react";
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

interface Organization {
  id: string;
  name: string;
  email: string;
  assessments: {
    id: string;
    completedAt: Date | null;
  }[];
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
              View Reports
            </Link>
            <Link
              href="/admin/suggestions"
              className="btn-secondary"
            >
              <Settings className="mr-2 h-5 w-5" />
              Manage Suggestions
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
                      <p className="text-caption">Weight: {section.weight}</p>
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

      {/* Organizations Overview */}
      <div className="mt-12">
        <h2 className="text-heading mb-6">Organizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div key={org.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-subheading">{org.name}</h3>
                  <p className="text-caption">{org.email}</p>
                </div>
                <span className="px-3 py-1 bg-cropper-mint-100 text-cropper-mint-800 rounded-full text-sm font-medium">
                  {org.assessments.length} assessments
                </span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/admin/reports/${org.id}`}
                  className="btn-primary btn-sm flex-1"
                >
                  View Reports
                </Link>
                <button
                  onClick={() => handleDownloadResponses(org.id)}
                  className="btn-secondary btn-sm"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  );
} 