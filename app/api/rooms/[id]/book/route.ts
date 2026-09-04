import { NextRequest, NextResponse } from "next/server";
import { BookingSchema } from "@/lib/validation/rooms";
import { createBooking } from "@/lib/rooms";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/rooms/[id]/book
 * Checks for overlapping bookings on that room/date before inserting.
 * Returns 409 conflict if busy.
 */
export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: roomId } = await context.params;

    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const result = BookingSchema.safeParse(json);
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

    const bookingResult = await createBooking({
      roomId,
      bookedBy: result.data.booked_by,
      date: result.data.date,
      startTime: result.data.start_time,
      endTime: result.data.end_time,
      purpose: result.data.purpose,
      bookingId: result.data.booking_id,
    });

    if (!bookingResult.success) {
      return NextResponse.json(
        {
          error: bookingResult.error,
          conflict: (bookingResult as any).conflict,
        },
        { status: bookingResult.status }
      );
    }

    return NextResponse.json(bookingResult.booking, { status: 201 });
  } catch (error) {
    console.error("POST /api/rooms/[id]/book error:", error);
    return NextResponse.json(
      { error: "Unable to create booking." },
      { status: 500 }
    );
  }
}
