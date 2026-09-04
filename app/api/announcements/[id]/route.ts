import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AnnouncementUpdateSchema } from "@/lib/validation/announcements";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(announcement);
  } catch (error) {
    console.error("GET announcement error:", error);
    return NextResponse.json(
      { error: "Unable to fetch announcement." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 }
      );
    }

    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const result = AnnouncementUpdateSchema.safeParse(json);
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

    const { id: _ignored, ...data } = result.data;
    const announcement = await db.announcement.update({
      where: { id },
      data,
    });

    notifyChange("announcements", { action: "update", id: announcement.id });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Update announcement error:", error);
    return NextResponse.json(
      { error: "Unable to update announcement." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  return PATCH(request, context);
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 }
      );
    }

    await db.announcement.delete({ where: { id } });

    notifyChange("announcements", { action: "delete", id });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json(
      { error: "Unable to delete announcement." },
      { status: 500 }
    );
  }
}