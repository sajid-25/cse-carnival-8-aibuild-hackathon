import { NextRequest, NextResponse } from "next/server";
import { RegistrationSchema } from "@/lib/validation/events";
import { registerForEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/events/[id]/register
 * Validates student_id + name, checks capacity & duplicate registration,
 * and transactionally inserts the registration and updates event counts.
 */
export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: eventId } = await context.params;

    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const result = RegistrationSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          error: firstError,
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const regResult = await registerForEvent({
      eventId,
      studentId: result.data.student_id,
      name: result.data.name,
    });

    if (!regResult.success) {
      return NextResponse.json(
        { error: regResult.error },
        { status: regResult.status }
      );
    }

    return NextResponse.json(regResult.registration, { status: 201 });
  } catch (error) {
    console.error("POST /api/events/[id]/register error:", error);
    return NextResponse.json(
      { error: "Unable to register for event." },
      { status: 500 }
    );
  }
}
