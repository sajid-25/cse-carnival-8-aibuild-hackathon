import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ScheduleUpdateSchema } from "@/lib/validation/schedule";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const schedule = await db.schedule.findUnique({ where: { id } });
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("GET schedule error:", error);
    return NextResponse.json(
      { error: "Unable to fetch schedule." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.schedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Schedule not found." },
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

    const result = ScheduleUpdateSchema.safeParse(json);
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

    const newStart = result.data.start_time ?? existing.start_time;
    const newEnd = result.data.end_time ?? existing.end_time;
    if (newStart >= newEnd) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    const { id: _ignored, ...data } = result.data;
    const schedule = await db.schedule.update({
      where: { id },
      data,
    });

    notifyChange("schedule", { action: "update", id: schedule.id });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json(
      { error: "Unable to update schedule." },
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

    const existing = await db.schedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Schedule not found." },
        { status: 404 }
      );
    }

    await db.schedule.delete({ where: { id } });

    notifyChange("schedule", { action: "delete", id });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return NextResponse.json(
      { error: "Unable to delete schedule." },
      { status: 500 }
    );
  }
}