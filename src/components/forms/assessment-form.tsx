"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Save, CheckCircle } from "lucide-react";

interface AssessmentFormProps {
  assessmentId: string;
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  description: string | null;
  type: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "LIKERT_SCALE" | "TEXT" | "BOOLEAN";
  options: any;
  mandatory: boolean;
}

const responseSchema = z.object({
  answers: z.record(z.any()),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

export function AssessmentForm({ assessmentId }: AssessmentFormProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResponses, setSavedResponses] = useState<Record<string, any>>({});
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [assessmentStatus, setAssessmentStatus] = useState<"IN_PROGRESS" | "COMPLETED" | null>(null);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      answers: {},
    },
  });

  useEffect(() => {
    async function loadSections() {
      try {
        const response = await fetch(`/api/sections`);
        if (!response.ok) throw new Error("Failed to load sections");
        const data = await response.json();
        setSections(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading sections:", error);
        setIsLoading(false);
      }
    }

    loadSections();
  }, []);

  // Load existing responses when sections are loaded
  useEffect(() => {
    if (sections.length > 0) {
      loadExistingResponses();
      loadAssessmentStatus();
    }
  }, [sections, assessmentId]);

  async function loadAssessmentStatus() {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessmentStatus(data.status);
      }
    } catch (error) {
      console.error("Error loading assessment status:", error);
    }
  }

  async function loadExistingResponses() {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/responses`);
      if (response.ok) {
        const data = await response.json();
        const responsesMap: Record<string, any> = {};
        
        data.responses.forEach((resp: any) => {
          responsesMap[resp.questionId] = resp.value;
        });
        
        setSavedResponses(responsesMap);
        
          // Determine which sections are completed 
          // (all mandatory questions answered + at least one response in the section)
  const completed = new Set<string>();
  sections.forEach(section => {
    const mandatoryQuestions = section.questions.filter(q => q.mandatory).map(q => q.id);
    const allQuestions = section.questions.map(q => q.id);
    
    // Check if all mandatory questions are answered
    const hasAllMandatoryResponses = mandatoryQuestions.length === 0 || mandatoryQuestions.every(qId => {
      const response = responsesMap[qId];
      return response !== undefined && response !== null && response !== "";
    });
    
    // Check if section has any responses (to indicate user visited it)
    const hasAnyResponse = allQuestions.some(qId => {
      const response = responsesMap[qId];
      return response !== undefined && response !== null && response !== "";
    });
    
    // Section is complete if mandatory questions are answered and user has engaged with it
    if (hasAllMandatoryResponses && hasAnyResponse) {
      completed.add(section.id);
    }
  });
  setCompletedSections(completed);
        
        // Set form values for current section
        const currentSection = sections[currentSectionIndex];
        if (currentSection) {
          const currentAnswers: Record<string, any> = {};
          currentSection.questions.forEach(question => {
            if (responsesMap[question.id] !== undefined) {
              currentAnswers[question.id] = responsesMap[question.id];
            }
          });
          form.reset({ answers: currentAnswers });
        }
      }
    } catch (error) {
      console.error("Error loading existing responses:", error);
    }
  }

  const currentSection = sections[currentSectionIndex];

  async function saveProgress() {
    setIsSaving(true);
    try {
      const formData = form.getValues();
      
      // Check for unanswered mandatory questions but still allow saving
      const mandatoryQuestions = currentSection.questions.filter(q => q.mandatory);
      const unansweredMandatory = mandatoryQuestions.filter(q => {
        const answer = formData.answers[q.id];
        return answer === undefined || answer === null || answer === "";
      });

      const response = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: currentSection.id,
          answers: formData.answers,
          saveOnly: true, // Don't mark as completed
        }),
      });

      if (!response.ok) throw new Error("Failed to save progress");

      // Update saved responses
      setSavedResponses(prev => ({
        ...prev,
        ...formData.answers
      }));

      // Show success message with warning if mandatory questions are unanswered
      setShowSaveSuccess(true);
      if (unansweredMandatory.length > 0) {
        setTimeout(() => {
          alert(`Progress saved! Note: ${unansweredMandatory.length} mandatory question(s) remain unanswered in this section.`);
        }, 100);
      }
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function onSubmit(data: ResponseFormValues) {
    // Validate mandatory questions
    const mandatoryQuestions = currentSection.questions.filter(q => q.mandatory);
    const unansweredMandatory = mandatoryQuestions.filter(q => {
      const answer = data.answers[q.id];
      return answer === undefined || answer === null || answer === "";
    });

    if (unansweredMandatory.length > 0) {
      alert(`Please answer all mandatory questions before proceeding. Unanswered mandatory questions: ${unansweredMandatory.map(q => q.text).join(", ")}`);
      return;
    }

    // If this is the last section and assessment is in progress, show confirmation dialog
    if (currentSectionIndex === sections.length - 1 && assessmentStatus === "IN_PROGRESS") {
      setShowFinishConfirmation(true);
      return;
    }

    await submitResponses(data);
  }

  async function submitResponses(data: ResponseFormValues) {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: currentSection.id,
          answers: data.answers,
          saveOnly: false, // Mark as completed when finishing
        }),
      });

      if (!response.ok) throw new Error("Failed to save responses");

      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        // Load responses for next section
        const nextSection = sections[currentSectionIndex + 1];
        const nextAnswers: Record<string, any> = {};
        nextSection.questions.forEach(question => {
          if (savedResponses[question.id] !== undefined) {
            nextAnswers[question.id] = savedResponses[question.id];
          }
        });
        form.reset({ answers: nextAnswers });
      } else {
        router.push(`/assessment/${assessmentId}/report`);
      }
    } catch (error) {
      console.error("Error saving responses:", error);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentSection) {
    return <div>No sections found</div>;
  }

  // If assessment is completed, show read-only view
  if (assessmentStatus === "COMPLETED") {
    return (
      <div className="space-y-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Assessment Completed</span>
          </div>
          <p className="text-blue-700 mt-1">
            This assessment has been completed and cannot be edited. You can view your responses or download the report.
          </p>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {currentSection.title}
          </h2>
          {currentSection.description && (
            <p className="text-sm text-gray-600">{currentSection.description}</p>
          )}
          
          <div className="space-y-6">
            {currentSection.questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {question.text}
                  {question.mandatory && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {question.description && (
                  <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                )}
                <div className="text-gray-700">
                  <strong>Response:</strong> {savedResponses[question.id] || "No response provided"}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => router.push(`/assessment/${assessmentId}/report`)}
            className="bg-cropper-orange-600 text-white px-6 py-2 rounded-lg hover:bg-cropper-orange-700 transition-colors duration-300"
          >
            View Report
          </button>
          <button
            onClick={() => router.push("/organization/dashboard")}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
        {showSaveSuccess && (
          <div className="bg-cropper-green-100 border border-cropper-green-400 text-cropper-green-700 px-4 py-3 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Progress saved successfully! You can safely leave and return later.
          </div>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">
                  {currentSectionIndex + 1} of {sections.length} sections
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-cropper-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Section Navigation */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Sections</span>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-cropper-orange-600"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-cropper-green-100 border border-cropper-green-300"></div>
                    <span>Ready</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
                    <span>Has Mandatory</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setCurrentSectionIndex(index);
                      // Load responses for this section
                      const sectionAnswers: Record<string, any> = {};
                      section.questions.forEach(question => {
                        if (savedResponses[question.id] !== undefined) {
                          sectionAnswers[question.id] = savedResponses[question.id];
                        }
                      });
                      form.reset({ answers: sectionAnswers });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      index === currentSectionIndex
                        ? 'bg-cropper-orange-600 text-white'
                        : completedSections.has(section.id)
                        ? 'bg-cropper-green-100 text-cropper-green-800'
                        : section.questions.some(q => q.mandatory)
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                    {completedSections.has(section.id) && (
                      <CheckCircle className="inline h-3 w-3 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900">
              {currentSection.title}
            </h2>
            {currentSection.description && (
              <p className="mt-2 text-sm text-gray-600">{currentSection.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {currentSection.questions.map((question) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <label className="block font-semibold text-gray-900 text-lg mb-3">
                  {question.text}
                  {question.mandatory && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </label>
                {question.description && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-gray-300">{question.description}</p>
                )}
                {question.mandatory && (
                  <p className="mt-2 text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md border border-red-200">This question is mandatory</p>
                )}
                <div className="mt-6">
                  {renderQuestionInput(question, form)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (currentSectionIndex > 0) {
                  setCurrentSectionIndex(currentSectionIndex - 1);
                  // Load responses for previous section
                  const prevSection = sections[currentSectionIndex - 1];
                  const prevAnswers: Record<string, any> = {};
                  prevSection.questions.forEach(question => {
                    if (savedResponses[question.id] !== undefined) {
                      prevAnswers[question.id] = savedResponses[question.id];
                    }
                  });
                  form.reset({ answers: prevAnswers });
                }
              }}
              disabled={currentSectionIndex === 0}
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={saveProgress}
                disabled={isSaving}
                className="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 flex items-center"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </>
                )}
              </button>
              
              {assessmentStatus === "IN_PROGRESS" && (
                <button
                  type="submit"
                  className="rounded-md bg-cropper-orange-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cropper-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cropper-orange-600"
                >
                  {currentSectionIndex === sections.length - 1 ? "Finish" : "Next"}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Confirmation Dialog */}
        {showFinishConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Complete Assessment
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to complete this assessment? Once completed, you will not be able to edit your responses.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFinishConfirmation(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowFinishConfirmation(false);
                    const formData = form.getValues();
                    await submitResponses(formData);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-300"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderQuestionInput(
  question: Question,
  form: ReturnType<typeof useForm<ResponseFormValues>>
) {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return (
        <div className="space-y-3">
          {question.options.map((option: string) => (
            <label key={option} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                {...form.register(`answers.${question.id}`)}
                value={option}
                className="h-5 w-5 rounded border-gray-300 text-cropper-orange-600 focus:ring-cropper-orange-600 focus:ring-2"
              />
              <span className="ml-3 text-gray-700 font-medium">{option}</span>
            </label>
          ))}
        </div>
      );

    case "SINGLE_CHOICE":
      return (
        <div className="space-y-3">
          {question.options.map((option: string) => (
            <label key={option} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="radio"
                {...form.register(`answers.${question.id}`)}
                value={option}
                className="h-5 w-5 border-gray-300 text-cropper-orange-600 focus:ring-cropper-orange-600 focus:ring-2"
              />
              <span className="ml-3 text-gray-700 font-medium">{option}</span>
            </label>
          ))}
        </div>
      );

    case "LIKERT_SCALE":
      return (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">1 - Not True at All</span>
            <span className="text-sm font-medium text-gray-700">5 - Always True</span>
          </div>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="flex flex-col items-center">
                <input
                  type="radio"
                  {...form.register(`answers.${question.id}`)}
                  value={value}
                  className="h-5 w-5 border-gray-300 text-cropper-orange-600 focus:ring-cropper-orange-600 focus:ring-2"
                />
                <span className="mt-2 text-sm font-medium text-gray-700">{value}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "TEXT":
      return (
        <textarea
          {...form.register(`answers.${question.id}`)}
          rows={4}
          className="block w-full rounded-lg border border-gray-300 py-3 px-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-cropper-orange-600 focus:border-cropper-orange-600 transition-colors duration-200 resize-none"
        />
      );

    case "BOOLEAN":
      return (
        <div className="flex space-x-6">
          <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
            <input
              type="radio"
              {...form.register(`answers.${question.id}`)}
              value="true"
              className="h-5 w-5 border-gray-300 text-cropper-orange-600 focus:ring-cropper-orange-600 focus:ring-2"
            />
            <span className="ml-3 text-gray-700 font-medium">Yes</span>
          </label>
          <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
            <input
              type="radio"
              {...form.register(`answers.${question.id}`)}
              value="false"
              className="h-5 w-5 border-gray-300 text-cropper-orange-600 focus:ring-cropper-orange-600 focus:ring-2"
            />
            <span className="ml-3 text-gray-700 font-medium">No</span>
          </label>
        </div>
      );

    default:
      return null;
  }
} 