import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AssignmentSchema } from "@/lib/validation/assignments";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GET /api/assignments
 * Query filters:
 *  - ?course=CSE 4113
 *  - ?due_within_days=7 (computed server-side from today's date)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const dueWithinDaysParam = searchParams.get("due_within_days");

    const where: any = {};

    if (course) {
      where.course = { contains: course };
    }

    if (dueWithinDaysParam) {
      const days = parseInt(dueWithinDaysParam, 10);
      if (!isNaN(days) && days >= 0) {
        const today = new Date().toISOString().split("T")[0];
        const futureDate = new Date(Date.now() + days * 86400000)
          .toISOString()
          .split("T")[0];

        where.deadline = {
          gte: today,
          lte: futureDate,
        };
      }
    }

    const assignments = await db.assignment.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { course: "asc" }],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assignments
 * Validates payload with Zod and broadcasts change notification.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const result = AssignmentSchema.safeParse(json);
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

    const { id, ...data } = result.data;
    const assignmentId = id || `asgn-${crypto.randomUUID().slice(0, 8)}`;

    const assignment = await db.assignment.create({
      data: {
        id: assignmentId,
        ...data,
      },
    });

    notifyChange("assignments", { action: "create", id: assignment.id });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "Unable to create assignment." },
      { status: 500 }
    );
  }
}