import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const schedule = await db.schedule.findUnique({ where: { id } });
  return schedule ? NextResponse.json(schedule) : apiError("Schedule not found.", 404);
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const { id: _ignored, ...data } = body;
    const schedule = await db.schedule.update({ where: { id }, data: data as Prisma.ScheduleUpdateInput });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    return apiError("Unable to update schedule.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await db.schedule.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return apiError("Unable to delete schedule.", 500);
  }
}