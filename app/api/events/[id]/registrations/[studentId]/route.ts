import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError } from "@/lib/api";

type Context = { params: Promise<{ id: string; studentId: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id: eventId, studentId } = await context.params;
    const registration = await db.registration.findUnique({ where: { event_id_student_id: { event_id: eventId, student_id: studentId } } });
    if (!registration) return apiError("Registration not found.", 404);
    await db.$transaction([
      db.registration.delete({ where: { event_id_student_id: { event_id: eventId, student_id: studentId } } }),
      db.event.update({ where: { id: eventId }, data: { registered: { decrement: 1 }, status: "upcoming" } }),
    ]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Cancel registration error:", error);
    return apiError("Unable to cancel registration.", 500);
  }
}