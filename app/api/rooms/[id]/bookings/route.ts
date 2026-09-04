import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, requireFields } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };
const fields = ["booked_by", "date", "start_time", "end_time", "purpose"];

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: roomId } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, fields);
    if (missing) return apiError(`Missing required field: ${missing}.`);
    if (String(body.start_time) >= String(body.end_time)) return apiError("End time must be after start time.");

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) return apiError("Room not found.", 404);
    const conflict = await db.booking.findFirst({ where: { room_id: roomId, date: String(body.date), start_time: { lt: String(body.end_time) }, end_time: { gt: String(body.start_time) } } });
    if (conflict) return apiError("Room is already booked during that time.", 409);

    const booking = await db.booking.create({ data: { booking_id: `bk-${crypto.randomUUID()}`, room_id: roomId, booked_by: String(body.booked_by), date: String(body.date), start_time: String(body.start_time), end_time: String(body.end_time), purpose: String(body.purpose) } });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return apiError("Unable to create booking.", 500);
  }
}