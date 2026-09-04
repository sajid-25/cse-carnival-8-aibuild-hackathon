import { tool } from "ai";
import { z } from "zod";
import db from "@/lib/db";

// ─── get_current_datetime ─────────────────────────────────────────────────────
/**
 * Returns the authoritative server date, time, and day-of-week.
 * The agent must ALWAYS call this before any date-relative queries
 * instead of guessing or using a hardcoded value.
 */
export const get_current_datetime = tool({
  description:
    "Returns the current server date, time (24-hour), and day of the week. " +
    "Always call this before answering any date- or day-relative question.",
  parameters: z.object({}),
  execute: async () => {
    const now = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return {
      date: now.toISOString().slice(0, 10), // YYYY-MM-DD
      time: now.toTimeString().slice(0, 5), // HH:MM
      day_of_week: days[now.getDay()],
      iso: now.toISOString(),
    };
  },
});

// ─── get_schedule ─────────────────────────────────────────────────────────────
export const get_schedule = tool({
  description:
    "Returns the class schedule. Optionally filter by day of week (e.g. 'Monday') " +
    "and/or course code (e.g. 'CSE101'). Always reads live from the database.",
  parameters: z.object({
    day: z
      .string()
      .optional()
      .describe("Day of the week to filter by (e.g. 'Monday')"),
    course: z
      .string()
      .optional()
      .describe("Course code to filter by (e.g. 'CSE101')"),
  }),
  execute: async ({ day, course }) => {
    const where: Record<string, unknown> = {};
    if (day) where.day = { contains: day };
    if (course) where.course = { contains: course };

    const schedules = await db.schedule.findMany({
      where,
      orderBy: [{ day: "asc" }, { start_time: "asc" }],
    });

    return { count: schedules.length, schedules };
  },
});

// ─── get_rooms ────────────────────────────────────────────────────────────────
export const get_rooms = tool({
  description:
    "Returns a list of rooms. Optionally filter by minimum capacity, required equipment, " +
    "and/or an availability time window (date + start_time + end_time). " +
    "When a time window is provided, only rooms with no conflicting bookings in that window are returned.",
  parameters: z.object({
    min_capacity: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Minimum number of seats required"),
    equipment: z
      .string()
      .optional()
      .describe("Required equipment item (e.g. 'projector')"),
    date: z
      .string()
      .optional()
      .describe("Date to check availability (YYYY-MM-DD)"),
    start_time: z
      .string()
      .optional()
      .describe("Start of availability window (HH:MM)"),
    end_time: z
      .string()
      .optional()
      .describe("End of availability window (HH:MM)"),
  }),
  execute: async ({ min_capacity, equipment, date, start_time, end_time }) => {
    const where: Record<string, unknown> = {};
    if (min_capacity) where.capacity = { gte: min_capacity };

    const rooms = await db.room.findMany({
      where,
      include: { bookings: true },
      orderBy: { room_number: "asc" },
    });

    let filtered = rooms;

    // Equipment filter (stored as JSON array in DB)
    if (equipment) {
      const needle = equipment.toLowerCase();
      filtered = filtered.filter((r) => {
        const equip = r.equipment as string[];
        return equip.some((e) => e.toLowerCase().includes(needle));
      });
    }

    // Availability window filter — same overlap logic as the rooms API
    if (date && start_time && end_time) {
      filtered = filtered.filter((r) => {
        const conflict = r.bookings.find(
          (b) =>
            b.date === date &&
            b.start_time < end_time &&
            b.end_time > start_time
        );
        return !conflict;
      });
    }

    // Strip bookings detail from output for brevity unless agent needs it
    const result = filtered.map((r) => ({
      id: r.id,
      room_number: r.room_number,
      type: r.type,
      capacity: r.capacity,
      equipment: r.equipment,
      floor: r.floor,
      status: r.status,
      booking_count: r.bookings.length,
      bookings: r.bookings,
    }));

    return { count: result.length, rooms: result };
  },
});

// ─── get_events ───────────────────────────────────────────────────────────────
export const get_events = tool({
  description:
    "Returns all campus events with their registration lists and counts. " +
    "Optionally filter by status (e.g. 'open', 'full', 'upcoming', 'cancelled', 'completed').",
  parameters: z.object({
    status: z
      .string()
      .optional()
      .describe(
        "Event status to filter by: 'open', 'full', 'upcoming', 'cancelled', 'completed'"
      ),
  }),
  execute: async ({ status }) => {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const events = await db.event.findMany({
      where,
      include: { registrations: true },
      orderBy: { date: "asc" },
    });

    const result = events.map((e) => ({
      ...e,
      spots_remaining: Math.max(0, e.capacity - e.registered),
    }));

    return { count: result.length, events: result };
  },
});

// ─── get_announcements ────────────────────────────────────────────────────────
export const get_announcements = tool({
  description:
    "Returns campus announcements. By default excludes expired announcements. " +
    "Pass include_expired=true to see everything. Optionally filter by priority: 'high', 'medium', 'low'.",
  parameters: z.object({
    include_expired: z
      .boolean()
      .optional()
      .default(false)
      .describe("Set to true to include announcements past their expires date"),
    priority: z
      .enum(["high", "medium", "low"])
      .optional()
      .describe("Filter by priority level"),
  }),
  execute: async ({ include_expired, priority }) => {
    const where: Record<string, unknown> = {};
    if (priority) where.priority = priority;

    if (!include_expired) {
      const today = new Date().toISOString().slice(0, 10);
      where.expires = { gte: today };
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: [{ priority: "asc" }, { date: "desc" }],
    });

    return { count: announcements.length, announcements };
  },
});

// ─── get_assignments ──────────────────────────────────────────────────────────
export const get_assignments = tool({
  description:
    "Returns course assignments. Optionally filter by course code and/or by " +
    "due_within_days (e.g. 7 means only assignments due in the next 7 days from today's server date).",
  parameters: z.object({
    course: z
      .string()
      .optional()
      .describe("Course code to filter by (e.g. 'CSE101')"),
    due_within_days: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Only return assignments due within this many days from today"),
  }),
  execute: async ({ course, due_within_days }) => {
    const where: Record<string, unknown> = {};
    if (course) where.course = { contains: course };

    if (due_within_days !== undefined) {
      const today = new Date();
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + due_within_days);
      const todayStr = today.toISOString().slice(0, 10);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      where.deadline = { gte: todayStr, lte: cutoffStr };
    }

    const assignments = await db.assignment.findMany({
      where,
      orderBy: { deadline: "asc" },
    });

    // Tag each assignment with how many days until deadline
    const today = new Date().toISOString().slice(0, 10);
    const result = assignments.map((a) => {
      const daysUntilDeadline = Math.ceil(
        (new Date(a.deadline).getTime() - new Date(today).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return { ...a, days_until_deadline: daysUntilDeadline };
    });

    return { count: result.length, assignments: result };
  },
});
