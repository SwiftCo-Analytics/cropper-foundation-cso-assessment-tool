import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createResponseSchema = z.object({
  sectionId: z.string(),
  answers: z.record(z.any()),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { sectionId, answers } = createResponseSchema.parse(body);

    // Get questions for this section
    const questions = await prisma.question.findMany({
      where: { sectionId },
    });

    // Create responses for each question
    const responses = await Promise.all(
      questions.map((question) =>
        prisma.response.create({
          data: {
            assessmentId: params.id,
            questionId: question.id,
            answer: answers[question.id] || null,
            // You can implement scoring logic here based on the question type and answer
            score: calculateScore(question, answers[question.id]),
          },
        })
      )
    );

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error saving responses:", error);
    return NextResponse.json(
      { error: "Failed to save responses" },
      { status: 500 }
    );
  }
}

function calculateScore(
  question: { type: string; options?: any },
  answer: any
): number {
  switch (question.type) {
    case "LIKERT_SCALE":
      return Number(answer) || 0;
    case "BOOLEAN":
      return answer === "true" ? 1 : 0;
    case "MULTIPLE_CHOICE":
      // Implement your multiple choice scoring logic
      return 0;
    case "SINGLE_CHOICE":
      // Implement your single choice scoring logic
      return 0;
    case "TEXT":
      // Text responses might not have a numerical score
      return 0;
    default:
      return 0;
  }
} 