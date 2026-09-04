import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError } from "@/lib/api";

type Context = { params: Promise<{ id: string; bookingId: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id: roomId, bookingId } = await context.params;
    const booking = await db.booking.findFirst({ where: { booking_id: bookingId, room_id: roomId } });
    if (!booking) return apiError("Booking not found.", 404);
    await db.booking.delete({ where: { booking_id: bookingId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete booking error:", error);
    return apiError("Unable to cancel booking.", 500);
  }
}