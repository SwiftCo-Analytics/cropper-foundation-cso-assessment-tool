"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft, CheckCircle, Clock, Lightbulb, Target } from "lucide-react";
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

interface Suggestion {
  id: string;
  type: string;
  sourceId?: string;
  suggestion: string;
  priority: number;
  weight: number;
  metadata?: any;
}

// Helper function to format suggestions contextually
function formatSuggestionContext(suggestion: Suggestion): { prefix: string; category: string; priorityLabel: string } {
  const { type, metadata } = suggestion;
  
  let prefix = "";
  let category = "";
  let priorityLabel = "";

  // Determine priority label
  if (suggestion.priority >= 9) {
    priorityLabel = "Critical Priority";
  } else if (suggestion.priority >= 7) {
    priorityLabel = "High Priority";
  } else if (suggestion.priority >= 5) {
    priorityLabel = "Medium Priority";
  } else {
    priorityLabel = "Low Priority";
  }

  switch (type) {
    case "QUESTION":
      if (metadata?.questionText && metadata?.responseValue !== undefined) {
        prefix = `Based on your response of "${metadata.responseValue}" to "${metadata.questionText.substring(0, 50)}${metadata.questionText.length > 50 ? '...' : ''}"`;
        category = "Question Response";
      } else {
        prefix = "Based on a specific question response";
        category = "Question Response";
      }
      break;
      
    case "SECTION":
      if (metadata?.sectionTitle && metadata?.sectionScore !== undefined) {
        const scorePercentage = Math.round(metadata.sectionScore * 100);
        prefix = `Based on your ${scorePercentage}% score in the "${metadata.sectionTitle}" section`;
        category = metadata.sectionTitle;
      } else {
        prefix = "Based on your section performance";
        category = "Section Analysis";
      }
      break;
      
    case "ASSESSMENT":
      if (metadata?.isStrategic) {
        if (metadata?.overallScore !== undefined) {
          const scorePercentage = Math.round(metadata.overallScore * 100);
          prefix = `Based on your overall assessment score of ${scorePercentage}%`;
        } else {
          prefix = "Based on your overall assessment performance";
        }
        category = metadata?.category || "Strategic Recommendation";
      } else {
        if (metadata?.overallScore !== undefined) {
          const scorePercentage = Math.round(metadata.overallScore * 100);
          prefix = `Based on your overall score of ${scorePercentage}%`;
        } else {
          prefix = "Based on your overall performance";
        }
        category = "Overall Assessment";
      }
      break;
      
    default:
      prefix = "Based on your assessment";
      category = metadata?.category || type;
  }

  return { prefix, category, priorityLabel };
}

