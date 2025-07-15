import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { QuestionType } from "@/generated/prisma";

export const dynamic = 'force-dynamic';

const questionSchema = z.object({
  sectionId: z.string(),
  text: z.string(),
  description: z.string().nullable(),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "SINGLE_CHOICE",
    "LIKERT_SCALE",
    "TEXT",
    "BOOLEAN",
  ]),
  options: z.any().nullable(), // Allow any JSON value
  order: z.number(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = questionSchema.parse(body);

    const question = await prisma.question.create({
      data: validatedData,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;
    const validatedData = questionSchema.parse(data);

    const question = await prisma.question.update({
      where: { id },
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

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    await prisma.question.delete({
      where: { id },
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