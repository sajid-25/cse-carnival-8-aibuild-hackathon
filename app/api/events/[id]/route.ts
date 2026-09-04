import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const event = await db.event.findUnique({ where: { id }, include: { registrations: true } });
  return event ? NextResponse.json(event) : apiError("Event not found.", 404);
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const { id: _ignored, registrations: _registrations, ...data } = body;
    const event = await db.event.update({ where: { id }, data: data as Prisma.EventUpdateInput });
    return NextResponse.json(event);
  } catch (error) {
    console.error("Update event error:", error);
    return apiError("Unable to update event.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await db.event.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete event error:", error);
    return apiError("Unable to delete event.", 500);
  }
}