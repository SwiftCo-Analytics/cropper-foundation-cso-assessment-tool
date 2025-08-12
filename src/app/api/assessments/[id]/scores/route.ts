import { NextRequest, NextResponse } from "next/server";
import { SuggestionEngine } from "@/lib/suggestion-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = params.id;

    if (!assessmentId) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    // Get CSO scores using the SuggestionEngine
    const scores = await SuggestionEngine.getCSOScores(assessmentId);

    if (!scores) {
      return NextResponse.json(
        { error: "Assessment not found or no responses available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      scores,
      success: true
    });

  } catch (error) {
    console.error("Error getting CSO scores:", error);
    return NextResponse.json(
      { error: "Failed to get CSO scores" },
      { status: 500 }
    );
  }
} 