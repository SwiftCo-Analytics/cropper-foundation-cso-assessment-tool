import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

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
            value: answers[question.id] || null,
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

 