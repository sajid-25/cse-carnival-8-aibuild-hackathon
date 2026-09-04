import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { EventSchema } from "@/lib/validation/events";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GET /api/events
 */
export async function GET() {
  try {
    const events = await db.event.findMany({
      include: {
        registrations: true,
      },
      orderBy: [{ date: "asc" }, { start_time: "asc" }],
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Creates a new event with Zod validation.
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

    const result = EventSchema.safeParse(json);
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

    const d = result.data;
    const eventId = d.id || `evt-${crypto.randomUUID().slice(0, 8)}`;
    const eventName = d.name || d.title || "Untitled Event";
    const startTime = d.start_time || d.time || "09:00";
    const endTime = d.end_time || "17:00";
    const endDate = d.end_date || d.date;
    const venue = d.venue || d.location || "TBA";
    const organizer = d.organizer || d.created_by || "CSE Department";

    const event = await db.event.create({
      data: {
        id: eventId,
        name: eventName,
        description: d.description,
        date: d.date,
        start_time: startTime,
        end_time: endTime,
        end_date: endDate,
        venue,
        organizer,
        capacity: d.capacity,
        registered: d.registered ?? 0,
        status: d.status ?? "upcoming",
      },
      include: { registrations: true },
    });

    notifyChange("events", { action: "create", id: event.id });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Unable to create event." },
      { status: 500 }
    );
  }
}