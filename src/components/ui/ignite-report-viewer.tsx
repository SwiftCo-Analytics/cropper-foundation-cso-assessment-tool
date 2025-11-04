import React, { useEffect, useState } from 'react';
import { CSOScores } from '@/lib/cso-score-calculator';

interface Suggestion {
  id: string;
  type: string;
  sourceId?: string;
  suggestion: string;
  priority: number;
  weight: number;
  metadata?: any;
}

interface IgniteReportViewerProps {
  organizationName: string;
  assessmentDate: string;
  scores: CSOScores;
  assessmentId: string;
  suggestions: Suggestion[];
  onDownload?: () => void;
}

export function IgniteReportViewer({ 
  organizationName, 
  assessmentDate, 
  scores, 
  assessmentId,
  suggestions,
  onDownload
}: IgniteReportViewerProps) {

  const getRating = (percentage: number): string => {
    if (percentage >= 80) return 'Leading Organisation';
    if (percentage >= 41) return 'Strong Foundation';
    return 'Emerging Organisation';
  };

  // Build a map of section -> suggestion texts
  const sectionToSuggestions: Record<string, string[]> = Array.isArray(suggestions)
    ? suggestions.reduce((acc: Record<string, string[]>, s) => {
        // Determine section key: use metadata.section if available, otherwise infer from type
        let sectionKey: string | undefined = undefined;
        
        // Handle metadata - it might be a JSON object from Prisma
        const metadata = s.metadata;
        let metadataSection: string | undefined = undefined;
        
        if (metadata) {
          // Handle both direct access and potential JSON parsing
          if (typeof metadata === 'object' && metadata !== null) {
            metadataSection = (metadata as any).section;
          } else if (typeof metadata === 'string') {
            // If metadata is a string, try to parse it
            try {
              const parsed = JSON.parse(metadata);
              metadataSection = parsed?.section;
            } catch (e) {
              // Not JSON, ignore
            }
          }
        }
        
        // Check if this is an ASSESSMENT type suggestion
        const isAssessmentType = s.type === 'ASSESSMENT' || s.type === 'assessment';
        
        // For ASSESSMENT type suggestions, always use 'assessment' as the section key
        // (they are assessment-level highlights regardless of section-specific metadata)
        if (isAssessmentType) {
          sectionKey = 'assessment';
        } else if (typeof metadataSection === 'string' && metadataSection.trim().length > 0) {
          // For non-assessment suggestions, use the section from metadata
          sectionKey = metadataSection.toLowerCase();
        }
        
        // Skip suggestions without a valid section key
        if (!sectionKey) return acc;
        
        if (!acc[sectionKey]) acc[sectionKey] = [];
        if (typeof s.suggestion === 'string' && s.suggestion.trim().length > 0) {
          acc[sectionKey].push(s.suggestion);
        }
        return acc;
      }, {})
    : {};

  // Get all unique sections from suggestions (except "assessment" which is handled separately)
  const sectionNames = Object.keys(sectionToSuggestions)
    .filter((section) => section !== 'assessment');

  // Assessment-wide highlights (section: "assessment")
  const assessmentHighlights = sectionToSuggestions['assessment'] || [];

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('Suggestions data:', {
      totalSuggestions: suggestions?.length || 0,
      assessmentTypeSuggestions: suggestions?.filter(s => s.type === 'ASSESSMENT' || s.type === 'assessment').length || 0,
      sectionToSuggestions,
      assessmentHighlightsCount: assessmentHighlights.length
    });
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-soft rounded-2xl border border-cropper-green-200 overflow-hidden">
      {/* Title Page */}
      <div className="relative text-white">
        <div className="absolute inset-0 bg-cropper-green-400"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.4),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-black/15"></div>
        <div className="relative p-12 sm:p-16 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm ring-1 ring-white/20">Official Report</span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold tracking-tight">IGNITE CSOs</h1>
            <h2 className="mt-2 text-xl sm:text-2xl font-display font-semibold">CSO Self-Assessment</h2>
            <h3 className="mt-3 text-lg sm:text-xl font-medium text-white/90">{organizationName}'s Report</h3>
          </div>
        </div>
      </div>

      {/* Project Partners */}
      <div className="p-8 border-b bg-gray-50">
        <div className="section-header mb-6">
          <h2 className="section-title mb-2">Project Partners</h2>
        </div>
        <div className="flex flex-row items-center justify-center gap-6">
          <img src="/logos/TCF_logo.webp" alt="The Cropper Foundation" className="h-16 w-auto" />
          <img src="/logos/VA_logo.jpg" alt="Veni Apwann" className="h-12 w-auto" />
          <img src="/logos/EU_logo.png" alt="European Union" className="h-14 w-auto" />
        </div>
      </div>

      {/* Report Header */}
      <div className="p-8 border-b">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-display font-bold text-gray-900">IGNITE CSOs Self-Assessment Report</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-cropper-mint-100 text-cropper-mint-800">Official Report</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="card">
            <p className="text-caption">Date of Submission</p>
            <p className="text-lg font-medium text-gray-900">{new Date(assessmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="card">
            <p className="text-caption">Assessment Tool</p>
            <p className="text-lg font-medium text-gray-900">CPDC Accountability Assessment Tool for CSOs</p>
          </div>
        </div>
      </div>

      {/* Congratulations */}
      <div className="p-8 border-b bg-gradient-soft">
        <h2 className="text-2xl font-display font-bold mb-3 text-gray-900">Congratulations!</h2>
        <p className="text-body-lg">
          {organizationName} has successfully completed the IGNITE CSOs Self-Assessment. This is a significant achievement in strengthening transparency, governance, and impact. This process reflects your commitment to ethical leadership, stakeholder engagement, and continuous improvement. You are setting a powerful example for CSOs across the region. Bravo!
        </p>
      </div>

      {/* Ratings Explanation */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-display font-bold mb-4 text-gray-900">Understanding the Ratings</h2>
        <p className="text-body-lg mb-6">
          The assessment tool categorizes organizations based on their total score out of 215:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow-soft">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Score Range</th>
                <th className="p-3 text-left">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white">
                <td className="p-3 font-medium">Emerging Organization</td>
                <td className="p-3">43–86 (5–40%)</td>
                <td className="p-3">Basic structures in place; needs significant development in accountability systems</td>
              </tr>
              <tr className="bg-white">
                <td className="p-3 font-medium">Strong Foundation</td>
                <td className="p-3">87–170 (41–79%)</td>
                <td className="p-3">Solid operational base; room to strengthen strategic and governance practices</td>
              </tr>
              <tr className="bg-white">
                <td className="p-3 font-medium">Leading Organization</td>
                <td className="p-3">171–215 (80–100%)</td>
                <td className="p-3">Exemplary accountability; systems are mature, transparent, and stakeholder-driven</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p className="text-body-lg mt-4 font-medium">
          <b>{organizationName}</b> scored <b>{scores.totalScore}</b>, placing it in the <u><b>{scores.overallLevel}</b></u> category.
        </p>
      </div>

      {/* Summary Scores */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-display font-bold mb-6 text-gray-900">Summary of Scores</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow-soft">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="p-3 text-left">Assessment Area</th>
                <th className="p-3 text-center">Max Score</th>
                <th className="p-3 text-center">Actual Score</th>
                <th className="p-3 text-center">% Achieved</th>
                <th className="p-3 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="p-3 font-medium">Governing Body Accountability</td>
                <td className="p-3 text-center">115</td>
                <td className="p-3 text-center">{scores.governanceScore}</td>
                <td className="p-3 text-center">{Math.round(scores.governancePercentage)}%</td>
                <td className="p-3 text-center">{getRating(scores.governancePercentage)}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Financial Management</td>
                <td className="p-3 text-center">50</td>
                <td className="p-3 text-center">{scores.financialScore}</td>
                <td className="p-3 text-center">{Math.round(scores.financialPercentage)}%</td>
                <td className="p-3 text-center">{getRating(scores.financialPercentage)}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Programme/Project Accountability</td>
                <td className="p-3 text-center">30</td>
                <td className="p-3 text-center">{scores.programmeScore}</td>
                <td className="p-3 text-center">{Math.round(scores.programmePercentage)}%</td>
                <td className="p-3 text-center">{getRating(scores.programmePercentage)}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Human Resource Accountability</td>
                <td className="p-3 text-center">20</td>
                <td className="p-3 text-center">{scores.hrScore}</td>
                <td className="p-3 text-center">{Math.round(scores.hrPercentage)}%</td>
                <td className="p-3 text-center">{getRating(scores.hrPercentage)}</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="p-3">Total</td>
                <td className="p-3 text-center">215</td>
                <td className="p-3 text-center">{scores.totalScore}</td>
                <td className="p-3 text-center">{Math.round(scores.totalPercentage)}%</td>
                <td className="p-3 text-center">{scores.overallLevel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualization */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-display font-bold mb-2 text-gray-900">Visualizing the Results</h2>
        <p className="text-caption mb-1">Bar Graph: Max vs Actual Scores by Assessment Area</p>
        <p className="text-body mb-6">This graph compares actual scores against the maximum possible scores across each category.</p>
        
        <div className="space-y-4">
          {[
            { name: 'Governing Body', score: scores.governanceScore, max: 115, color: 'bg-green-500' },
            { name: 'Financial Management', score: scores.financialScore, max: 50, color: 'bg-blue-500' },
            { name: 'Programme/Project Accountability', score: scores.programmeScore, max: 30, color: 'bg-yellow-500' },
            { name: 'Human Resource', score: scores.hrScore, max: 20, color: 'bg-purple-500' }
          ].map((section, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-40 text-sm font-medium text-gray-700">{section.name}</div>
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
        
        <p className="text-body mt-6">
          This graph makes it easy to spot strengths and areas for improvement at a glance. Governing Body and Programme/Project Accountability are standout performers, while Financial Management and HR show solid foundations with room to grow.
        </p>
      </div>

      {/* Assessment Highlights */}
      <div className="p-8 border-b">
        <h2 className="text-2xl font-display font-bold mb-6 text-gray-900">Assessment Highlights</h2>
        <div>
          {assessmentHighlights.length > 0 ? (
            <ul className="space-y-2">
              {Array.isArray(assessmentHighlights) && assessmentHighlights.map((highlight, idx) => (
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
        const items = sectionToSuggestions[sectionName] || [];
        // Capitalize first letter for display, but if section is "hr", highlight both letters
        let displaySection;
        if (sectionName.toLowerCase() === "hr") {
          displaySection = (
            "Human Resource"
          );
        } else {
          displaySection =
            sectionName.charAt(0).toUpperCase() + sectionName.slice(1).replace(/_/g, ' ');
        }
        return (
          <div className="p-8 border-b" key={sectionName}>
            <h2 className="text-2xl font-display font-bold mb-6 text-gray-900">
              {displaySection} Highlights
            </h2>
            <div className="space-y-6">
              <div>
                {Array.isArray(items) && items.length > 0 ? (
                  <ul className="space-y-2">
                    {items.map((highlight, idx) => (
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
            </div>
          </div>
        );
      })}

      
    </div>
  );
}
