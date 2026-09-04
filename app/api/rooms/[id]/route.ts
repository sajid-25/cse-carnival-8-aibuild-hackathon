import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RoomUpdateSchema } from "@/lib/validation/rooms";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const room = await db.room.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: [{ date: "asc" }, { start_time: "asc" }],
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("GET room error:", error);
    return NextResponse.json(
      { error: "Unable to fetch room." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Room not found." },
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

    const result = RoomUpdateSchema.safeParse(json);
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

    const { id: _ignored, ...data } = result.data;
    const room = await db.room.update({
      where: { id },
      data,
      include: { bookings: true },
    });

    notifyChange("rooms", { action: "update", id: room.id });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { error: "Unable to update room." },
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

    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Room not found." },
        { status: 404 }
      );
    }

    // Delete nested bookings first, then room
    await db.$transaction([
      db.booking.deleteMany({ where: { room_id: id } }),
      db.room.delete({ where: { id } }),
    ]);

    notifyChange("rooms", { action: "delete", id });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Unable to delete room." },
      { status: 500 }
    );
  }
}