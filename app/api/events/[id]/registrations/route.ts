import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, requireFields } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: eventId } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, ["student_id", "name"]);
    if (missing) return apiError(`Missing required field: ${missing}.`);

    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) return apiError("Event not found.", 404);
    if (event.status === "cancelled" || event.status === "completed") return apiError("Registration is closed for this event.", 409);
    if (event.registered >= event.capacity) return apiError("Event is full.", 409);

    const registration = await db.$transaction(async (transaction) => {
      const created = await transaction.registration.create({ data: { event_id: eventId, student_id: String(body.student_id), name: String(body.name) } });
      await transaction.event.update({ where: { id: eventId }, data: { registered: { increment: 1 }, status: event.registered + 1 >= event.capacity ? "full" : event.status } });
      return created;
    });
    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Create registration error:", error);
    return apiError("Unable to register for event.", 500);
  }
}