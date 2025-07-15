"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuestionType } from "@/generated/prisma";
import { Loader2, Plus, Trash2, Edit2, MoveVertical, Download, Eye, EyeOff, X, ArrowRight } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  description: string | null;
  type: QuestionType;
  options: string[] | null;
  order: number;
  isHidden: boolean;
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
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newSectionData, setNewSectionData] = useState({
    title: "",
    description: "",
  });
  const [newQuestionData, setNewQuestionData] = useState({
    text: "",
    description: "",
    type: "SINGLE_CHOICE" as QuestionType,
    options: "",
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
        setNewSectionData({ title: "", description: "" });
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
        }),
      });

      if (response.ok) {
        setNewQuestionData({
          text: "",
          description: "",
          type: "SINGLE_CHOICE",
          options: "",
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

    if (!confirm(`Are you sure you want to delete the question: "${question.text}"? This action cannot be undone.`)) {
      return;
    }

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
    const question = sections
      .find(s => s.id === selectedSection)
      ?.questions.find(q => q.id === questionId);
    
    if (!question) return;

    if (!confirm(
      currentlyHidden 
        ? `Show the question: "${question.text}"?`
        : `Hide the question: "${question.text}"? Hidden questions won't be shown to organizations in the assessment.`
    )) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isHidden: !currentlyHidden
        }),
      });

      if (response.ok) {
        showSuccess(currentlyHidden ? "Question is now visible" : "Question is now hidden");
        fetchSections();
      }
    } catch (error) {
      console.error("Error updating question visibility:", error);
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
      const response = await fetch(`/api/questions/${questionId}/reorder`, {
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
      const response = await fetch(`/api/organizations/${organizationId}/responses/download`);
      if (!response.ok) throw new Error('Failed to download responses');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `responses-${organizationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading responses:", error);
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
          isHidden: editingQuestion.isHidden
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
            Admin Dashboard
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Welcome, {session?.user?.name}
          </motion.p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div 
            className="bg-cropper-green-50 text-cropper-green-800 p-4 rounded-lg mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-cropper-green-600 hover:text-cropper-green-800">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sections Panel */}
        <div className="lg:col-span-2">
          <ScaleIn>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Assessment Sections</h2>
                <Hover>
                  <button
                    onClick={() => setIsEditingSection(true)}
                    className="bg-cropper-green-600 text-white px-4 py-2 rounded-full hover:bg-cropper-green-700 transition-colors duration-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </button>
                </Hover>
              </div>

              {/* Section List */}
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <SlideIn key={section.id} direction="right" delay={index * 0.1}>
                    <Hover>
                      <div 
                        className={`bg-white border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                          selectedSection === section.id 
                            ? 'border-cropper-green-500 shadow-soft' 
                            : 'border-gray-200 hover:border-cropper-green-300'
                        }`}
                        onClick={() => setSelectedSection(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{section.title}</h3>
                            {section.description && (
                              <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                            )}
                            <p className="text-sm text-cropper-blue-600 mt-1">
                              {section.questions.length} questions
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(section.id);
                              }}
                              className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add edit section logic
                              }}
                              className="p-2 text-gray-500 hover:text-cropper-blue-600 transition-colors duration-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add reorder logic
                              }}
                              className="p-2 text-gray-500 hover:text-cropper-green-600 transition-colors duration-300"
                            >
                              <MoveVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Hover>
                  </SlideIn>
                ))}
              </div>
            </div>
          </ScaleIn>
        </div>

        {/* Organizations Panel */}
        <div>
          <ScaleIn delay={0.2}>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-2xl font-semibold mb-6">Organizations</h2>
              <div className="space-y-4">
                {organizations.map((org, index) => (
                  <SlideIn key={org.id} direction="left" delay={index * 0.1}>
                    <Hover>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-cropper-blue-300 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{org.name}</h3>
                            <p className="text-sm text-gray-600">{org.email}</p>
                            <p className="text-sm text-cropper-blue-600 mt-1">
                              {org.assessments.filter(a => a.completedAt).length} completed assessments
                            </p>
                          </div>
                          <Hover>
                            <button
                              onClick={() => handleDownloadResponses(org.id)}
                              className="text-cropper-blue-600 hover:text-cropper-blue-700 transition-colors duration-300 flex items-center"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </button>
                          </Hover>
                        </div>
                      </div>
                    </Hover>
                  </SlideIn>
                ))}
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>

      {/* Add/Edit Section Modal */}
      {isEditingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ScaleIn>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add New Section</h3>
                <button
                  onClick={() => setIsEditingSection(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddSection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newSectionData.title}
                    onChange={(e) => setNewSectionData({ ...newSectionData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newSectionData.description}
                    onChange={(e) => setNewSectionData({ ...newSectionData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingSection(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <Hover>
                    <button
                      type="submit"
                      className="bg-cropper-green-600 text-white px-6 py-2 rounded-full hover:bg-cropper-green-700 transition-colors duration-300"
                    >
                      Save Section
                    </button>
                  </Hover>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      )}

      {/* Selected Section Questions */}
      {selectedSection && (
        <FadeIn delay={0.3}>
          <div className="mt-8 bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                Questions for {sections.find(s => s.id === selectedSection)?.title}
              </h2>
              <Hover>
                <button
                  onClick={() => setShowNewQuestionForm(true)}
                  className="bg-cropper-blue-600 text-white px-4 py-2 rounded-full hover:bg-cropper-blue-700 transition-colors duration-300 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </Hover>
            </div>

            <div className="space-y-4">
              {sections
                .find(s => s.id === selectedSection)
                ?.questions.map((question, index) => (
                  <SlideIn key={question.id} direction="up" delay={index * 0.1}>
                    <Hover>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-cropper-blue-300 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-medium">{question.text}</h3>
                              {(() => {
                                const { label, color } = formatQuestionType(question.type);
                                return (
                                  <span className={`
                                    px-3 py-1.5 
                                    text-xs font-medium rounded-full 
                                    bg-${color}-100 text-${color}-800
                                    border border-${color}-200
                                    flex items-center gap-1.5
                                  `}>
                                    <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500`}></span>
                                    {label}
                                  </span>
                                );
                              })()}
                              {question.isHidden && (
                                <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                  Hidden
                                </span>
                              )}
                            </div>
                            {question.description && (
                              <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                            )}
                            {question.options && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">Options:</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                  {question.options.map((option, i) => (
                                    <li key={i}>{option}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleQuestionVisibility(question.id, question.isHidden)}
                              className={`p-2 transition-colors duration-300 ${
                                question.isHidden 
                                  ? "text-gray-400 hover:text-cropper-green-600" 
                                  : "text-cropper-green-600 hover:text-gray-400"
                              }`}
                              title={question.isHidden ? "Show question" : "Hide question"}
                            >
                              {question.isHidden ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingQuestion(question)}
                              className="p-2 text-gray-500 hover:text-cropper-blue-600 transition-colors duration-300"
                              title="Edit question"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-300"
                              title="Delete question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Hover>
                  </SlideIn>
                ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Add Question Form */}
      {showNewQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ScaleIn>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add New Question</h3>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(formatQuestionType).map(([type]) => {
                      const { label, color } = formatQuestionType(type as QuestionType);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewQuestionData({ ...newQuestionData, type: type as QuestionType })}
                          className={`
                            p-3 rounded-lg text-sm font-medium
                            flex items-center justify-center gap-2
                            transition-all duration-300
                            ${newQuestionData.type === type
                              ? `bg-${color}-100 text-${color}-800 border-${color}-200`
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }
                            border
                          `}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            newQuestionData.type === type
                              ? `bg-${color}-500`
                              : 'bg-gray-400'
                          }`}></span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {newQuestionData.type !== "TEXT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newQuestionData.options}
                      onChange={(e) => setNewQuestionData({ ...newQuestionData, options: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-blue-500 focus:border-transparent"
                      placeholder="Option 1, Option 2, Option 3"
                      required
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewQuestionForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <Hover>
                    <button
                      type="submit"
                      className="bg-cropper-blue-600 text-white px-6 py-2 rounded-full hover:bg-cropper-blue-700 transition-colors duration-300"
                    >
                      Add Question
                    </button>
                  </Hover>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ScaleIn>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">Edit Question</h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditQuestion} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-blue-500 focus:border-transparent text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editingQuestion.description || ""}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-blue-500 focus:border-transparent text-base"
                    rows={4}
                    placeholder="Add additional context or instructions for this question..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(formatQuestionType).map(([type]) => {
                      const { label, color } = formatQuestionType(type as QuestionType);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setEditingQuestion({ 
                            ...editingQuestion, 
                            type: type as QuestionType,
                            options: type === "TEXT" ? null : []
                          })}
                          className={`
                            p-4 rounded-lg text-sm font-medium
                            flex items-center justify-center gap-2
                            transition-all duration-300
                            ${editingQuestion.type === type
                              ? `bg-${color}-100 text-${color}-800 border-${color}-200`
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }
                            border
                          `}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            editingQuestion.type === type
                              ? `bg-${color}-500`
                              : 'bg-gray-400'
                          }`}></span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {editingQuestion.type !== "TEXT" && editingQuestion.type !== "BOOLEAN" && editingQuestion.type !== "LIKERT_SCALE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-3">
                      {editingQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(editingQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setEditingQuestion({
                                ...editingQuestion,
                                options: newOptions
                              });
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cropper-blue-500 focus:border-transparent"
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = editingQuestion.options?.filter((_, i) => i !== index);
                              setEditingQuestion({
                                ...editingQuestion,
                                options: newOptions
                              });
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion({
                            ...editingQuestion,
                            options: [...(editingQuestion.options || []), ""]
                          });
                        }}
                        className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-all duration-300"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <Hover>
                    <button
                      type="submit"
                      className="bg-cropper-blue-600 text-white px-8 py-2.5 rounded-full hover:bg-cropper-blue-700 transition-colors duration-300 font-medium"
                    >
                      Save Changes
                    </button>
                  </Hover>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      )}
    </div>
  );
} 