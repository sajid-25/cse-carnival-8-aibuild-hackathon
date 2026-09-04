import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, requireFields } from "@/lib/api";

const fields = ["title", "body", "date", "priority", "posted_by", "expires"];

export async function GET() {
  return NextResponse.json(await db.announcement.findMany({ orderBy: { date: "desc" } }));
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, fields);
    if (missing) return apiError(`Missing required field: ${missing}.`);
    if (!["high", "medium", "low"].includes(String(body.priority))) return apiError("Priority must be high, medium, or low.");
    const announcement = await db.announcement.create({ data: { id: String(body.id ?? `ann-${crypto.randomUUID()}`), ...body } as Prisma.AnnouncementCreateInput });
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return apiError("Unable to create announcement.", 500);
  }
}