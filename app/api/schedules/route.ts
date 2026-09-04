import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ScheduleSchema } from "@/lib/validation/schedule";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedules (or /api/schedule)
 * Optional filters:
 *  - ?day=Monday
 *  - ?course=CSE101
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day");
    const course = searchParams.get("course");

    const where: any = {};

    if (day) {
      where.day = { equals: day };
    }

    if (course) {
      where.course = { contains: course };
    }

    const schedules = await db.schedule.findMany({
      where,
      orderBy: [{ day: "asc" }, { start_time: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("GET /api/schedules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedules (or /api/schedule)
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

    const result = ScheduleSchema.safeParse(json);
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
    const scheduleId = id || `sch-${crypto.randomUUID().slice(0, 8)}`;

    const schedule = await db.schedule.create({
      data: {
        id: scheduleId,
        ...data,
      },
    });

    notifyChange("schedule", { action: "create", id: schedule.id });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Create schedule error:", error);
    return NextResponse.json(
      { error: "Unable to create schedule." },
      { status: 500 }
    );
  }
}