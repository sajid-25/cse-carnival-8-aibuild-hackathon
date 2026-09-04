import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { POST as registerRoute } from "@/app/api/events/[id]/register/route";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id: eventId } = await context.params;
    const registrations = await db.registration.findMany({
      where: { event_id: eventId },
      orderBy: { registered_at: "asc" },
    });
    return NextResponse.json(registrations);
  } catch (error) {
    console.error("GET registrations error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations." }, { status: 500 });
  }
}

export const POST = registerRoute;