import { tool } from "ai";
import { z } from "zod";
import {
  createBooking,
  cancelBooking,
  isRoomAvailable,
} from "@/lib/rooms";
import {
  registerForEvent,
  cancelRegistration,
} from "@/lib/events";

// ─── book_room ────────────────────────────────────────────────────────────────
/**
 * Books a room for a specified date/time range.
 * Reuses isRoomAvailable() + createBooking() from lib/rooms.ts — zero duplication
 * of conflict logic. Returns a structured result; never throws.
 */
export const book_room = tool({
  description:
    "Books a room for a specific date and time range. " +
    "Checks for conflicts before inserting — returns a structured error if the slot is taken. " +
    "On success, broadcasts an SSE notification so the dashboard updates live.",
  parameters: z.object({
    room_id: z
      .string()
      .describe("The ID of the room to book (e.g. 'room-001')"),
    booked_by: z
      .string()
      .describe("Name of the person booking the room"),
    date: z
      .string()
      .describe("Date of the booking in YYYY-MM-DD format"),
    start_time: z
      .string()
      .describe("Start time of the booking in HH:MM format (24-hour)"),
    end_time: z
      .string()
      .describe("End time of the booking in HH:MM format (24-hour)"),
    purpose: z
      .string()
      .describe("Purpose/reason for the booking"),
  }),
  execute: async ({ room_id, booked_by, date, start_time, end_time, purpose }) => {
    const result = await createBooking({
      roomId: room_id,
      bookedBy: booked_by,
      date,
      startTime: start_time,
      endTime: end_time,
      purpose,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        conflict: result.conflict ?? null,
        status: result.status,
      };
    }

    return {
      success: true,
      booking: result.booking,
      message: `Room booked successfully for ${date} from ${start_time} to ${end_time}.`,
      status: 201,
    };
  },
});

// ─── cancel_booking ───────────────────────────────────────────────────────────
/**
 * Cancels an existing room booking by booking_id.
 * Delegates to cancelBooking() from lib/rooms.ts — SSE is emitted inside that function.
 */
export const cancel_booking = tool({
  description:
    "Cancels an existing room booking. " +
    "Requires the room_id and booking_id. " +
    "Broadcasts an SSE notification on success so the dashboard updates live.",
  parameters: z.object({
    room_id: z
      .string()
      .describe("The ID of the room that was booked"),
    booking_id: z
      .string()
      .describe("The ID of the booking to cancel (e.g. 'bk-abc12345')"),
  }),
  execute: async ({ room_id, booking_id }) => {
    const result = await cancelBooking(room_id, booking_id);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        status: result.status,
      };
    }

    return {
      success: true,
      message: `Booking '${booking_id}' for room '${room_id}' has been cancelled.`,
      status: 200,
    };
  },
});

// ─── register_event ───────────────────────────────────────────────────────────
/**
 * Registers a student for a campus event.
 * Reuses registerForEvent() from lib/events.ts which enforces capacity and
 * duplicate-registration checks transactionally. SSE is emitted on success.
 */
export const register_event = tool({
  description:
    "Registers a student for a campus event. " +
    "Rejects if the event is at full capacity or the student is already registered. " +
    "Broadcasts an SSE notification on success so the dashboard updates live.",
  parameters: z.object({
    event_id: z
      .string()
      .describe("The ID of the event to register for (e.g. 'event-001')"),
    student_id: z
      .string()
      .describe("Unique student identifier (e.g. '22-49767-2')"),
    name: z
      .string()
      .describe("Full name of the student"),
  }),
  execute: async ({ event_id, student_id, name }) => {
    const result = await registerForEvent({
      eventId: event_id,
      studentId: student_id,
      name,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        status: result.status,
      };
    }

    return {
      success: true,
      registration: result.registration,
      event: {
        id: result.event?.id,
        name: result.event?.name,
        registered: result.event?.registered,
        capacity: result.event?.capacity,
        status: result.event?.status,
        spots_remaining: Math.max(
          0,
          (result.event?.capacity ?? 0) - (result.event?.registered ?? 0)
        ),
      },
      message: `${name} (${student_id}) successfully registered for '${result.event?.name}'.`,
      status: 201,
    };
  },
});

// ─── cancel_registration ──────────────────────────────────────────────────────
/**
 * Cancels a student's event registration.
 * Delegates to cancelRegistration() from lib/events.ts which handles the
 * transaction and decrements the registered count. SSE is emitted on success.
 */
export const cancel_registration = tool({
  description:
    "Cancels a student's registration for a campus event. " +
    "Requires the event_id and student_id. " +
    "Broadcasts an SSE notification on success so the dashboard updates live.",
  parameters: z.object({
    event_id: z
      .string()
      .describe("The ID of the event"),
    student_id: z
      .string()
      .describe("Unique student identifier to deregister"),
  }),
  execute: async ({ event_id, student_id }) => {
    const result = await cancelRegistration(event_id, student_id);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        status: result.status,
      };
    }

    return {
      success: true,
      message: `Registration for student '${student_id}' on event '${event_id}' has been cancelled.`,
      status: 200,
    };
  },
});
