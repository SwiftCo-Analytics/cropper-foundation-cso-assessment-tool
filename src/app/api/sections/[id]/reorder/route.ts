import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const reorderSchema = z.object({
  order: z.number().int().min(0),
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
    const { order } = reorderSchema.parse(body);

    // Get the current section
    const currentSection = await prisma.section.findUnique({
      where: { id: params.id },
    });

    if (!currentSection) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Get all sections
    const sections = await prisma.section.findMany({
      orderBy: { order: 'asc' },
    });

    // Calculate new order for sections
    const updatedSections = sections.map((section) => {
      if (section.id === params.id) {
        return { ...section, order };
      }
      if (
        currentSection.order < order &&
        section.order > currentSection.order &&
        section.order <= order
      ) {
        return { ...section, order: section.order - 1 };
      }
      if (
        currentSection.order > order &&
        section.order < currentSection.order &&
        section.order >= order
      ) {
        return { ...section, order: section.order + 1 };
      }
      return section;
    });

    // Update all sections in a transaction
    await prisma.$transaction(
      updatedSections.map((section) =>
        prisma.section.update({
          where: { id: section.id },
          data: { order: section.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error reordering section:", error);
    return NextResponse.json(
      { error: "Failed to reorder section" },
      { status: 500 }
    );
  }
} 