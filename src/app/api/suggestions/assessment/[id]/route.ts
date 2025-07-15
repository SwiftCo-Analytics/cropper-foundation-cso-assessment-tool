import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { condition, suggestion, priority, weight, isActive } = body;

    const updatedSuggestion = await prisma.assessmentSuggestion.update({
      where: { id: params.id },
      data: {
        ...(condition && { condition }),
        ...(suggestion && { suggestion }),
        ...(priority !== undefined && { priority }),
        ...(weight !== undefined && { weight }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(updatedSuggestion);
  } catch (error) {
    console.error("Error updating assessment suggestion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.assessmentSuggestion.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assessment suggestion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 