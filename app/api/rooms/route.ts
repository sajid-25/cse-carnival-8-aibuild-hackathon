import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, parsePositiveNumber, requireFields } from "@/lib/api";

const fields = ["room_number", "type", "capacity", "equipment", "floor", "status"];

export async function GET() {
  return NextResponse.json(await db.room.findMany({ include: { bookings: true }, orderBy: { room_number: "asc" } }));
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, fields);
    if (missing) return apiError(`Missing required field: ${missing}.`);
    if (!parsePositiveNumber(body.capacity) || !Number.isInteger(body.floor)) return apiError("Capacity and floor must be valid numbers.");
    if (!Array.isArray(body.equipment)) return apiError("Equipment must be an array.");
    const room = await db.room.create({ data: { id: String(body.id ?? `room-${crypto.randomUUID()}`), ...body } as Prisma.RoomCreateInput });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    return apiError("Unable to create room.", 500);
  }
}