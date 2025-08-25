"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft, CheckCircle, Clock, Lightbulb, Target, BarChart3, FileSpreadsheet, FileArchiveIcon } from "lucide-react";
import Link from "next/link";
import { IgniteReportViewer } from "@/components/ui/ignite-report-viewer";
import { CSOScoreCalculator } from "@/lib/cso-score-calculator";

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

interface CSOScores {
  totalScore: number;
  governanceScore: number;
  financialScore: number;
  programmeScore: number;
  hrScore: number;
  governancePercentage: number;
  financialPercentage: number;
  programmePercentage: number;
  hrPercentage: number;
  totalPercentage: number;
  overallLevel: 'Emerging Organization' | 'Strong Foundation' | 'Leading Organization';
}

// Helper function to format suggestions contextually
function formatSuggestionContext(suggestion: Suggestion): { prefix: string; category: string; priorityLabel: string; context: string } {
  const { type, metadata } = suggestion;
  
  let prefix = "";
  let category = "";
  let priorityLabel = "";
  let context = "";

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
        context = "Specific question response";
      } else {
        prefix = "Based on a specific question response";
        category = "Question Response";
        context = "Specific question response";
      }
      break;
      
    case "SECTION":
      if (metadata?.sectionTitle && metadata?.sectionScore !== undefined && !isNaN(metadata.sectionScore)) {
        // For section scores, we need to calculate the percentage based on the section
        let maxScore = 115; // Default to governance
        if (metadata.sectionTitle === 'Financial Management') maxScore = 50;
        else if (metadata.sectionTitle === 'Programme/Project Accountability') maxScore = 30;
        else if (metadata.sectionTitle === 'Human Resource Accountability') maxScore = 20;
        
        const scorePercentage = Math.round((metadata.sectionScore / maxScore) * 100);
        prefix = `Based on your ${scorePercentage}% score in the "${metadata.sectionTitle}" section`;
        category = metadata.sectionTitle;
        context = "Section-specific performance";
      } else {
        prefix = "Based on your section performance";
        category = "Section Analysis";
        context = "Section-specific performance";
      }
      break;
      
    case "ASSESSMENT":
      if (metadata?.isStrategic) {
        if (metadata?.overallPercentage !== undefined && !isNaN(metadata.overallPercentage)) {
          const scorePercentage = Math.round(metadata.overallPercentage);
          prefix = `Based on your overall assessment score of ${scorePercentage}`;
        } else {
          prefix = "Based on your overall assessment performance";
        }
        category = metadata?.category || "Strategic Recommendation";
        context = "Overall strategic guidance";
      } else {
        if (metadata?.overallPercentage !== undefined && !isNaN(metadata.overallPercentage)) {
          const scorePercentage = Math.round(metadata.overallPercentage);
          prefix = `Based on your overall score of ${scorePercentage}%`;
        } else {
          prefix = "Based on your overall performance";
        }
        category = metadata?.category || "Overall Assessment";
        context = "Overall assessment performance";
      }
      break;
      
    default:
      prefix = "Based on your assessment";
      category = metadata?.category || type;
      context = "General assessment";
  }

  return { prefix, category, priorityLabel, context };
}

