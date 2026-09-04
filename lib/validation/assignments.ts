import { z } from "zod";

export const AssignmentBaseSchema = z.object({
  id: z.string().optional(),
  course: z.string().min(1, "Course code is required (e.g. CSE 4113)"),
  course_title: z.string().optional().default(""),
  title: z.string().min(1, "Assignment title is required"),
  description: z.string().min(1, "Assignment description is required"),
  assigned_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Assigned date must be in YYYY-MM-DD format"),
  deadline: z
    .string()
    .min(1, "Deadline is required"),
  submission_platform: z.string().min(1, "Submission platform is required (e.g. Google Classroom)"),
  status: z
    .enum(["pending", "submitted", "graded", "assigned", "overdue"])
    .default("pending"),
  marks: z.number().int().nonnegative("Marks must be a non-negative integer"),
});

export const AssignmentSchema = AssignmentBaseSchema;
export const AssignmentUpdateSchema = AssignmentBaseSchema.partial();

export type AssignmentInput = z.infer<typeof AssignmentSchema>;
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>;
