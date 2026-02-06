import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}

const updateNameSchema = z.object({ name: z.string().min(2) });

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = updateNameSchema.parse(body);

    await prisma.admin.update({
      where: { email: session.user.email },
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
    console.error("Error updating admin name:", error);
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    );
  }
}
