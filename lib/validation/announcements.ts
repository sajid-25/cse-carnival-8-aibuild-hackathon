import { z } from "zod";

export const AnnouncementBaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Announcement title is required"),
  body: z.string().min(1, "Announcement body is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  priority: z.enum(["high", "medium", "low"], {
    errorMap: () => ({ message: "Priority must be high, medium, or low" }),
  }),
  posted_by: z.string().min(1, "Author / Posted by is required"),
  expires: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format"),
});

export const AnnouncementSchema = AnnouncementBaseSchema;
export const AnnouncementUpdateSchema = AnnouncementBaseSchema.partial();

export type AnnouncementInput = z.infer<typeof AnnouncementSchema>;
export type AnnouncementUpdateInput = z.infer<typeof AnnouncementUpdateSchema>;
