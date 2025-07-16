"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuestionType, SuggestionType } from "@/generated/prisma";
import { 
  Loader2, Plus, Trash2, Edit2, Save, X, ArrowRight, ArrowLeft,
  Settings, Target, Layers, FileText, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, ChevronUp, Star, Weight, BarChart
} from "lucide-react";
import Link from "next/link";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  weight: number;
  questions: Question[];
  suggestions: SectionSuggestion[];
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
  suggestions: QuestionSuggestion[];
}

interface QuestionSuggestion {
  id: string;
  questionId: string;
  condition: any;
  suggestion: string;
  priority: number;
  weight: number;
  isActive: boolean;
}

interface SectionSuggestion {
  id: string;
  sectionId: string;
  condition: any;
  suggestion: string;
  priority: number;
  weight: number;
  isActive: boolean;
}

interface AssessmentSuggestion {
  id: string;
  condition: any;
  suggestion: string;
  priority: number;
  weight: number;
  isActive: boolean;
}

export default function SuggestionsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [assessmentSuggestions, setAssessmentSuggestions] = useState<AssessmentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'sections' | 'assessment'>('questions');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide] = useState(true);
  
  // Form states
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Form data
  const [questionSuggestionData, setQuestionSuggestionData] = useState({
    condition: { value: '', operator: 'equals' },
    suggestion: '',
    priority: 0,
    weight: 1.0,
    isActive: true
  });

  const [sectionSuggestionData, setSectionSuggestionData] = useState({
    condition: { minScore: 0, maxScore: 1 },
    suggestion: '',
    priority: 0,
    weight: 1.0,
    isActive: true
  });

  const [assessmentSuggestionData, setAssessmentSuggestionData] = useState({
    condition: { overallScore: { min: 0, max: 1 } },
    suggestion: '',
    priority: 0,
    weight: 1.0,
    isActive: true
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    fetchData();
  }, [status, router]);

  async function fetchData() {
    try {
      const [sectionsResponse, assessmentSuggestionsResponse] = await Promise.all([
        fetch("/api/sections"),
        fetch("/api/suggestions/assessment")
      ]);

      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData);
      }

      if (assessmentSuggestionsResponse.ok) {
        const assessmentData = await assessmentSuggestionsResponse.json();
        setAssessmentSuggestions(assessmentData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  async function handleAddQuestionSuggestion(questionId: string) {
    try {
      const response = await fetch("/api/suggestions/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          ...questionSuggestionData
        }),
      });

      if (response.ok) {
        setQuestionSuggestionData({
          condition: { value: '', operator: 'equals' },
          suggestion: '',
          priority: 0,
          weight: 1.0,
          isActive: true
        });
        setShowQuestionForm(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error adding question suggestion:", error);
    }
  }

  async function handleAddSectionSuggestion(sectionId: string) {
    try {
      const response = await fetch("/api/suggestions/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          ...sectionSuggestionData
        }),
      });

      if (response.ok) {
        setSectionSuggestionData({
          condition: { minScore: 0, maxScore: 1 },
          suggestion: '',
          priority: 0,
          weight: 1.0,
          isActive: true
        });
        setShowSectionForm(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error adding section suggestion:", error);
    }
  }

  async function handleAddAssessmentSuggestion() {
    try {
      const response = await fetch("/api/suggestions/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assessmentSuggestionData),
      });

      if (response.ok) {
        setAssessmentSuggestionData({
          condition: { overallScore: { min: 0, max: 1 } },
          suggestion: '',
          priority: 0,
          weight: 1.0,
          isActive: true
        });
        setShowAssessmentForm(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error adding assessment suggestion:", error);
    }
  }

  async function handleToggleSuggestion(suggestionId: string, type: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/suggestions/${type}/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling suggestion:", error);
    }
  }

  async function handleDeleteSuggestion(suggestionId: string, type: string) {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
    
    try {
      const response = await fetch(`/api/suggestions/${type}/${suggestionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting suggestion:", error);
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
    <div className="content-container section-spacing">
      <FadeIn>
        <div className="page-header">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-cropper-mint-600 hover:text-cropper-mint-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <motion.h1 
            className="page-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Suggestions Management
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Configure automated suggestions based on assessment responses
          </motion.p>
        </div>

        {/* Usage Guide */}
        <motion.div 
          className="bg-gradient-to-r from-cropper-mint-50 to-cropper-blue-50 border border-cropper-mint-200 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
                          <h3 className="text-subheading text-gray-900">How to Use the Suggestion System</h3>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-cropper-blue-600 hover:text-cropper-blue-700 flex items-center space-x-2"
            >
              <span className="text-sm font-medium">
                {showGuide ? 'Hide Guide' : 'Show Guide'}
              </span>
              {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          {showGuide && (
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-cropper-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-cropper-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-subheading text-gray-900 mb-3">How to Use the Suggestion System</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Question Suggestions */}
                <div className="bg-white rounded-lg p-4 border border-cropper-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Target className="h-5 w-5 text-cropper-blue-600" />
                    <h4 className="text-subheading text-gray-900">Question Suggestions</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Trigger based on specific response values to individual questions.
                  </p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-blue-400 rounded-full"></span>
                      <span>Set conditions like "equals", "contains", "greater_than"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-blue-400 rounded-full"></span>
                      <span>Example: If response = "low", suggest improvement</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-blue-400 rounded-full"></span>
                      <span>Use for specific actionable feedback</span>
                    </div>
                  </div>
                </div>

                {/* Section Suggestions */}
                <div className="bg-white rounded-lg p-4 border border-cropper-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Layers className="h-5 w-5 text-cropper-green-600" />
                    <h4 className="text-subheading text-gray-900">Section Suggestions</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Trigger based on aggregated scores within a section.
                  </p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-green-400 rounded-full"></span>
                      <span>Set score ranges (0.0 to 1.0)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-green-400 rounded-full"></span>
                      <span>Example: Score 0.3-0.6 = "needs improvement"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-green-400 rounded-full"></span>
                      <span>Use for broader area recommendations</span>
                    </div>
                  </div>
                </div>

                {/* Assessment Suggestions */}
                <div className="bg-white rounded-lg p-4 border border-cropper-brown-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-cropper-brown-600" />
                    <h4 className="text-subheading text-gray-900">Assessment Suggestions</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Trigger based on overall assessment performance.
                  </p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-brown-400 rounded-full"></span>
                      <span>Set overall score ranges</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-brown-400 rounded-full"></span>
                      <span>Example: Score 0.8+ = "excellent performance"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-brown-400 rounded-full"></span>
                      <span>Use for high-level strategic advice</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Tips */}
              <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-subheading text-gray-900 mb-3 flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-gray-600" />
                  Configuration Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Priority & Weight</h5>
                    <ul className="space-y-1">
                      <li>• <strong>Priority</strong>: Higher numbers appear first (0-10)</li>
                      <li>• <strong>Weight</strong>: Affects scoring calculations (0.1-5.0)</li>
                      <li>• <strong>Active</strong>: Toggle to enable/disable suggestions</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Best Practices</h5>
                    <ul className="space-y-1">
                      <li>• Start with high-priority suggestions</li>
                      <li>• Use clear, actionable language</li>
                      <li>• Test conditions thoroughly</li>
                      <li>• Balance positive and improvement feedback</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Scoring System */}
              <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-subheading text-gray-900 mb-3 flex items-center">
                  <BarChart className="h-4 w-4 mr-2 text-gray-600" />
                  Scoring System
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Question Types</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>Boolean</strong>: True = 1.0, False = 0.0</li>
                      <li>• <strong>Likert Scale</strong>: Normalized to 0-1 range</li>
                      <li>• <strong>Single Choice</strong>: Default 0.5 (configurable)</li>
                      <li>• <strong>Multiple Choice</strong>: Based on selections</li>
                      <li>• <strong>Text</strong>: Neutral 0.5 (future: sentiment analysis)</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Weight Calculation</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>Question Weight</strong>: Within section (default: 1.0)</li>
                      <li>• <strong>Section Weight</strong>: Within assessment (default: 1.0)</li>
                      <li>• <strong>Combined</strong>: Question × Section weight</li>
                      <li>• <strong>Final Score</strong>: Weighted average of all responses</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Score Ranges</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>0.0-0.3</strong>: Poor performance</li>
                      <li>• <strong>0.3-0.6</strong>: Needs improvement</li>
                      <li>• <strong>0.6-0.8</strong>: Good performance</li>
                      <li>• <strong>0.8-1.0</strong>: Excellent performance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </motion.div>
      </FadeIn>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'questions', label: 'Question Suggestions', icon: Target },
            { id: 'sections', label: 'Section Suggestions', icon: Layers },
            { id: 'assessment', label: 'Assessment Suggestions', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-cropper-green-700 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Suggestions */}
      {activeTab === 'questions' && (
        <ScaleIn>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-heading mb-2">Question-Level Suggestions</h2>
                <p className="text-body">Configure suggestions based on specific question responses</p>
              </div>
              <Hover>
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="btn-primary btn-lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Question Suggestion
                </button>
              </Hover>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="card">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <button className="text-gray-500 hover:text-gray-700">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <h3 className="text-subheading text-gray-900">{section.title}</h3>
                      <span className="px-3 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded-full text-sm font-medium">
                        Weight: {section.weight}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {section.questions.length} questions
                      </span>
                    </div>
                  </div>

                  {expandedSections.has(section.id) && (
                    <div className="mt-6 space-y-4">
                      {section.questions.map((question) => (
                        <div key={question.id} className="border-l-4 border-cropper-green-200 pl-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleQuestion(question.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <button className="text-gray-500 hover:text-gray-700">
                                {expandedQuestions.has(question.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <div>
                                <h4 className="text-subheading text-gray-900">{question.text}</h4>
                                <p className="text-sm text-gray-500">
                                  {question.type} • Weight: {question.weight}
                                </p>
                                {question.options && question.options.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 font-medium">Available options:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {question.options.map((option: string, index: number) => (
                                        <span 
                                          key={index}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border"
                                          title={`Use this value in your condition: "${option}"`}
                                        >
                                          {option}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {question.type === 'LIKERT_SCALE' && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 font-medium">Likert scale values:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {[1, 2, 3, 4, 5].map((value) => (
                                        <span 
                                          key={value}
                                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded border"
                                          title={`Use this value in your condition: "${value}"`}
                                        >
                                          {value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {question.type === 'BOOLEAN' && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 font-medium">Boolean values:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {['true', 'false'].map((value) => (
                                        <span 
                                          key={value}
                                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded border"
                                          title={`Use this value in your condition: "${value}"`}
                                        >
                                          {value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {(question.suggestions || []).length} suggestions
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuestion(question.id);
                                  setShowQuestionForm(true);
                                }}
                                className="text-cropper-green-600 hover:text-cropper-green-700"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {expandedQuestions.has(question.id) && (
                            <div className="mt-4 space-y-3">
                              {(question.suggestions || []).map((suggestion) => (
                                <div key={suggestion.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          suggestion.isActive 
                                            ? 'bg-cropper-green-100 text-cropper-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {suggestion.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="px-2 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded text-xs font-medium">
                                          Priority: {suggestion.priority}
                                        </span>
                                        <span className="px-2 py-1 bg-cropper-brown-100 text-cropper-brown-800 rounded text-xs font-medium">
                                          Weight: {suggestion.weight}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-900 mb-2">{suggestion.suggestion}</p>
                                      <p className="text-xs text-gray-500">
                                        Condition: {JSON.stringify(suggestion.condition)}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleToggleSuggestion(suggestion.id, 'question', suggestion.isActive)}
                                        className={`p-1 rounded ${
                                          suggestion.isActive 
                                            ? 'text-cropper-green-600 hover:text-cropper-green-700'
                                            : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                      >
                                        {suggestion.isActive ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSuggestion(suggestion.id, 'question')}
                                        className="text-red-500 hover:text-red-700 p-1 rounded"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Section Suggestions */}
      {activeTab === 'sections' && (
        <ScaleIn>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-heading mb-2">Section-Level Suggestions</h2>
                <p className="text-body">Configure suggestions based on section scores</p>
              </div>
              <Hover>
                <button
                  onClick={() => setShowSectionForm(true)}
                  className="btn-primary btn-lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Section Suggestion
                </button>
              </Hover>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sections.map((section) => (
                <div key={section.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-subheading text-gray-900">{section.title}</h3>
                    <span className="px-3 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded-full text-sm font-medium">
                      Weight: {section.weight}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {(section.suggestions || []).map((suggestion) => (
                      <div key={suggestion.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                suggestion.isActive 
                                  ? 'bg-cropper-green-100 text-cropper-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {suggestion.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-2 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded text-xs font-medium">
                                Priority: {suggestion.priority}
                              </span>
                              <span className="px-2 py-1 bg-cropper-brown-100 text-cropper-brown-800 rounded text-xs font-medium">
                                Weight: {suggestion.weight}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{suggestion.suggestion}</p>
                            <p className="text-xs text-gray-500">
                              Condition: {JSON.stringify(suggestion.condition)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleSuggestion(suggestion.id, 'section', suggestion.isActive)}
                              className={`p-1 rounded ${
                                suggestion.isActive 
                                  ? 'text-cropper-green-600 hover:text-cropper-green-700'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {suggestion.isActive ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteSuggestion(suggestion.id, 'section')}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Assessment Suggestions */}
      {activeTab === 'assessment' && (
        <ScaleIn>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-heading mb-2">Assessment-Level Suggestions</h2>
                <p className="text-body">Configure suggestions based on overall assessment scores</p>
              </div>
              <Hover>
                <button
                  onClick={() => setShowAssessmentForm(true)}
                  className="btn-primary btn-lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Assessment Suggestion
                </button>
              </Hover>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assessmentSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.isActive 
                            ? 'bg-cropper-green-100 text-cropper-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {suggestion.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded text-xs font-medium">
                          Priority: {suggestion.priority}
                        </span>
                        <span className="px-2 py-1 bg-cropper-brown-100 text-cropper-brown-800 rounded text-xs font-medium">
                          Weight: {suggestion.weight}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{suggestion.suggestion}</p>
                      <p className="text-xs text-gray-500">
                        Condition: {JSON.stringify(suggestion.condition)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleSuggestion(suggestion.id, 'assessment', suggestion.isActive)}
                        className={`p-1 rounded ${
                          suggestion.isActive 
                            ? 'text-cropper-green-600 hover:text-cropper-green-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {suggestion.isActive ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteSuggestion(suggestion.id, 'assessment')}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScaleIn>
      )}

      {/* Question Suggestion Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading">Add Question Suggestion</h3>
              <button
                onClick={() => setShowQuestionForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedQuestion) {
                handleAddQuestionSuggestion(selectedQuestion);
              }
            }} className="space-y-6">
              
              {/* Selected Question Info */}
              {selectedQuestion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">Adding suggestion for:</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    {sections.flatMap(s => s.questions).find(q => q.id === selectedQuestion)?.text}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-blue-700">
                    <span>Type: {sections.flatMap(s => s.questions).find(q => q.id === selectedQuestion)?.type}</span>
                    <span>Weight: {sections.flatMap(s => s.questions).find(q => q.id === selectedQuestion)?.weight}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                  <span className="text-xs text-gray-500 ml-2">(When this condition is met, the suggestion will be shown)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {(() => {
                      const question = sections.flatMap(s => s.questions).find(q => q.id === selectedQuestion);
                      const hasOptions = question?.options && question.options.length > 0;
                      const isChoiceQuestion = question?.type === 'MULTIPLE_CHOICE' || question?.type === 'SINGLE_CHOICE';
                      
                      if (hasOptions && isChoiceQuestion) {
                        // Show dropdown for choice questions with options
                        return (
                          <>
                            <select
                              value={questionSuggestionData.condition.value}
                              onChange={(e) => setQuestionSuggestionData({
                                ...questionSuggestionData,
                                condition: { ...questionSuggestionData.condition, value: e.target.value }
                              })}
                              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                              title="Select the option that should trigger this suggestion"
                            >
                              <option value="">Select an option...</option>
                              {question.options?.map((option: string, index: number) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Select one of the available options for this question
                            </p>
                          </>
                        );
                      } else if (question?.type === 'BOOLEAN') {
                        // Show dropdown for boolean questions
                        return (
                          <>
                            <select
                              value={questionSuggestionData.condition.value}
                              onChange={(e) => setQuestionSuggestionData({
                                ...questionSuggestionData,
                                condition: { ...questionSuggestionData.condition, value: e.target.value }
                              })}
                              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                              title="Select the boolean value that should trigger this suggestion"
                            >
                              <option value="">Select a value...</option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Select whether this suggestion should trigger on Yes or No
                            </p>
                          </>
                        );
                      } else if (question?.type === 'LIKERT_SCALE') {
                        // Show dropdown for likert scale questions
                        return (
                          <>
                            <select
                              value={questionSuggestionData.condition.value}
                              onChange={(e) => setQuestionSuggestionData({
                                ...questionSuggestionData,
                                condition: { ...questionSuggestionData.condition, value: e.target.value }
                              })}
                              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                              title="Select the scale value that should trigger this suggestion"
                            >
                              <option value="">Select a value...</option>
                              {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value.toString()}>
                                  {value}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Select the scale value (1-5) that should trigger this suggestion
                            </p>
                          </>
                        );
                      } else {
                        // Show text input for other question types
                        return (
                          <>
                            <input
                              type="text"
                              placeholder={(() => {
                                if (!question) return "Value (e.g., 'low', 'yes', '3')";
                                
                                switch (question.type) {
                                  case 'TEXT':
                                    return "Value (e.g., 'specific text')";
                                  default:
                                    return "Value (e.g., 'low', 'yes', '3')";
                                }
                              })()}
                              value={questionSuggestionData.condition.value}
                              onChange={(e) => setQuestionSuggestionData({
                                ...questionSuggestionData,
                                condition: { ...questionSuggestionData.condition, value: e.target.value }
                              })}
                              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                              title="Enter the value that should trigger this suggestion"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {(() => {
                                if (!question) return "The response value that triggers this suggestion";
                                
                                switch (question.type) {
                                  case 'TEXT':
                                    return "Enter specific text that should trigger this suggestion";
                                  default:
                                    return "The response value that triggers this suggestion";
                                }
                              })()}
                            </p>
                          </>
                        );
                      }
                    })()}
                  </div>
                  <div>
                    <select
                      value={questionSuggestionData.condition.operator}
                      onChange={(e) => setQuestionSuggestionData({
                        ...questionSuggestionData,
                        condition: { ...questionSuggestionData.condition, operator: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                      title="Choose how to compare the response with the value"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">How to compare the response</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Text
                  <span className="text-xs text-gray-500 ml-2">(The advice that will be shown to the organization)</span>
                </label>
                <textarea
                  value={questionSuggestionData.suggestion}
                  onChange={(e) => setQuestionSuggestionData({
                    ...questionSuggestionData,
                    suggestion: e.target.value
                  })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  placeholder="Enter actionable advice... (e.g., 'Consider implementing regular training sessions to improve team skills')"
                  title="Write clear, actionable advice that the organization can follow. Be specific and constructive."
                />
                <p className="text-xs text-gray-500 mt-1">Provide specific, actionable advice that will help the organization improve</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                    <span className="text-xs text-gray-500 ml-2">(Higher numbers appear first)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={questionSuggestionData.priority}
                    onChange={(e) => setQuestionSuggestionData({
                      ...questionSuggestionData,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    placeholder="0-10"
                    title="Higher priority suggestions appear first in the list. Use 0-10 scale."
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = lowest, 10 = highest priority</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                    <span className="text-xs text-gray-500 ml-2">(Affects scoring calculations)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    value={questionSuggestionData.weight}
                    onChange={(e) => setQuestionSuggestionData({
                      ...questionSuggestionData,
                      weight: parseFloat(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    placeholder="1.0"
                    title="Weight affects how this suggestion influences overall scoring. Default is 1.0."
                  />
                  <p className="text-xs text-gray-500 mt-1">0.1 = low impact, 5.0 = high impact</p>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={questionSuggestionData.isActive}
                      onChange={(e) => setQuestionSuggestionData({
                        ...questionSuggestionData,
                        isActive: e.target.checked
                      })}
                      className="mr-2"
                      title="Enable or disable this suggestion"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-2">Enable this suggestion</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Suggestion Form Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading">Add Section Suggestion</h3>
              <button
                onClick={() => setShowSectionForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedSection) {
                handleAddSectionSuggestion(selectedSection);
              }
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score Range
                  <span className="text-xs text-gray-500 ml-2">(When the section score falls within this range, the suggestion will be shown)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="Min Score (0.0-1.0)"
                      value={sectionSuggestionData.condition.minScore}
                      onChange={(e) => setSectionSuggestionData({
                        ...sectionSuggestionData,
                        condition: { ...sectionSuggestionData.condition, minScore: parseFloat(e.target.value) }
                      })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                      title="Minimum score that triggers this suggestion. 0.0 = poor, 1.0 = excellent."
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum score (0.0 = poor performance)</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="Max Score (0.0-1.0)"
                      value={sectionSuggestionData.condition.maxScore}
                      onChange={(e) => setSectionSuggestionData({
                        ...sectionSuggestionData,
                        condition: { ...sectionSuggestionData.condition, maxScore: parseFloat(e.target.value) }
                      })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                      title="Maximum score that triggers this suggestion. 0.0 = poor, 1.0 = excellent."
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum score (1.0 = excellent performance)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Text
                  <span className="text-xs text-gray-500 ml-2">(The advice that will be shown to the organization)</span>
                </label>
                <textarea
                  value={sectionSuggestionData.suggestion}
                  onChange={(e) => setSectionSuggestionData({
                    ...sectionSuggestionData,
                    suggestion: e.target.value
                  })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  placeholder="Enter actionable advice... (e.g., 'This area needs significant improvement. Consider implementing comprehensive training programs.')"
                  title="Write clear, actionable advice for the entire section. Focus on broader improvements rather than specific questions."
                />
                <p className="text-xs text-gray-500 mt-1">Provide section-wide advice based on overall performance in this area</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={sectionSuggestionData.priority}
                    onChange={(e) => setSectionSuggestionData({
                      ...sectionSuggestionData,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sectionSuggestionData.weight}
                    onChange={(e) => setSectionSuggestionData({
                      ...sectionSuggestionData,
                      weight: parseFloat(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sectionSuggestionData.isActive}
                      onChange={(e) => setSectionSuggestionData({
                        ...sectionSuggestionData,
                        isActive: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowSectionForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessment Suggestion Form Modal */}
      {showAssessmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading">Add Assessment Suggestion</h3>
              <button
                onClick={() => setShowAssessmentForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddAssessmentSuggestion();
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Score Range
                  <span className="text-xs text-gray-500 ml-2">(When the overall assessment score falls within this range, the suggestion will be shown)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="Min Score (0.0-1.0)"
                      value={assessmentSuggestionData.condition.overallScore.min}
                      onChange={(e) => setAssessmentSuggestionData({
                        ...assessmentSuggestionData,
                        condition: { 
                          ...assessmentSuggestionData.condition, 
                          overallScore: { 
                            ...assessmentSuggestionData.condition.overallScore, 
                            min: parseFloat(e.target.value) 
                          } 
                        }
                      })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                      title="Minimum overall score that triggers this suggestion. 0.0 = poor overall performance, 1.0 = excellent."
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum overall score (0.0 = poor performance)</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="Max Score (0.0-1.0)"
                      value={assessmentSuggestionData.condition.overallScore.max}
                      onChange={(e) => setAssessmentSuggestionData({
                        ...assessmentSuggestionData,
                        condition: { 
                          ...assessmentSuggestionData.condition, 
                          overallScore: { 
                            ...assessmentSuggestionData.condition.overallScore, 
                            max: parseFloat(e.target.value) 
                          } 
                        }
                      })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                      title="Maximum overall score that triggers this suggestion. 0.0 = poor overall performance, 1.0 = excellent."
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum overall score (1.0 = excellent performance)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Text
                  <span className="text-xs text-gray-500 ml-2">(The high-level strategic advice that will be shown to the organization)</span>
                </label>
                <textarea
                  value={assessmentSuggestionData.suggestion}
                  onChange={(e) => setAssessmentSuggestionData({
                    ...assessmentSuggestionData,
                    suggestion: e.target.value
                  })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  placeholder="Enter strategic advice... (e.g., 'Your organization shows excellent overall performance. Consider focusing on continuous improvement and knowledge sharing.')"
                  title="Write high-level strategic advice for the entire organization. Focus on overall performance and strategic direction."
                />
                <p className="text-xs text-gray-500 mt-1">Provide organization-wide strategic advice based on overall assessment performance</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={assessmentSuggestionData.priority}
                    onChange={(e) => setAssessmentSuggestionData({
                      ...assessmentSuggestionData,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={assessmentSuggestionData.weight}
                    onChange={(e) => setAssessmentSuggestionData({
                      ...assessmentSuggestionData,
                      weight: parseFloat(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assessmentSuggestionData.isActive}
                      onChange={(e) => setAssessmentSuggestionData({
                        ...assessmentSuggestionData,
                        isActive: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAssessmentForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 