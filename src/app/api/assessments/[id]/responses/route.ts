import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SuggestionEngine } from "@/lib/suggestion-engine";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createResponseSchema = z.object({
  sectionId: z.string(),
  answers: z.record(z.any()),
  saveOnly: z.boolean().optional().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await prisma.response.findMany({
      where: { assessmentId: params.id },
      include: {
        question: true,
      },
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { sectionId, answers, saveOnly = false } = createResponseSchema.parse(body);

    // Get questions for this section
    const questions = await prisma.question.findMany({
      where: { sectionId },
    });

    // Delete existing responses for this section to avoid duplicates
    await prisma.response.deleteMany({
      where: {
        assessmentId: params.id,
        questionId: {
          in: questions.map(q => q.id),
        },
      },
    });

    // Create responses for each question
    const responses = await Promise.all(
      questions.map((question) =>
        prisma.response.create({
          data: {
            assessmentId: params.id,
            questionId: question.id,
            value: answers[question.id] || null,
          },
        })
      )
    );

    // If not saveOnly, check if all sections are completed and mark assessment as completed
    if (!saveOnly) {
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
      
      console.log(`Assessment ${params.id} completion check:`, {
        totalMandatoryQuestions: mandatoryQuestions.length,
        answeredMandatoryQuestions: answeredMandatoryQuestions.length,
        mandatoryQuestions: mandatoryQuestions.map(q => ({ id: q.id, text: q.text })),
        answeredQuestions: answeredMandatoryQuestions.map(q => ({ id: q.id, text: q.text })),
        allResponses: allResponses.map(r => ({ questionId: r.questionId, value: r.value }))
      });
      
      // If all mandatory questions are answered, mark assessment as completed
      if (answeredMandatoryQuestions.length === mandatoryQuestions.length && mandatoryQuestions.length > 0) {
        // Check if assessment is already completed to avoid duplicate suggestion generation
        const currentAssessment = await prisma.assessment.findUnique({
          where: { id: params.id },
        });
        
        if (currentAssessment?.status !== "COMPLETED") {
          console.log(`Marking assessment ${params.id} as completed`);
          await prisma.assessment.update({
            where: { id: params.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
          
          // Auto-generate suggestions for the newly completed assessment
          try {
            console.log(`Auto-generating suggestions for assessment ${params.id}`);
            await SuggestionEngine.generateSuggestions(params.id);
            console.log(`Successfully generated suggestions for assessment ${params.id}`);
          } catch (error) {
            console.error("Error auto-generating suggestions:", error);
            // Don't fail the response save if suggestions fail
          }
        }
      } else {
        console.log(`Assessment ${params.id} not completed yet. Missing ${mandatoryQuestions.length - answeredMandatoryQuestions.length} mandatory questions`);
      }
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error saving responses:", error);
    return NextResponse.json(
      { error: "Failed to save responses" },
      { status: 500 }
    );
  }
}

 