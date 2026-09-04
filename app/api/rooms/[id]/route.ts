import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const room = await db.room.findUnique({ where: { id }, include: { bookings: true } });
  return room ? NextResponse.json(room) : apiError("Room not found.", 404);
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const { id: _ignored, bookings: _bookings, ...data } = body;
    const room = await db.room.update({ where: { id }, data: data as Prisma.RoomUpdateInput });
    return NextResponse.json(room);
  } catch (error) {
    console.error("Update room error:", error);
    return apiError("Unable to update room.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await db.room.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete room error:", error);
    return apiError("Unable to delete room.", 500);
  }
}