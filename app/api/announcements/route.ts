import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AnnouncementSchema } from "@/lib/validation/announcements";
import { notifyChange } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GET /api/announcements
 * Query filters:
 *  - ?priority=high
 *  - ?active_only=true (filters out past expires date based on server date)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");
    const activeOnly = searchParams.get("active_only");

    const where: any = {};

    if (priority) {
      where.priority = { equals: priority.toLowerCase() };
    }

    if (activeOnly === "true" || activeOnly === "1") {
      const today = new Date().toISOString().split("T")[0];
      where.expires = { gte: today };
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: [{ date: "desc" }, { priority: "asc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Validates payload with Zod and broadcasts change notification.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const result = AnnouncementSchema.safeParse(json);
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

    const { id, ...data } = result.data;
    const announcementId = id || `ann-${crypto.randomUUID().slice(0, 8)}`;

    const announcement = await db.announcement.create({
      data: {
        id: announcementId,
        ...data,
      },
    });

    notifyChange("announcements", { action: "create", id: announcement.id });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { error: "Unable to create announcement." },
      { status: 500 }
    );
  }
}