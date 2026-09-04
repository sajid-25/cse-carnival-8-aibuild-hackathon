import { z } from "zod";

export const RoomBaseSchema = z.object({
  id: z.string().optional(),
  room_number: z.string().min(1, "Room number is required (e.g. UB 101)"),
  type: z.string().min(1, "Room type is required (e.g. Lecture Hall)"),
  capacity: z.number().int().positive("Capacity must be a positive integer"),
  equipment: z.array(z.string()).default([]),
  floor: z.number().int("Floor must be an integer"),
  status: z.enum(["available", "maintenance", "reserved", "occupied"]).default("available"),
});

export const RoomSchema = RoomBaseSchema;
export const RoomUpdateSchema = RoomBaseSchema.partial();

export const BookingBaseSchema = z.object({
  booking_id: z.string().optional(),
  booked_by: z.string().min(1, "Booked by is required (e.g. Prof. Smith)"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:MM format (e.g. 09:00)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:MM format (e.g. 11:00)"),
  purpose: z.string().min(1, "Booking purpose is required"),
});

export const BookingSchema = BookingBaseSchema.refine(
  (data) => data.start_time < data.end_time,
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

export type RoomInput = z.infer<typeof RoomSchema>;
export type RoomUpdateInput = z.infer<typeof RoomUpdateSchema>;
export type BookingInput = z.infer<typeof BookingSchema>;
