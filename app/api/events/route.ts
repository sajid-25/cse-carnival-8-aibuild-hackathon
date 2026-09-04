import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord, parsePositiveNumber, requireFields } from "@/lib/api";

const fields = ["name", "description", "date", "start_time", "end_time", "end_date", "venue", "organizer", "capacity", "status"];

export async function GET() {
  return NextResponse.json(await db.event.findMany({ include: { registrations: true }, orderBy: { date: "asc" } }));
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const missing = requireFields(body, fields);
    if (missing) return apiError(`Missing required field: ${missing}.`);
    if (!parsePositiveNumber(body.capacity) || typeof body.registered !== "number" || body.registered < 0) return apiError("Capacity and registered must be valid numbers.");
    const event = await db.event.create({ data: { id: String(body.id ?? `evt-${crypto.randomUUID()}`), registered: 0, ...body } as Prisma.EventCreateInput });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return apiError("Unable to create event.", 500);
  }
}