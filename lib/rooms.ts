import db from "@/lib/db";
import { notifyChange } from "@/lib/notify";

/**
 * Checks if a specific room is available for a given date and time range.
 * An overlap occurs if an existing booking has:
 *   booking.start_time < endTime AND booking.end_time > startTime
 *
 * @returns true if available, false if occupied/conflicting
 */
export async function isRoomAvailable(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const conflict = await findConflictingBooking(roomId, date, startTime, endTime);
  return conflict === null;
}

/**
 * Finds the conflicting booking for a room, date, and time range if one exists.
 */
export async function findConflictingBooking(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string
) {
  return await db.booking.findFirst({
    where: {
      room_id: roomId,
      date: date,
      start_time: { lt: endTime },
      end_time: { gt: startTime },
    },
  });
}

export interface CreateBookingParams {
  roomId: string;
  bookedBy: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  bookingId?: string;
}

/**
 * Transactionally verifies availability and creates a room booking.
 * Exported for direct reuse by the API route and AI Agent tools.
 */
export async function createBooking(params: CreateBookingParams) {
  const { roomId, bookedBy, date, startTime, endTime, purpose, bookingId } = params;

  // 1. Verify room exists
  const room = await db.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return {
      success: false,
      error: `Room '${roomId}' not found.`,
      status: 404,
    };
  }

  // 2. Check for conflicting booking
  const conflict = await findConflictingBooking(roomId, date, startTime, endTime);
  if (conflict) {
    return {
      success: false,
      error: `Room ${room.room_number} is already booked on ${date} from ${conflict.start_time} to ${conflict.end_time} by ${conflict.booked_by} (${conflict.purpose}).`,
      conflict,
      status: 409,
    };
  }

  // 3. Create booking
  const newBookingId = bookingId || `bk-${crypto.randomUUID().slice(0, 8)}`;
  const booking = await db.booking.create({
    data: {
      booking_id: newBookingId,
      room_id: roomId,
      booked_by: bookedBy,
      date,
      start_time: startTime,
      end_time: endTime,
      purpose,
    },
  });

  // 4. Notify live subscribers
  notifyChange("rooms", { action: "update", id: roomId });
  notifyChange("bookings", { action: "create", id: booking.booking_id });

  return {
    success: true,
    booking,
    status: 201,
  };
}

/**
 * Cancels / deletes an existing booking by booking_id.
 */
export async function cancelBooking(roomId: string, bookingId: string) {
  const existing = await db.booking.findFirst({
    where: {
      booking_id: bookingId,
      room_id: roomId,
    },
  });

  if (!existing) {
    return {
      success: false,
      error: `Booking '${bookingId}' not found for room '${roomId}'.`,
      status: 404,
    };
  }

  await db.booking.delete({
    where: { booking_id: bookingId },
  });

  notifyChange("rooms", { action: "update", id: roomId });
  notifyChange("bookings", { action: "delete", id: bookingId });

  return {
    success: true,
    status: 200,
  };
}
