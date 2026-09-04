import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { POST as bookRoom } from "@/app/api/rooms/[id]/book/route";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id: roomId } = await context.params;
    const bookings = await db.booking.findMany({
      where: { room_id: roomId },
      orderBy: [{ date: "asc" }, { start_time: "asc" }],
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings." }, { status: 500 });
  }
}

export const POST = bookRoom;