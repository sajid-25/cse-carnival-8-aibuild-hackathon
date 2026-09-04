import { z } from "zod";

export const ScheduleBaseSchema = z.object({
  id: z.string().optional(),
  course: z.string().min(1, "Course code is required (e.g. CSE101)"),
  title: z.string().min(1, "Course title is required"),
  day: z.enum(
    [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    {
      errorMap: () => ({ message: "Day must be a valid weekday (e.g. Monday)" }),
    }
  ),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:MM format (e.g. 09:00)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:MM format (e.g. 10:30)"),
  room: z.string().min(1, "Room is required"),
  instructor: z.string().min(1, "Instructor name is required"),
  section: z.string().min(1, "Section is required"),
});

export const ScheduleSchema = ScheduleBaseSchema.refine(
  (data) => data.start_time < data.end_time,
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

export const ScheduleUpdateSchema = ScheduleBaseSchema.partial().refine(
  (data) => {
    if (data.start_time && data.end_time) {
      return data.start_time < data.end_time;
    }
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

export type ScheduleInput = z.infer<typeof ScheduleSchema>;
export type ScheduleUpdateInput = z.infer<typeof ScheduleUpdateSchema>;
