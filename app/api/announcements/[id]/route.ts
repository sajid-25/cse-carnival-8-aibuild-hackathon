import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const announcement = await db.announcement.findUnique({ where: { id } });
  return announcement ? NextResponse.json(announcement) : apiError("Announcement not found.", 404);
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const { id: _ignored, ...data } = body;
    const announcement = await db.announcement.update({ where: { id }, data: data as Prisma.AnnouncementUpdateInput });
    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Update announcement error:", error);
    return apiError("Unable to update announcement.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await db.announcement.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return apiError("Unable to delete announcement.", 500);
  }
}