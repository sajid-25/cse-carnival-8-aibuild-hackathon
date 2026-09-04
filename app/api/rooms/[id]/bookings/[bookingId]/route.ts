import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/rooms";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; bookingId: string }> };

/**
 * DELETE /api/rooms/[id]/bookings/[bookingId]
 * Cancels a booking and frees the slot.
 */
export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id: roomId, bookingId } = await context.params;

    const result = await cancelBooking(roomId, bookingId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, booking_id: bookingId });
  } catch (error) {
    console.error("DELETE booking error:", error);
    return NextResponse.json(
      { error: "Unable to cancel booking." },
      { status: 500 }
    );
  }
}