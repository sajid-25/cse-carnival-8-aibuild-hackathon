import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, requireFields } from "@/lib/api";

const fields = ["course", "title", "day", "start_time", "end_time", "room", "instructor", "section"];

export async function GET() {
  return NextResponse.json(await db.schedule.findMany({ orderBy: [{ day: "asc" }, { start_time: "asc" }] }));
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, fields);
    if (missing) return apiError(`Missing required field: ${missing}.`);
    const schedule = await db.schedule.create({ data: { id: String(body.id ?? `sch-${crypto.randomUUID()}`), ...body } as Prisma.ScheduleCreateInput });
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Create schedule error:", error);
    return apiError("Unable to create schedule.", 500);
  }
}