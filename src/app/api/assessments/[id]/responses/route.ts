import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // If not saveOnly, check if this is the last section and mark assessment as completed
    if (!saveOnly) {
      const allSections = await prisma.section.findMany({
        orderBy: { order: 'asc' },
      });
      
      const currentSection = await prisma.section.findUnique({
        where: { id: sectionId },
      });

      if (currentSection && currentSection.order === allSections.length) {
        // This is the last section, mark assessment as completed
        await prisma.assessment.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
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

 