export default function AssessmentReport({ params }: AssessmentReportProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

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
        
        // Load suggestions if assessment is completed
        if (data.status === "COMPLETED") {
          loadSuggestions();
        }
      } catch (error) {
        console.error("Error loading assessment:", error);
        router.push("/organization/dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [params.id, router]);

  async function loadSuggestions() {
    try {
      const response = await fetch(`/api/assessments/${params.id}/suggestions`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  }

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

  async function handleCheckCompletion() {
    setCheckingCompletion(true);
    try {
      const response = await fetch(`/api/assessments/${params.id}/check-completion`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to check completion");

      const result = await response.json();
      console.log("Completion check result:", result);
      
      // Reload the assessment to get updated status
      const assessmentResponse = await fetch(`/api/assessments/${params.id}`);
      if (assessmentResponse.ok) {
        const data = await assessmentResponse.json();
        setAssessment(data);
        
        // Load suggestions if assessment is now completed
        if (data.status === "COMPLETED") {
          loadSuggestions();
        }
      }
      
      if (result.statusChanged) {
        alert(`Assessment status updated from ${result.currentStatus} to ${result.newStatus}`);
      } else {
        alert(`Assessment status is correct: ${result.newStatus}`);
      }
    } catch (error) {
      console.error("Error checking completion:", error);
      alert("Error checking completion status");
    } finally {
      setCheckingCompletion(false);
    }
  }

  async function handleGenerateSuggestions() {
    setGeneratingSuggestions(true);
    try {
      const response = await fetch(`/api/assessments/${params.id}/suggestions`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to generate suggestions");

      const result = await response.json();
      setSuggestions(result.suggestions || []);
      alert(`Generated ${result.suggestions?.length || 0} suggestions`);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Error generating suggestions");
    } finally {
      setGeneratingSuggestions(false);
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
                {assessment.status === "COMPLETED" ? "Assessment Complete" : "Assessment Report"}
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
            
            <div className="flex items-center space-x-2">
              {assessment.status === "COMPLETED" ? (
                <div className="flex items-center space-x-2 text-cropper-mint-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">Completed</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-cropper-brown-600">
                  <Clock className="h-6 w-6" />
                  <span className="font-medium">In Progress</span>
                </div>
              )}
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

        {/* Suggestions Section */}
        {assessment.status === "COMPLETED" && (
          <div className="bg-white rounded-xl shadow-soft p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-6 w-6 mr-3 text-cropper-blue-600" />
                Personalized Recommendations
              </h2>
              <button
                onClick={handleGenerateSuggestions}
                disabled={generatingSuggestions}
                className="bg-cropper-blue-600 text-white px-4 py-2 rounded-lg hover:bg-cropper-blue-700 transition-colors duration-300 flex items-center"
              >
                {generatingSuggestions ? (
                  "Generating..."
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Generate Recommendations
                  </>
                )}
              </button>
            </div>
            
            {suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions
                  .sort((a, b) => b.priority - a.priority)
                  .map((suggestion) => {
                    const { prefix, category, priorityLabel } = formatSuggestionContext(suggestion);
                    
                    return (
                      <div key={suggestion.id} className="border border-gray-200 rounded-lg p-6 hover:border-cropper-blue-300 transition-all duration-200">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-cropper-blue-100 rounded-full flex items-center justify-center">
                              <Target className="h-5 w-5 text-cropper-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="px-3 py-1 bg-cropper-blue-100 text-cropper-blue-800 rounded-full text-sm font-medium">
                                {category}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                suggestion.priority >= 9 
                                  ? 'bg-red-100 text-red-800'
                                  : suggestion.priority >= 7
                                  ? 'bg-orange-100 text-orange-800'
                                  : suggestion.priority >= 5
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {priorityLabel}
                              </span>
                              {suggestion.metadata?.isStrategic && (
                                <span className="px-3 py-1 bg-cropper-purple-100 text-cropper-purple-800 rounded-full text-sm font-medium">
                                  Strategic
                                </span>
                              )}
                            </div>
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 font-medium">{prefix}:</p>
                            </div>
                            <p className="text-gray-900 leading-relaxed">{suggestion.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recommendations available yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click "Generate Recommendations" to get personalized suggestions based on your assessment results.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Next Steps
          </h2>
          
          <div className="space-y-4">
            {assessment.status === "COMPLETED" ? (
              <>
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
                  
                  <button
                    onClick={handleCheckCompletion}
                    disabled={checkingCompletion}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                  >
                    {checkingCompletion ? (
                      "Checking..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check Completion Status
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
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Your assessment is still in progress. You can continue working on it or return to the dashboard 
                  to manage your assessments.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/assessment/${assessment.id}`}
                    className="bg-cropper-mint-600 text-white px-6 py-3 rounded-full hover:bg-cropper-mint-700 transition-colors duration-300 flex items-center justify-center"
                  >
                    Continue Assessment
                  </Link>
                  
                  <button
                    onClick={handleCheckCompletion}
                    disabled={checkingCompletion}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                  >
                    {checkingCompletion ? (
                      "Checking..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check Completion Status
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 