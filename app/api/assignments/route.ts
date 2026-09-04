import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, parsePositiveNumber, requireFields } from "@/lib/api";

const fields = ["course", "course_title", "title", "description", "assigned_date", "deadline", "submission_platform", "status", "marks"];

export async function GET() {
  return NextResponse.json(await db.assignment.findMany({ orderBy: { deadline: "asc" } }));
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, fields);
    if (missing) return apiError(`Missing required field: ${missing}.`);
    if (!parsePositiveNumber(body.marks)) return apiError("Marks must be a positive number.");
    const assignment = await db.assignment.create({ data: { id: String(body.id ?? `asgn-${crypto.randomUUID()}`), ...body } as Prisma.AssignmentCreateInput });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Create assignment error:", error);
    return apiError("Unable to create assignment.", 500);
  }
}