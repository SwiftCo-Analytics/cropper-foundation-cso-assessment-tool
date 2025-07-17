import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SuggestionEngine } from "@/lib/suggestion-engine";

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get all sections
    const allSections = await prisma.section.findMany({
      orderBy: { order: 'asc' },
    });
    
    // Get all questions for all sections
    const allQuestions = await prisma.question.findMany({
      where: {
        sectionId: {
          in: allSections.map(s => s.id)
        }
      }
    });
    
    // Get all responses for this assessment
    const allResponses = await prisma.response.findMany({
      where: { assessmentId: params.id }
    });
    
    // Check if all mandatory questions have been answered
    const mandatoryQuestions = allQuestions.filter(q => q.mandatory);
    const answeredMandatoryQuestions = mandatoryQuestions.filter(q => {
      const response = allResponses.find(r => r.questionId === q.id);
      return response && response.value !== null && response.value !== undefined && response.value !== "";
    });
    
    const isCompleted = answeredMandatoryQuestions.length === mandatoryQuestions.length && mandatoryQuestions.length > 0;
    
    // Get current assessment status
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id }
    });
    
    let statusChanged = false;
    let newStatus = assessment?.status;
    
    // If assessment should be completed but isn't, update it
    if (isCompleted && assessment?.status !== "COMPLETED") {
      await prisma.assessment.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      statusChanged = true;
      newStatus = "COMPLETED";
      
      // Generate suggestions for the newly completed assessment
      try {
        await SuggestionEngine.generateSuggestions(params.id);
      } catch (error) {
        console.error("Error generating suggestions:", error);
        // Don't fail the completion check if suggestions fail
      }
    }
    // If assessment shouldn't be completed but is, update it
    else if (!isCompleted && assessment?.status === "COMPLETED") {
      await prisma.assessment.update({
        where: { id: params.id },
        data: {
          status: "IN_PROGRESS",
          completedAt: null,
        },
      });
      statusChanged = true;
      newStatus = "IN_PROGRESS";
    }
    
    return NextResponse.json({
      assessmentId: params.id,
      currentStatus: assessment?.status,
      newStatus,
      statusChanged,
      completionCheck: {
        totalMandatoryQuestions: mandatoryQuestions.length,
        answeredMandatoryQuestions: answeredMandatoryQuestions.length,
        isCompleted,
        mandatoryQuestions: mandatoryQuestions.map(q => ({ id: q.id, text: q.text })),
        answeredQuestions: answeredMandatoryQuestions.map(q => ({ id: q.id, text: q.text })),
        allResponses: allResponses.map(r => ({ questionId: r.questionId, value: r.value }))
      }
    });
  } catch (error) {
    console.error("Error checking assessment completion:", error);
    return NextResponse.json(
      { error: "Failed to check assessment completion" },
      { status: 500 }
    );
  }
} 