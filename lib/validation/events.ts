import { z } from "zod";

export const EventBaseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().min(1, "Event description is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:MM format (e.g. 09:00)")
    .optional(),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:MM format (e.g. 17:00)")
    .optional(),
  time: z.string().optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  venue: z.string().optional(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  created_by: z.string().optional(),
  capacity: z.number().int().positive("Capacity must be a positive integer"),
  registered: z.number().int().nonnegative().optional().default(0),
  status: z
    .enum(["upcoming", "open", "full", "completed", "cancelled"])
    .default("upcoming"),
}).refine(
  (data) => !!(data.name || data.title),
  { message: "Event name/title is required", path: ["name"] }
).refine(
  (data) => !!(data.venue || data.location),
  { message: "Event venue/location is required", path: ["venue"] }
);

export const EventSchema = EventBaseSchema;
export const EventUpdateSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  time: z.string().optional(),
  end_date: z.string().optional(),
  venue: z.string().optional(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  created_by: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  registered: z.number().int().nonnegative().optional(),
  status: z
    .enum(["upcoming", "open", "full", "completed", "cancelled"])
    .optional(),
});

export const RegistrationSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  name: z.string().min(1, "Student name is required"),
});

export type EventInput = z.infer<typeof EventSchema>;
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;
export type RegistrationInput = z.infer<typeof RegistrationSchema>;
