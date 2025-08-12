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
  const [showGuide, setShowGuide] = useState(false);
  
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
    category: '',
    priority: 0,
    weight: 1.0,
    isActive: true
  });

  const [sectionSuggestionData, setSectionSuggestionData] = useState({
    condition: { minScore: 0, maxScore: 1 },
    suggestion: '',
    category: '',
    priority: 0,
    weight: 1.0,
    isActive: true,
    useAdvancedCondition: false,
    advancedCondition: ''
  });

  const [assessmentSuggestionData, setAssessmentSuggestionData] = useState({
    condition: { overallScore: { min: 43, max: 86 } },
    suggestion: '',
    category: '',
    priority: 0,
    weight: 1.0,
    isActive: true,
    useAdvancedCondition: false,
    advancedCondition: ''
  });

  const QUESTION_TYPE = {
    TEXT: "Text",
    BOOLEAN: "Yes/No",
    LIKERT_SCALE: "Likert Scale",
    NUMERIC: "Numeric",
    DATE: "Date",
    SINGLE_CHOICE: "Single Choice",
    MULTIPLE_CHOICE: "Multiple Choice",
  };

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
      // Check if we're editing an existing suggestion
      if (editingSuggestion && editingSuggestion.type === 'question') {
        await handleUpdateSuggestion(editingSuggestion.id, 'question', questionSuggestionData);
        return;
      }

      const response = await fetch("/api/suggestions/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          ...questionSuggestionData
        }),
      });

      if (response.ok) {
        resetForms();
        fetchData();
      }
    } catch (error) {
      console.error("Error adding question suggestion:", error);
    }
  }

  async function handleAddSectionSuggestion(sectionId: string) {
    try {
      // Prepare condition based on form type
      let condition;
      if (sectionSuggestionData.useAdvancedCondition) {
        try {
          condition = JSON.parse(sectionSuggestionData.advancedCondition);
        } catch (error) {
          alert("Invalid JSON in advanced condition");
          return;
        }
      } else {
        condition = sectionSuggestionData.condition;
      }

      // Check if we're editing an existing suggestion
      if (editingSuggestion && editingSuggestion.type === 'section') {
        await handleUpdateSuggestion(editingSuggestion.id, 'section', {
          condition,
          suggestion: sectionSuggestionData.suggestion,
          category: sectionSuggestionData.category,
          priority: sectionSuggestionData.priority,
          weight: sectionSuggestionData.weight,
          isActive: sectionSuggestionData.isActive
        });
        return;
      }

      const response = await fetch("/api/suggestions/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          condition,
          suggestion: sectionSuggestionData.suggestion,
          category: sectionSuggestionData.category,
          priority: sectionSuggestionData.priority,
          weight: sectionSuggestionData.weight,
          isActive: sectionSuggestionData.isActive
        }),
      });

      if (response.ok) {
        resetForms();
        fetchData();
      }
    } catch (error) {
      console.error("Error adding section suggestion:", error);
    }
  }

  async function handleAddAssessmentSuggestion() {
    try {
      // Prepare condition based on form type
      let condition;
      if (assessmentSuggestionData.useAdvancedCondition) {
        try {
          condition = JSON.parse(assessmentSuggestionData.advancedCondition);
        } catch (error) {
          alert("Invalid JSON in advanced condition");
          return;
        }
      } else {
        condition = assessmentSuggestionData.condition;
      }

      // Check if we're editing an existing suggestion
      if (editingSuggestion && editingSuggestion.type === 'assessment') {
        await handleUpdateSuggestion(editingSuggestion.id, 'assessment', {
          condition,
          suggestion: assessmentSuggestionData.suggestion,
          category: assessmentSuggestionData.category,
          priority: assessmentSuggestionData.priority,
          weight: assessmentSuggestionData.weight,
          isActive: assessmentSuggestionData.isActive
        });
        return;
      }

      const response = await fetch("/api/suggestions/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition,
          suggestion: assessmentSuggestionData.suggestion,
          category: assessmentSuggestionData.category,
          priority: assessmentSuggestionData.priority,
          weight: assessmentSuggestionData.weight,
          isActive: assessmentSuggestionData.isActive
        }),
      });

      if (response.ok) {
        resetForms();
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

  async function handleEditSuggestion(suggestion: any, type: string) {
    setEditingSuggestion({ ...suggestion, type });
    
    if (type === 'question') {
      setQuestionSuggestionData({
        condition: suggestion.condition,
        suggestion: suggestion.suggestion,
        category: suggestion.category || '',
        priority: suggestion.priority,
        weight: suggestion.weight,
        isActive: suggestion.isActive
      });
      setSelectedQuestion(suggestion.questionId);
      setShowQuestionForm(true);
    } else if (type === 'section') {
      setSectionSuggestionData({
        condition: suggestion.condition,
        suggestion: suggestion.suggestion,
        category: suggestion.category || '',
        priority: suggestion.priority,
        weight: suggestion.weight,
        isActive: suggestion.isActive,
        useAdvancedCondition: typeof suggestion.condition === 'object' && !suggestion.condition.minScore && !suggestion.condition.maxScore,
        advancedCondition: typeof suggestion.condition === 'object' && !suggestion.condition.minScore && !suggestion.condition.maxScore ? JSON.stringify(suggestion.condition, null, 2) : ''
      });
      setSelectedSection(suggestion.sectionId);
      setShowSectionForm(true);
    } else if (type === 'assessment') {
      setAssessmentSuggestionData({
        condition: suggestion.condition?.overallScore ? suggestion.condition : { overallScore: { min: 43, max: 86 } },
        suggestion: suggestion.suggestion,
        category: suggestion.category || '',
        priority: suggestion.priority,
        weight: suggestion.weight,
        isActive: suggestion.isActive,
        useAdvancedCondition: typeof suggestion.condition === 'object' && !suggestion.condition.overallScore,
        advancedCondition: typeof suggestion.condition === 'object' && !suggestion.condition.overallScore ? JSON.stringify(suggestion.condition, null, 2) : ''
      });
      setShowAssessmentForm(true);
    }
  }

  async function handleUpdateSuggestion(suggestionId: string, type: string, data: any) {
    try {
      const response = await fetch(`/api/suggestions/${type}/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEditingSuggestion(null);
        resetForms();
        fetchData();
      }
    } catch (error) {
      console.error("Error updating suggestion:", error);
    }
  }

  function resetForms() {
    setQuestionSuggestionData({
      condition: { value: '', operator: 'equals' },
      suggestion: '',
      category: '',
      priority: 0,
      weight: 1.0,
      isActive: true
    });
    setSectionSuggestionData({
      condition: { minScore: 0, maxScore: 1 },
      suggestion: '',
      category: '',
      priority: 0,
      weight: 1.0,
      isActive: true,
      useAdvancedCondition: false,
      advancedCondition: ''
    });
    setAssessmentSuggestionData({
      condition: { overallScore: { min: 43, max: 86 } },
      suggestion: '',
      category: '',
      priority: 0,
      weight: 1.0,
      isActive: true,
      useAdvancedCondition: false,
      advancedCondition: ''
    });
    setShowQuestionForm(false);
    setShowSectionForm(false);
    setShowAssessmentForm(false);
    setSelectedQuestion(null);
    setSelectedSection(null);
  }

  function formatCondition(condition: any): string {
    if (!condition) return "No condition";
    
    // Handle score range conditions
    if (condition.minScore !== undefined || condition.maxScore !== undefined) {
      const min = condition.minScore !== undefined ? condition.minScore : 0;
      const max = condition.maxScore !== undefined ? condition.maxScore : 100;
      return `Score range: ${min} - ${max}`;
    }
    
    // Handle overall score conditions
    if (condition.overallScore) {
      const min = condition.overallScore.min !== undefined ? condition.overallScore.min : 0;
      const max = condition.overallScore.max !== undefined ? condition.overallScore.max : 215;
      
      // Determine level based on score ranges
      let level = '';
      if (min >= 43 && max <= 86) level = ' (Emerging)';
      else if (min >= 87 && max <= 170) level = ' (Strong Foundation)';
      else if (min >= 171 && max <= 215) level = ' (Leading)';
      else if (min >= 43 && max <= 170) level = ' (Emerging-Strong)';
      else if (min >= 87 && max <= 215) level = ' (Strong-Leading)';
      
      return `Overall score: ${min}-${max}${level}`;
    }
    
    // Handle question percentage conditions
    if (condition.questionPercentage) {
      const { operator, value, questionType, expectedValue } = condition.questionPercentage;
      const operatorText = operator === 'less_than' ? 'less than' : 
                          operator === 'greater_than' ? 'greater than' : 
                          operator === 'equals' ? 'equals' : operator;
      const typeText = questionType ? ` ${questionType} questions` : ' questions';
      const valueText = expectedValue !== undefined ? ` with value "${expectedValue}"` : '';
      return `${operatorText} ${value}% of${typeText}${valueText}`;
    }
    
    // Handle section count conditions
    if (condition.sectionCount) {
      const { operator, value, belowThreshold } = condition.sectionCount;
      const operatorText = operator === 'greater_than' ? 'more than' : 
                          operator === 'less_than' ? 'less than' : 
                          operator === 'equals' ? 'exactly' : operator;
      return `${operatorText} ${value} sections below ${belowThreshold}`;
    }
    
    // Handle response value conditions
    if (condition.value !== undefined && condition.operator) {
      const operatorText = condition.operator === 'equals' ? 'equals' :
                          condition.operator === 'contains' ? 'contains' :
                          condition.operator === 'greater_than' ? 'greater than' :
                          condition.operator === 'less_than' ? 'less than' : condition.operator;
      return `${operatorText} "${condition.value}"`;
    }
    
    // Fallback for complex JSON
    return "Custom condition";
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
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-cropper-blue-600 hover:text-cropper-blue-700 flex items-center space-x-2"
            >
              <span className="text-lg font-medium">
                {showGuide ? 'Hide Suggestion System Guide' : 'Show Suggestion System Guide'}
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
              <div className="mb-4 text-sm text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>All <b>weights</b> and <b>score ranges</b> are entered and displayed as <b>percentages</b> for clarity (e.g., 100% = normal weight, 50% = half weight).</li>
                  <li>Conditions are shown in <b>user-friendly language</b> (e.g., "Score range: 30% - 70%", "less than 50% of Yes/No questions").</li>
                  <li>Question types are labeled clearly (e.g., "Yes/No", "Likert Scale", "Single Choice").</li>
                  <li>You can use <b>form-based</b> conditions for common cases, or switch to <b>Advanced (JSON)</b> for custom logic.</li>
                  <li>Click a section to quickly add a suggestion for that section.</li>
                  <li>Mandatory fields are marked with <b>*</b> and must be filled out.</li>
                </ul>
              </div>
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
                      <span>Set conditions like "equals", "contains", "greater than"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-blue-400 rounded-full"></span>
                      <span>Example: If response = "No", suggest improvement</span>
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
                      <span>Set score ranges (as percentages, e.g., 30% - 70%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-green-400 rounded-full"></span>
                      <span>Example: Score 30% - 60% = "needs improvement"</span>
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
                    Trigger based on overall assessment scores or patterns across sections/questions.
                  </p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-brown-400 rounded-full"></span>
                      <span>Set overall score ranges (as percentages, e.g., 60% - 100%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-brown-400 rounded-full"></span>
                      <span>Advanced: Use JSON for custom logic (e.g., "more than 2 sections below 60%")</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-cropper-brown-400 rounded-full"></span>
                      <span>Use for strategic, organization-wide recommendations</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-xs text-gray-500">
                <b>Tip:</b> Use the <b>Advanced (JSON)</b> toggle for custom conditions, but most use cases are covered by the form-based options.
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
                      Weight: {Math.round(section.weight * 100)}%
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
                                  {QUESTION_TYPE[question.type]} • Weight: {Math.round(question.weight * 100)}%
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
                                    <p className="text-xs text-gray-600 font-medium">Yes/No:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {['true', 'false'].map((value) => (
                                        <span 
                                          key={value}
                                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded border"
                                          title={`Use this value in your condition: "${value}"`}
                                        >
                                          {value === 'true' ? 'Yes' : 'No'}
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
                                          Weight: {Math.round(suggestion.weight * 100)}%
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-900 mb-2">{suggestion.suggestion}</p>
                                      <p className="text-xs text-gray-500">
                                        Condition: {formatCondition(suggestion.condition)}
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
                                      <button
                                        onClick={() => handleEditSuggestion(suggestion, 'question')}
                                        className="text-cropper-blue-600 hover:text-cropper-blue-700 p-1 rounded"
                                      >
                                        <Edit2 className="h-4 w-4" />
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
                <div key={section.id} className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setSelectedSection(section.id);
                  setShowSectionForm(true);
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-subheading text-gray-900">{section.title}</h3>
                    <span className="px-3 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded-full text-sm font-medium">
                      Weight: {Math.round(section.weight * 100)}%
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
                                Weight: {Math.round(suggestion.weight * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{suggestion.suggestion}</p>
                            <p className="text-xs text-gray-500">
                              Condition: {formatCondition(suggestion.condition)}
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
                            <button
                              onClick={() => handleEditSuggestion(suggestion, 'section')}
                              className="text-cropper-blue-600 hover:text-cropper-blue-700 p-1 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
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
                          Weight: {Math.round(suggestion.weight * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{suggestion.suggestion}</p>
                      <p className="text-xs text-gray-500">
                        Condition: {formatCondition(suggestion.condition)}
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
                      <button
                        onClick={() => handleEditSuggestion(suggestion, 'assessment')}
                        className="text-cropper-blue-600 hover:text-cropper-blue-700 p-1 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
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
              <h3 className="text-heading">
                {editingSuggestion && editingSuggestion.type === 'question' ? 'Edit Question Suggestion' : 'Add Question Suggestion'}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionForm(false);
                  setEditingSuggestion(null);
                }}
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
                    <span>Weight: {Math.round((sections.flatMap(s => s.questions).find(q => q.id === selectedQuestion)?.weight || 0) * 100)}%</span>
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
                  Suggestion Text *
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
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Provide specific, actionable advice that will help the organization improve</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                  <span className="text-xs text-gray-500 ml-2">(Helps organize and filter suggestions)</span>
                </label>
                <input
                  type="text"
                  value={questionSuggestionData.category}
                  onChange={(e) => setQuestionSuggestionData({
                    ...questionSuggestionData,
                    category: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  placeholder="e.g., Security, Operations, Training, Compliance..."
                  title="Add a category to help organize suggestions by topic or domain"
                />
                <p className="text-xs text-gray-500 mt-1">Examples: Security, Operations, Training, Compliance, HR, Finance</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                    <span className="text-xs text-gray-500 ml-2">(Determines suggestion order and urgency)</span>
                  </label>
                  <select
                    value={questionSuggestionData.priority}
                    onChange={(e) => setQuestionSuggestionData({
                      ...questionSuggestionData,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    title="Select the appropriate priority level based on importance and urgency"
                  >
                    <option value={0}>0 - Informational (Nice to know)</option>
                    <option value={1}>1 - Minor Enhancement</option>
                    <option value={2}>2 - Moderate Improvement</option>
                    <option value={3}>3 - Recommended Action</option>
                    <option value={4}>4 - Important Improvement</option>
                    <option value={5}>5 - Significant Issue</option>
                    <option value={6}>6 - Major Improvement Needed</option>
                    <option value={7}>7 - High Priority Action</option>
                    <option value={8}>8 - Critical Issue</option>
                    <option value={9}>9 - Urgent Action Required</option>
                    <option value={10}>10 - Emergency/Immediate Risk</option>
                  </select>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="font-medium text-blue-800 mb-1">Priority Guidelines:</p>
                    <p className="text-blue-700">• <strong>0-2:</strong> Low impact suggestions</p>
                    <p className="text-blue-700">• <strong>3-5:</strong> Moderate improvements needed</p>
                    <p className="text-blue-700">• <strong>6-7:</strong> High priority actions</p>
                    <p className="text-blue-700">• <strong>8-10:</strong> Critical/urgent issues</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                    <span className="text-xs text-gray-500 ml-2">(Affects scoring calculations)</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="500"
                    value={Math.round(questionSuggestionData.weight * 100)}
                    onChange={(e) => setQuestionSuggestionData({
                      ...questionSuggestionData,
                      weight: parseFloat(e.target.value) / 100
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    placeholder="100"
                    title="Weight affects how this suggestion influences overall scoring. Default is 100%."
                  />
                  <p className="text-xs text-gray-500 mt-1">10% = low impact, 500% = high impact</p>
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
                  {editingSuggestion && editingSuggestion.type === 'question' ? 'Update Suggestion' : 'Add Suggestion'}
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
              <h3 className="text-heading">
                {editingSuggestion && editingSuggestion.type === 'section' ? 'Edit Section Suggestion' : 'Add Section Suggestion'}
              </h3>
              <button
                onClick={() => {
                  setShowSectionForm(false);
                  setEditingSuggestion(null);
                }}
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
              
              {/* Section Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section
                  <span className="text-xs text-gray-500 ml-2">(Choose which section this suggestion applies to)</span>
                </label>
                <select
                  value={selectedSection || ''}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a section...</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title} ({section.questions.length} questions)
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Selected Section Info */}
              {selectedSection && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">Adding suggestion for:</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    {sections.find(s => s.id === selectedSection)?.title}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-blue-700">
                    <span>Questions: {sections.find(s => s.id === selectedSection)?.questions.length || 0}</span>
                    <span>Weight: {Math.round((sections.find(s => s.id === selectedSection)?.weight || 0) * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Condition Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Type
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="conditionType"
                      checked={!sectionSuggestionData.useAdvancedCondition}
                      onChange={() => setSectionSuggestionData({
                        ...sectionSuggestionData,
                        useAdvancedCondition: false
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Form-based</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="conditionType"
                      checked={sectionSuggestionData.useAdvancedCondition}
                      onChange={() => setSectionSuggestionData({
                        ...sectionSuggestionData,
                        useAdvancedCondition: true
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Advanced (JSON)</span>
                  </label>
                </div>
              </div>

              {/* Form-based Condition */}
              {!sectionSuggestionData.useAdvancedCondition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Range
                    <span className="text-xs text-gray-500 ml-2">(When the section score falls within this range, the suggestion will be shown)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="Min Score (0-100%)"
                        value={Math.round((sectionSuggestionData.condition.minScore || 0) * 100)}
                        onChange={(e) => setSectionSuggestionData({
                          ...sectionSuggestionData,
                          condition: { ...sectionSuggestionData.condition, minScore: parseFloat(e.target.value) / 100 }
                        })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                        title="Minimum score that triggers this suggestion. 0% = poor, 100% = excellent."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum score (0% = poor performance)</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="Max Score (0-100%)"
                        value={Math.round((sectionSuggestionData.condition.maxScore || 1) * 100)}
                        onChange={(e) => setSectionSuggestionData({
                          ...sectionSuggestionData,
                          condition: { ...sectionSuggestionData.condition, maxScore: parseFloat(e.target.value) / 100 }
                        })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                        title="Maximum score that triggers this suggestion. 0% = poor, 100% = excellent."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum score (100% = excellent performance)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced JSON Condition */}
              {sectionSuggestionData.useAdvancedCondition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advanced Condition (JSON)
                    <span className="text-xs text-gray-500 ml-2">(Custom JSON condition for advanced logic)</span>
                  </label>
                  <textarea
                    value={sectionSuggestionData.advancedCondition}
                    onChange={(e) => setSectionSuggestionData({
                      ...sectionSuggestionData,
                      advancedCondition: e.target.value
                    })}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent font-mono text-sm"
                    placeholder={`{
  "minScore": 0.3,
  "maxScore": 0.7,
  "questionPercentage": {
    "operator": "less_than",
    "value": 50,
    "questionType": "BOOLEAN",
    "expectedValue": true
  }
}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use JSON to define complex conditions. Available context: section, questions, responses, scores.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Text *
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
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Provide section-wide advice based on overall performance in this area</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                  <span className="text-xs text-gray-500 ml-2">(Helps organize and filter suggestions)</span>
                </label>
                <input
                  type="text"
                  value={sectionSuggestionData.category}
                  onChange={(e) => setSectionSuggestionData({
                    ...sectionSuggestionData,
                    category: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  placeholder="e.g., Security, Operations, Training, Compliance..."
                  title="Add a category to help organize suggestions by topic or domain"
                />
                <p className="text-xs text-gray-500 mt-1">Examples: Security, Operations, Training, Compliance, HR, Finance</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                    <span className="text-xs text-gray-500 ml-2">(Section-wide urgency)</span>
                  </label>
                  <select
                    value={sectionSuggestionData.priority}
                    onChange={(e) => setSectionSuggestionData({
                      ...sectionSuggestionData,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    title="Select priority based on section performance impact"
                  >
                    <option value={0}>0 - Informational (Nice to know)</option>
                    <option value={1}>1 - Minor Enhancement</option>
                    <option value={2}>2 - Moderate Improvement</option>
                    <option value={3}>3 - Recommended Action</option>
                    <option value={4}>4 - Important Improvement</option>
                    <option value={5}>5 - Significant Issue</option>
                    <option value={6}>6 - Major Improvement Needed</option>
                    <option value={7}>7 - High Priority Action</option>
                    <option value={8}>8 - Critical Issue</option>
                    <option value={9}>9 - Urgent Action Required</option>
                    <option value={10}>10 - Emergency/Immediate Risk</option>
                  </select>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="font-medium text-blue-800 mb-1">Section Priority Guidelines:</p>
                    <p className="text-blue-700">• <strong>0-2:</strong> Areas working well, minor tweaks</p>
                    <p className="text-blue-700">• <strong>3-5:</strong> Moderate gaps, improvement needed</p>
                    <p className="text-blue-700">• <strong>6-7:</strong> Significant weaknesses, high priority</p>
                    <p className="text-blue-700">• <strong>8-10:</strong> Critical gaps, immediate attention</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="500"
                    value={Math.round(sectionSuggestionData.weight * 100)}
                    onChange={(e) => setSectionSuggestionData({
                      ...sectionSuggestionData,
                      weight: parseFloat(e.target.value) / 100
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">10% = low impact, 500% = high impact</p>
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
                  {editingSuggestion && editingSuggestion.type === 'section' ? 'Update Suggestion' : 'Add Suggestion'}
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
              <h3 className="text-heading">
                {editingSuggestion && editingSuggestion.type === 'assessment' ? 'Edit Assessment Suggestion' : 'Add Assessment Suggestion'}
              </h3>
              <button
                onClick={() => {
                  setShowAssessmentForm(false);
                  setEditingSuggestion(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddAssessmentSuggestion();
            }} className="space-y-6">
              
              {/* Condition Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Type
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assessmentConditionType"
                      checked={!assessmentSuggestionData.useAdvancedCondition}
                      onChange={() => setAssessmentSuggestionData({
                        ...assessmentSuggestionData,
                        useAdvancedCondition: false,
                        condition: { 
                          overallScore: { 
                            min: assessmentSuggestionData.condition?.overallScore?.min || 43, 
                            max: assessmentSuggestionData.condition?.overallScore?.max || 86 
                          } 
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Form-based</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assessmentConditionType"
                      checked={assessmentSuggestionData.useAdvancedCondition}
                      onChange={() => setAssessmentSuggestionData({
                        ...assessmentSuggestionData,
                        useAdvancedCondition: true
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Advanced (JSON)</span>
                  </label>
                </div>
              </div>

              {/* Form-based Condition */}
              {!assessmentSuggestionData.useAdvancedCondition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Score Range (CSO Scoring System)
                    <span className="text-xs text-gray-500 ml-2">(When the overall assessment score falls within this range, the suggestion will be shown)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="215"
                        placeholder="Min Score (0-215)"
                        value={assessmentSuggestionData.condition?.overallScore?.min || 43}
                        onChange={(e) => setAssessmentSuggestionData({
                          ...assessmentSuggestionData,
                          condition: { 
                            ...assessmentSuggestionData.condition, 
                            overallScore: { 
                              ...assessmentSuggestionData.condition?.overallScore, 
                              min: parseInt(e.target.value) 
                            } 
                          }
                        })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                        title="Minimum overall score that triggers this suggestion. 43-86 = Emerging, 87-170 = Strong Foundation, 171-215 = Leading."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum overall score (43-86 = Emerging, 87-170 = Strong Foundation, 171-215 = Leading)</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="215"
                        placeholder="Max Score (0-215)"
                        value={assessmentSuggestionData.condition?.overallScore?.max || 86}
                        onChange={(e) => setAssessmentSuggestionData({
                          ...assessmentSuggestionData,
                          condition: { 
                            ...assessmentSuggestionData.condition, 
                            overallScore: { 
                              ...assessmentSuggestionData.condition?.overallScore, 
                              max: parseInt(e.target.value) 
                            } 
                          }
                        })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent w-full"
                        title="Maximum overall score that triggers this suggestion. 43-86 = Emerging, 87-170 = Strong Foundation, 171-215 = Leading."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum overall score (43-86 = Emerging, 87-170 = Strong Foundation, 171-215 = Leading)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced JSON Condition */}
              {assessmentSuggestionData.useAdvancedCondition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advanced Condition (JSON)
                    <span className="text-xs text-gray-500 ml-2">(Custom JSON condition for advanced logic)</span>
                  </label>
                  <textarea
                    value={assessmentSuggestionData.advancedCondition}
                    onChange={(e) => setAssessmentSuggestionData({
                      ...assessmentSuggestionData,
                      advancedCondition: e.target.value
                    })}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent font-mono text-sm"
                    placeholder={`{
  "overallScore": {
    "min": 43,
    "max": 86
  },
  "sectionScore": {
    "section": "governance-section",
    "min": 23,
    "max": 46
  },
  "overallLevel": "Emerging"
}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use JSON to define complex conditions. Available context: overallScore (0-215), sectionScore (section-specific ranges), overallLevel (Emerging/Strong Foundation/Leading).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Text *
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
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Provide organization-wide strategic advice based on overall assessment performance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                  <span className="text-xs text-gray-500 ml-2">(Helps organize and filter suggestions)</span>
                </label>
                <input
                  type="text"
                  value={assessmentSuggestionData.category}
                  onChange={(e) => setAssessmentSuggestionData({
                    ...assessmentSuggestionData,
                    category: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                  placeholder="e.g., Strategic, Leadership, Overall Performance..."
                  title="Add a category to help organize suggestions by topic or domain"
                />
                <p className="text-xs text-gray-500 mt-1">Examples: Strategic, Leadership, Overall Performance, Governance, Risk Management</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                    <span className="text-xs text-gray-500 ml-2">(Strategic importance)</span>
                  </label>
                  <select
                    value={assessmentSuggestionData.priority}
                    onChange={(e) => setAssessmentSuggestionData({
                      ...assessmentSuggestionData,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    title="Select priority based on organizational impact"
                  >
                    <option value={0}>0 - Informational (Nice to know)</option>
                    <option value={1}>1 - Minor Enhancement</option>
                    <option value={2}>2 - Moderate Improvement</option>
                    <option value={3}>3 - Recommended Action</option>
                    <option value={4}>4 - Important Improvement</option>
                    <option value={5}>5 - Significant Issue</option>
                    <option value={6}>6 - Major Improvement Needed</option>
                    <option value={7}>7 - High Priority Action</option>
                    <option value={8}>8 - Critical Issue</option>
                    <option value={9}>9 - Urgent Action Required</option>
                    <option value={10}>10 - Emergency/Immediate Risk</option>
                  </select>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="font-medium text-blue-800 mb-1">Strategic Priority Guidelines:</p>
                    <p className="text-blue-700">• <strong>0-2:</strong> Organization performing well</p>
                    <p className="text-blue-700">• <strong>3-5:</strong> Organizational improvements needed</p>
                    <p className="text-blue-700">• <strong>6-7:</strong> Strategic gaps requiring attention</p>
                    <p className="text-blue-700">• <strong>8-10:</strong> Critical organizational risks</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="500"
                    value={Math.round(assessmentSuggestionData.weight * 100)}
                    onChange={(e) => setAssessmentSuggestionData({
                      ...assessmentSuggestionData,
                      weight: parseFloat(e.target.value) / 100
                    })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cropper-green-500 focus:border-transparent"
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">10% = low impact, 500% = high impact</p>
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
                  {editingSuggestion && editingSuggestion.type === 'assessment' ? 'Update Suggestion' : 'Add Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 