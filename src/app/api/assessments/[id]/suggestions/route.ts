import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuggestionEngine } from "@/lib/suggestion-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessmentId = params.id;

    // Check if assessment exists and is completed
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        responses: true
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Assessment must be completed to generate suggestions" }, { status: 400 });
    }

    // Generate suggestions
    const suggestions = await SuggestionEngine.generateSuggestions(assessmentId);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessmentId = params.id;

    // Get existing suggestions for the assessment
    const suggestions = await SuggestionEngine.getAssessmentSuggestions(assessmentId);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 