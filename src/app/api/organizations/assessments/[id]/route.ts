import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireVerifiedOrganization } from "@/lib/organization-auth";

export const dynamic = 'force-dynamic';

const updateAssessmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireVerifiedOrganization(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }
    const body = await request.json();
    const { name } = updateAssessmentSchema.parse(body);

    // Verify the assessment belongs to the organization
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: params.id,
        organizationId: auth.orgId,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Update the assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id: params.id },
      data: { name },
    });

    return NextResponse.json({
      assessment: {
        id: updatedAssessment.id,
        name: updatedAssessment.name,
        status: updatedAssessment.status,
      },
    });
  } catch (error) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireVerifiedOrganization(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status });
    }

    // Verify the assessment belongs to the organization
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: params.id,
        organizationId: auth.orgId,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of completed assessments
    if (assessment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed assessments cannot be deleted" },
        { status: 400 }
      );
    }

    // Delete the assessment and all related data
    await prisma.assessment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Assessment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}