import { NextRequest, NextResponse } from "next/server";
import { cancelRegistration } from "@/lib/events";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; studentId: string }> };

/**
 * DELETE /api/events/[id]/register/[studentId]
 * Cancels a student's registration and decrements registered count.
 */
export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id: eventId, studentId } = await context.params;

    const result = await cancelRegistration(eventId, studentId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, student_id: studentId });
  } catch (error) {
    console.error("DELETE registration error:", error);
    return NextResponse.json(
      { error: "Unable to cancel registration." },
      { status: 500 }
    );
  }
}
