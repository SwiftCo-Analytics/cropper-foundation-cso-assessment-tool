import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suggestions = await prisma.assessmentSuggestion.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error fetching assessment suggestions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { condition, suggestion, priority, weight, isActive } = body;

    if (!suggestion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSuggestion = await prisma.assessmentSuggestion.create({
      data: {
        condition,
        suggestion,
        priority: priority || 0,
        weight: weight || 1.0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(newSuggestion);
  } catch (error) {
    console.error("Error creating assessment suggestion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 