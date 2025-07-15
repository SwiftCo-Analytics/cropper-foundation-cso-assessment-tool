import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { QuestionType } from "@/generated/prisma";

export const dynamic = 'force-dynamic';

const questionUpdateSchema = z.object({
  text: z.string().optional(),
  description: z.string().nullable().optional(),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "SINGLE_CHOICE",
    "LIKERT_SCALE",
    "TEXT",
    "BOOLEAN",
  ]).optional(),
  options: z.any().nullable().optional(), // Allow any JSON value
  isHidden: z.boolean().optional(),
  mandatory: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = questionUpdateSchema.parse(body);

    const question = await prisma.question.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
} 