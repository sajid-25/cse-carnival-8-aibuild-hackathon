import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AssignmentUpdateSchema } from "@/lib/validation/assignments";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const assignment = await db.assignment.findUnique({ where: { id } });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(assignment);
  } catch (error) {
    console.error("GET assignment error:", error);
    return NextResponse.json(
      { error: "Unable to fetch assignment." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const result = AssignmentUpdateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          error: firstError,
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id: _ignored, ...data } = result.data;
    const assignment = await db.assignment.update({
      where: { id },
      data,
    });

    notifyChange("assignments", { action: "update", id: assignment.id });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Update assignment error:", error);
    return NextResponse.json(
      { error: "Unable to update assignment." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  return PATCH(request, context);
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    await db.assignment.delete({ where: { id } });

    notifyChange("assignments", { action: "delete", id });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json(
      { error: "Unable to delete assignment." },
      { status: 500 }
    );
  }
}