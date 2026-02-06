import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateNameSchema = z.object({ name: z.string().min(2) });

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };

    const organization = await prisma.organization.findUnique({
      where: { id: decoded.orgId },
      select: {
        id: true,
        name: true,
        email: true,
        assessments: {
          include: {
            responses: {
              select: {
                questionId: true,
                value: true,
              },
            },
            report: {
              select: {
                id: true,
                content: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
      },
      assessments: organization.assessments,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as { orgId: string };
    const body = await request.json();
    const { name } = updateNameSchema.parse(body);

    await prisma.organization.update({
      where: { id: decoded.orgId },
      data: { name },
    });

    return NextResponse.json({ message: "Name updated successfully", name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }
    console.error("Error updating organization name:", error);
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    );
  }
} 