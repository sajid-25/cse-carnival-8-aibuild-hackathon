import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError } from "@/lib/api";
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

export const POST = registerRoute;