// Component for CSO Score Bar Chart
function CSOScoreBarChart({ scores }: { scores: CSOScores }) {
  const maxScores = {
    total: 215,
    governance: 115, // 23 questions * 5
    financial: 50,   // 10 questions * 5
    programme: 30,   // 6 questions * 5
    hr: 20          // 4 questions * 5
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Emerging Organization':
        return 'bg-red-500';
      case 'Strong Foundation':
        return 'bg-yellow-500';
      case 'Leading Organization':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSectionColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 41) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Score</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">{scores.totalScore}</span>
            <span className="text-gray-500">/ {maxScores.total}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getLevelColor(scores.overallLevel)}`}>
              {scores.overallLevel}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${getLevelColor(scores.overallLevel)}`}
            style={{ width: `${Math.min((scores.totalScore / maxScores.total) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {Math.round(scores.totalPercentage)}% - {scores.overallLevel}
        </p>
      </div>

      {/* Section Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Governance */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Governing Body Accountability</h4>
            <span className="text-sm font-medium text-gray-900">
              {scores.governanceScore}/{maxScores.governance}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getSectionColor(scores.governancePercentage)}`}
              style={{ width: `${Math.min(scores.governancePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">{Math.round(scores.governancePercentage)}%</p>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Financial Accountability</h4>
            <span className="text-sm font-medium text-gray-900">
              {scores.financialScore}/{maxScores.financial}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getSectionColor(scores.financialPercentage)}`}
              style={{ width: `${Math.min(scores.financialPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">{Math.round(scores.financialPercentage)}%</p>
        </div>

        {/* Programme */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Programme and Project Accountability</h4>
            <span className="text-sm font-medium text-gray-900">
              {scores.programmeScore}/{maxScores.programme}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getSectionColor(scores.programmePercentage)}`}
              style={{ width: `${Math.min(scores.programmePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">{Math.round(scores.programmePercentage)}%</p>
        </div>

        {/* HR */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Human Resource Accountability</h4>
            <span className="text-sm font-medium text-gray-900">
              {scores.hrScore}/{maxScores.hr}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getSectionColor(scores.hrPercentage)}`}
              style={{ width: `${Math.min(scores.hrPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">{Math.round(scores.hrPercentage)}%</p>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentReport({ params }: AssessmentReportProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [csoScores, setCsoScores] = useState<CSOScores | null>(null);
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
        
        // Load suggestions and scores if assessment is completed
        if (data.status === "COMPLETED") {
          loadSuggestions();
          loadCSOScores();
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
        let loaded = data.suggestions || [];
        // Auto-generate if none exist yet
        if ((!Array.isArray(loaded) || loaded.length === 0) && assessment?.status === "COMPLETED") {
          const genRes = await fetch(`/api/assessments/${params.id}/suggestions`, { method: "POST" });
          if (genRes.ok) {
            const genData = await genRes.json();
            loaded = genData.suggestions || [];
          }
        }
        setSuggestions(loaded);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  }

  async function loadCSOScores() {
    try {
      const response = await fetch(`/api/assessments/${params.id}/scores`);
      if (response.ok) {
        const data = await response.json();
        setCsoScores(data.scores);
      }
    } catch (error) {
      console.error("Error loading CSO scores:", error);
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
      a.download = `cso-assessment-report-${params.id}.pdf`;
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

  async function handleDownloadExcel() {
    setDownloading(true);
    try {
      const token = localStorage.getItem("org_token");
      const response = await fetch(`/api/organizations/assessments/${params.id}/report/download?format=xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to download excel");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cso-assessment-report-${params.id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading excel:", error);
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
        
        // Load suggestions and scores if assessment is now completed
        if (data.status === "COMPLETED") {
          loadSuggestions();
          loadCSOScores();
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
      <div className="max-w-6xl mx-auto">
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
                CSO Self-Assessment Report
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

        {/* IGNITE CSOs Report */}
        {assessment.status === "COMPLETED" && csoScores && (
          <div className="mb-8">
            <IgniteReportViewer
              organizationName={assessment.organization.name}
              assessmentDate={assessment.completedAt || assessment.startedAt}
              scores={csoScores}
              suggestions={suggestions}
              assessmentId={assessment.id}
              onDownload={handleDownloadReport}
            />
          </div>
        )}

        {/* Assessment Summary (hide when completed, shown while in-progress) */}
        {assessment.status !== "COMPLETED" && (
          <div className="bg-white rounded-2xl border border-cropper-green-200 shadow-soft p-8 mb-8">
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-cropper-brown-100 text-cropper-brown-800`}>In Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-cropper-green-200 shadow-soft p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Next Steps and Action Plan</h2>
            {assessment.status === "COMPLETED" ? (
              <>

                {/* Action Plan */}
                <section className="p-8 border-b mb-8 bg-gray-50 rounded-xl">
                  <h4 className="text-xl font-semibold mb-4 text-gray-900">
                    Improvement Plan Template <span className="font-normal text-gray-500">(Based on RendirApp Framework)</span>
                  </h4>
                  <p className="text-body-lg mb-6">
                    This improvement plan is designed to address the areas identified as weakest in the self-assessment. It reflects a co-constructed approach involving various stakeholders across <span className="font-semibold">{assessment.organization.name}</span>.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-lg overflow-hidden shadow-soft text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-gray-900">
                          <th className="p-2 text-left">COMMITMENT</th>
                          <th className="p-2 text-left">QUESTION</th>
                          <th className="p-2 text-left">ANSWER</th>
                          <th className="p-2 text-left">OBJECTIVE TO BE ACHIEVED</th>
                          <th className="p-2 text-left">CHANGES OR ACTIONS TO BE TAKEN</th>
                          <th className="p-2 text-left">TIME FRAME</th>
                          <th className="p-2 text-left">RESPONSIBLE PARTY(IES)</th>
                          <th className="p-2 text-left">COMPLIANCE INDICATORS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="p-2 font-medium">Example: Commitment 1: Governance</td>
                          <td className="p-2">Does the organization have a crisis communication protocol?</td>
                          <td className="p-2">No formal protocol exists</td>
                          <td className="p-2">Establish a clear and tested crisis communication protocol</td>
                          <td className="p-2">
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Draft protocol with board input</li>
                              <li>Conduct simulation exercise</li>
                            </ol>
                          </td>
                          <td className="p-2">Q4 2025</td>
                          <td className="p-2">Executive Director, Board Secretary</td>
                          <td className="p-2">Protocol document approved and simulation completed</td>
                        </tr>
                        {/* Blank rows for user to fill in */}
                        {[...Array(6)].map((_, idx) => (
                          <tr key={idx}>
                            {Array.from({ length: 8 }).map((__, colIdx) => (
                              <td key={colIdx} className="p-2"></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Stakeholder Engagement */}
                <section className="p-8 mb-8">
                  <h3 className="text-2xl font-display font-bold mb-4 text-gray-900">Stakeholder Engagement</h3>
                  <p className="text-body-lg">
                    <span className="font-semibold">{assessment.organization.name}</span> will host a stakeholder roundtable on <span className="underline">_______________</span> to share assessment findings, gather feedback, and co-create solutions for identified gaps. This will reinforce transparency and build trust across our network.
                  </p>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleDownloadReport}
                    disabled={downloading}
                    className="btn-primary flex items-center justify-center"
                  >
                    {downloading ? (
                      "Downloading..."
                    ) : (
                      <>
                        <FileArchiveIcon className="h-4 w-4 mr-2" />
                        Download PDF Report
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    disabled={downloading}
                    className="btn-secondary flex items-center justify-center"
                  >
                    {downloading ? (
                      "Preparing..."
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Download Excel Report
                      </>
                    )}
                  </button>
                  <Link
                    href="/organization/dashboard"
                    className="btn-secondary flex items-center justify-center"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
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
  );
} 