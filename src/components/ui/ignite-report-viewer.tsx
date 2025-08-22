import React, { useEffect, useState } from 'react';
import { CSOScores } from '@/lib/cso-score-calculator';

interface AssessmentSuggestion {
  section: string; // e.g. "governance", "financial", etc.
  highlights: string[];
  improvements: string[];
}

interface IgniteReportViewerProps {
  organizationName: string;
  assessmentDate: string;
  scores: CSOScores;
  assessmentId: string;
  onDownload?: () => void;
}

export function IgniteReportViewer({ 
  organizationName, 
  assessmentDate, 
  scores, 
  assessmentId,
  onDownload
}: IgniteReportViewerProps) {
  const [suggestions, setSuggestions] = useState<AssessmentSuggestion[]>([]);

  // UseEffect to fetch suggestions using generateSuggestions
  useEffect(() => {
    async function fetchSuggestions() {
      if (!assessmentId) return;
      // Assume generateSuggestions is imported from a utility or API file
      // and returns AssessmentSuggestion[] for the frontend
      try {
        // @ts-ignore
        const result = await generateSuggestions(assessmentId);
        setSuggestions(result);
      } catch (e) {
        setSuggestions([]);
      }
    }
    fetchSuggestions();
  }, [assessmentId]);

  const getRating = (percentage: number): string => {
    if (percentage >= 80) return 'Leading Organisation';
    if (percentage >= 41) return 'Strong Foundation';
    return 'Emerging Organisation';
  };

  // Helper to get suggestions for a section, safely
  const getSectionSuggestions = (section: string) => {
    if (!Array.isArray(suggestions)) return undefined;
    return suggestions.find(
      (s) => typeof s.section === 'string' && s.section.toLowerCase() === section.toLowerCase()
    );
  };

  // Get all unique sections from suggestions (except "assessment" which is handled separately)
  const sectionNames = Array.isArray(suggestions)
    ? suggestions
        .map((s) => s.section)
        .filter(
          (section, idx, arr) =>
            section &&
            section.toLowerCase() !== 'assessment' &&
            arr.findIndex((sec) => sec && sec.toLowerCase() === section.toLowerCase()) === idx
        )
    : [];

  // Assessment-wide highlights (section: "assessment")
  const assessmentHighlights =
    suggestions.find(
      (s) => typeof s.section === 'string' && s.section.toLowerCase() === 'assessment'
    )?.highlights || [];

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Title Page */}
      <div className="bg-gradient-to-r from-orange-200 to-orange-400 text-white p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">IGNITE CSOs</h1>
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">CSO Self-Assessment</h2>
        <h3 className="text-xl mb-4 mt-4 text-gray-800">{organizationName}'s Report</h3>
      </div>

      {/* Project Partners */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          Project Partners
        </h2>
        <div className="flex flex-row items-center justify-center">
          <img src="/logos/TCF_logo.webp" alt="The Cropper Foundation" className="w-40 h-40 mr-2" />
          <img src="/logos/VA_logo.jpg" alt="Veni Apwann" className="w-70 h-20 mr-2" />
          <img src="/logos/EU_logo.png" alt="European Union" className="w-40 h-30 mr-2" />
        </div>
      </div>

      {/* Report Header */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          IGNITE CSOs Self-Assessment Report
        </h2>
        <div className="space-y-2 text-lg">
          <p>Date of Submission: {new Date(assessmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Assessment Tool Used: CPDC Accountability Assessment Tool for CSOs</p>
        </div>
      </div>

      {/* Congratulations */}
      <div className="p-8 border-b bg-green-50">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          Congratulations!
        </h2>
        <p className="text-lg leading-relaxed">
          {organizationName} has successfully completed the IGNITE CSOs Self-Assessment. This is a significant achievement in strengthening transparency, governance, and impact. This process reflects your commitment to ethical leadership, stakeholder engagement, and continuous improvement. You are setting a powerful example for CSOs across the region. Bravo!
        </p>
      </div>

      {/* Ratings Explanation */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          Understanding the Ratings
        </h2>
        <p className="text-lg mb-6">
          The assessment tool categorizes organizations based on their total score out of 215:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left">Category</th>
                <th className="border border-gray-300 p-3 text-left">Score Range</th>
                <th className="border border-gray-300 p-3 text-left">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Emerging Organization</td>
                <td className="border border-gray-300 p-3">43–86 (5–40%)</td>
                <td className="border border-gray-300 p-3">Basic structures in place; needs significant development in accountability systems</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Strong Foundation</td>
                <td className="border border-gray-300 p-3">87–170 (41–79%)</td>
                <td className="border border-gray-300 p-3">Solid operational base; room to strengthen strategic and governance practices</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Leading Organization</td>
                <td className="border border-gray-300 p-3">171–215 (80–100%)</td>
                <td className="border border-gray-300 p-3">Exemplary accountability; systems are mature, transparent, and stakeholder-driven</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p className="text-lg mt-4 font-medium">
          <b>{organizationName}</b> scored <b>{scores.totalScore}</b>, placing it in the <u><b>{scores.overallLevel}</b></u> category.
        </p>
      </div>

      {/* Summary Scores */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          Summary of Scores
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left">Assessment Area</th>
                <th className="border border-gray-300 p-3 text-center">Max Score</th>
                <th className="border border-gray-300 p-3 text-center">Actual Score</th>
                <th className="border border-gray-300 p-3 text-center">% Achieved</th>
                <th className="border border-gray-300 p-3 text-center">Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Governing Body Accountability</td>
                <td className="border border-gray-300 p-3 text-center">115</td>
                <td className="border border-gray-300 p-3 text-center">{scores.governanceScore}</td>
                <td className="border border-gray-300 p-3 text-center">{Math.round(scores.governancePercentage)}%</td>
                <td className="border border-gray-300 p-3 text-center">{getRating(scores.governancePercentage)}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Financial Management</td>
                <td className="border border-gray-300 p-3 text-center">50</td>
                <td className="border border-gray-300 p-3 text-center">{scores.financialScore}</td>
                <td className="border border-gray-300 p-3 text-center">{Math.round(scores.financialPercentage)}%</td>
                <td className="border border-gray-300 p-3 text-center">{getRating(scores.financialPercentage)}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Programme/Project Accountability</td>
                <td className="border border-gray-300 p-3 text-center">30</td>
                <td className="border border-gray-300 p-3 text-center">{scores.programmeScore}</td>
                <td className="border border-gray-300 p-3 text-center">{Math.round(scores.programmePercentage)}%</td>
                <td className="border border-gray-300 p-3 text-center">{getRating(scores.programmePercentage)}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-medium">Human Resource Accountability</td>
                <td className="border border-gray-300 p-3 text-center">20</td>
                <td className="border border-gray-300 p-3 text-center">{scores.hrScore}</td>
                <td className="border border-gray-300 p-3 text-center">{Math.round(scores.hrPercentage)}%</td>
                <td className="border border-gray-300 p-3 text-center">{getRating(scores.hrPercentage)}</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-300 p-3">Total</td>
                <td className="border border-gray-300 p-3 text-center">215</td>
                <td className="border border-gray-300 p-3 text-center">{scores.totalScore}</td>
                <td className="border border-gray-300 p-3 text-center">{Math.round(scores.totalPercentage)}%</td>
                <td className="border border-gray-300 p-3 text-center">{scores.overallLevel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualization */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          Visualizing the Results
        </h2>
        <p className="text-lg mb-4">Bar Graph: Max vs Actual Scores by Assessment Area</p>
        <p className="text-lg mb-6">This graph compares actual scores against the maximum possible scores across each category.</p>
        
        <div className="space-y-4">
          {[
            { name: 'Governing Body', score: scores.governanceScore, max: 115, color: 'bg-green-500' },
            { name: 'Financial', score: scores.financialScore, max: 50, color: 'bg-blue-500' },
            { name: 'Programme', score: scores.programmeScore, max: 30, color: 'bg-yellow-500' },
            { name: 'HR', score: scores.hrScore, max: 20, color: 'bg-purple-500' }
          ].map((section, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-32 text-sm font-medium">{section.name}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className={`${section.color} h-6 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min((section.score / section.max) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800">
                  {section.score}/{section.max}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-lg mt-6">
          This graph makes it easy to spot strengths and areas for improvement at a glance. Governing Body and Programme/Project Accountability are standout performers, while Financial Management and HR show solid foundations with room to grow.
        </p>
      </div>

      {/* Assessment Highlights */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          Assessment Highlights
        </h2>
        <div>
          {assessmentHighlights.length > 0 ? (
            <ul className="space-y-2">
              {assessmentHighlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No assessment-wide highlights available.</p>
          )}
        </div>
      </div>

      {/* Section Highlights (for each section in suggestions except "assessment") */}
      {sectionNames.map((sectionName) => {
        const sectionSuggestion = getSectionSuggestions(sectionName) || { highlights: [], improvements: [] };
        // Capitalize first letter for display
        const displaySection =
          sectionName.charAt(0).toUpperCase() + sectionName.slice(1).replace(/_/g, ' ');
        return (
          <div className="p-8 border-b" key={sectionName}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              {displaySection} Highlights
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Highlights:</h3>
                {Array.isArray(sectionSuggestion.highlights) && sectionSuggestion.highlights.length > 0 ? (
                  <ul className="space-y-2">
                    {sectionSuggestion.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No highlights available for this section.</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Areas for Improvement:</h3>
                {Array.isArray(sectionSuggestion.improvements) && sectionSuggestion.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {sectionSuggestion.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No improvement suggestions available for this section.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Action Plan */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          Next Steps and Action Plan
        </h2>
        <h3 className="text-xl font-semibold mb-4">🛠 Improvement Plan Template (Based on RendirApp Framework)</h3>
        <p className="text-lg mb-6">
          This improvement plan is designed to address the areas identified as weakest in the self-assessment. It reflects a co-constructed approach involving various stakeholders across {organizationName}.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">COMMITMENT</th>
                <th className="border border-gray-300 p-2 text-left">QUESTION</th>
                <th className="border border-gray-300 p-2 text-left">ANSWER</th>
                <th className="border border-gray-300 p-2 text-left">OBJECTIVE TO BE ACHIEVED</th>
                <th className="border border-gray-300 p-2 text-left">CHANGES OR ACTIONS TO BE TAKEN</th>
                <th className="border border-gray-300 p-2 text-left">TIME FRAME</th>
                <th className="border border-gray-300 p-2 text-left">RESPONSIBLE PARTY(IES)</th>
                <th className="border border-gray-300 p-2 text-left">COMPLIANCE INDICATORS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Example: Commitment 1: Governance</td>
                <td className="border border-gray-300 p-2">Does the organization have a crisis communication protocol?</td>
                <td className="border border-gray-300 p-2">No formal protocol exists</td>
                <td className="border border-gray-300 p-2">Establish a clear and tested crisis communication protocol</td>
                <td className="border border-gray-300 p-2">1. Draft protocol with board input<br/>2. Conduct simulation exercise</td>
                <td className="border border-gray-300 p-2">Q4 2025</td>
                <td className="border border-gray-300 p-2">Executive Director, Board Secretary</td>
                <td className="border border-gray-300 p-2">Protocol document approved and simulation completed</td>
              </tr>
              {/* Blank rows for user to fill in */}
              {[...Array(6)].map((_, idx) => (
                <tr key={idx}>
                  {Array.from({ length: 8 }).map((__, colIdx) => (
                    <td key={colIdx} className="border border-gray-300 p-2"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stakeholder Engagement */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          Stakeholder Engagement
        </h2>
        <p className="text-lg">
          {organizationName} will host a stakeholder roundtable on _______________ to share assessment findings, gather feedback, and co-create solutions for identified gaps. This will reinforce transparency and build trust across our network.
        </p>
      </div>

      {/* Download Button */}
      {onDownload && (
        <div className="p-8 bg-gray-50 border-t">
          <button
            onClick={onDownload}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>Download</span>
            <span>Download PDF Report</span>
          </button>
        </div>
      )}
    </div>
  );
}
