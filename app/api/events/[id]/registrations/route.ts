import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { POST as registerRoute } from "@/app/api/events/[id]/register/route";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id: eventId } = await context.params;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return apiError("Event not found.", 404);

  const registrations = await db.registration.findMany({
    where: { event_id: eventId },
    orderBy: { student_id: "asc" },
  });
  return NextResponse.json(registrations);
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: eventId } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, ["student_id", "name"]);
    if (missing) return apiError(`Missing required field: ${missing}.`);

    const studentId = String(body.student_id);
    const name = String(body.name);
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) return apiError("Event not found.", 404);
    if (event.status === "cancelled" || event.status === "completed") return apiError("Registration is closed for this event.", 409);
    if (event.registered >= event.capacity) return apiError("Event is full.", 409);

    const existing = await db.registration.findUnique({ where: { event_id_student_id: { event_id: eventId, student_id: studentId } } });
    if (existing) return apiError("Student is already registered for this event.", 409);

    const registration = await db.$transaction(async (transaction) => {
      const currentEvent = await transaction.event.findUnique({ where: { id: eventId } });
      if (!currentEvent || currentEvent.registered >= currentEvent.capacity) throw new Error("EVENT_FULL");
      const created = await transaction.registration.create({ data: { event_id: eventId, student_id: studentId, name } });
      await transaction.event.update({ where: { id: eventId }, data: { registered: { increment: 1 }, status: currentEvent.registered + 1 >= currentEvent.capacity ? "full" : currentEvent.status } });
      return created;
    });
    return NextResponse.json(registrations);
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_FULL") return apiError("Event is full.", 409);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return apiError("Student is already registered for this event.", 409);
    console.error("Create registration error:", error);
    return apiError("Unable to register for event.", 500);
  }
}

export const POST = registerRoute;