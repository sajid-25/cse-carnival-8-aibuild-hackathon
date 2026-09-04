import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { EventUpdateSchema } from "@/lib/validation/events";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const event = await db.event.findUnique({
      where: { id },
      include: {
        registrations: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("GET event error:", error);
    return NextResponse.json(
      { error: "Unable to fetch event." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Event not found." },
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

    const result = EventUpdateSchema.safeParse(json);
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
    const updateData: any = {};
    if (d.name || d.title) updateData.name = d.name || d.title;
    if (d.description) updateData.description = d.description;
    if (d.date) updateData.date = d.date;
    if (d.start_time || d.time) updateData.start_time = d.start_time || d.time;
    if (d.end_time) updateData.end_time = d.end_time;
    if (d.end_date) updateData.end_date = d.end_date;
    if (d.venue || d.location) updateData.venue = d.venue || d.location;
    if (d.organizer || d.created_by) updateData.organizer = d.organizer || d.created_by;
    if (d.capacity !== undefined) updateData.capacity = d.capacity;
    if (d.registered !== undefined) updateData.registered = d.registered;
    if (d.status) updateData.status = d.status;

    const updated = await db.event.update({
      where: { id },
      data: updateData,
      include: { registrations: true },
    });

    notifyChange("events", { action: "update", id: updated.id });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Unable to update event." },
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

    const existing = await db.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    await db.$transaction([
      db.registration.deleteMany({ where: { event_id: id } }),
      db.event.delete({ where: { id } }),
    ]);

    notifyChange("events", { action: "delete", id });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Unable to delete event." },
      { status: 500 }
    );
  }
}