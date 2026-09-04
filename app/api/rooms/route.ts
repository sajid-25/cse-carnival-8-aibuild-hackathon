import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RoomSchema } from "@/lib/validation/rooms";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms
 * Query filters:
 *  - ?min_capacity=10
 *  - ?equipment=projector,whiteboard
 *  - ?date=2026-09-05&start_time=14:00&end_time=16:00 (availability filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minCapacityParam = searchParams.get("min_capacity");
    const equipmentParam = searchParams.get("equipment");
    const date = searchParams.get("date");
    const startTime = searchParams.get("start_time");
    const endTime = searchParams.get("end_time");

    const where: any = {};

    if (minCapacityParam) {
      const minCap = parseInt(minCapacityParam, 10);
      if (!isNaN(minCap)) {
        where.capacity = { gte: minCap };
      }
    }

    let rooms = await db.room.findMany({
      where,
      include: {
        bookings: {
          orderBy: [{ date: "asc" }, { start_time: "asc" }],
        },
      },
      orderBy: { room_number: "asc" },
    });

    // Equipment filter (in-memory parsing of JSON equipment array)
    if (equipmentParam) {
      const requiredEquip = equipmentParam
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (requiredEquip.length > 0) {
        rooms = rooms.filter((room) => {
          const roomEquip = Array.isArray(room.equipment)
            ? (room.equipment as string[]).map((e) => String(e).toLowerCase())
            : [];
          return requiredEquip.every((req) =>
            roomEquip.some((e) => e.includes(req) || req.includes(e))
          );
        });
      }
    }

    // Availability filter: if date, start_time, and end_time are provided
    if (date && startTime && endTime) {
      rooms = rooms.filter((room) => {
        // Room is available if NO booking overlaps
        const hasConflict = room.bookings.some(
          (b) =>
            b.date === date &&
            b.start_time < endTime &&
            b.end_time > startTime
        );
        return !hasConflict;
      });
    }

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms
 * Validates payload with Zod and broadcasts change notification.
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

    const result = RoomSchema.safeParse(json);
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

    const { id, ...data } = result.data;
    const roomId = id || `room-${crypto.randomUUID().slice(0, 8)}`;

    const room = await db.room.create({
      data: {
        id: roomId,
        ...data,
      },
      include: { bookings: true },
    });

    notifyChange("rooms", { action: "create", id: room.id });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Unable to create room." },
      { status: 500 }
    );
  }
}