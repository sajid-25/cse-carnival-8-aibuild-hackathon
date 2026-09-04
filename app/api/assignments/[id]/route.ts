import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { apiError, isRecord } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const assignment = await db.assignment.findUnique({ where: { id } });
  return assignment ? NextResponse.json(assignment) : apiError("Assignment not found.", 404);
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isRecord(body)) return apiError("Request body must be an object.");
    const { id: _ignored, ...data } = body;
    const assignment = await db.assignment.update({ where: { id }, data: data as Prisma.AssignmentUpdateInput });
    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Update assignment error:", error);
    return apiError("Unable to update assignment.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await db.assignment.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return apiError("Unable to delete assignment.", 500);
  }
}