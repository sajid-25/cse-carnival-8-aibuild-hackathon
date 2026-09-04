import db from "@/lib/db";
import { notifyChange } from "@/lib/notify";

export interface RegisterEventParams {
  eventId: string;
  studentId: string;
  name: string;
}

/**
 * Registers a student for an event transactionally with capacity enforcement.
 * Exported for direct reuse by the API route and AI Agent tools.
 */
export async function registerForEvent(params: RegisterEventParams) {
  const { eventId, studentId, name } = params;

  // 1. Fetch current event details
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { registrations: true },
  });

  if (!event) {
    return {
      success: false,
      error: `Event '${eventId}' not found.`,
      status: 404,
    };
  }

  // 2. Check event status
  if (event.status === "cancelled" || event.status === "completed") {
    return {
      success: false,
      error: `Registration is closed because event '${event.name}' is ${event.status}.`,
      status: 409,
    };
  }

  // 3. Check duplicate registration
  const alreadyRegistered = event.registrations.some(
    (r) => r.student_id === studentId
  );
  if (alreadyRegistered) {
    return {
      success: false,
      error: `Student '${studentId}' (${name}) is already registered for '${event.name}'.`,
      status: 409,
    };
  }

  // 4. Check capacity limit
  if (event.registered >= event.capacity) {
    return {
      success: false,
      error: `Cannot register: Event '${event.name}' has reached its maximum capacity of ${event.capacity} attendees.`,
      status: 409,
    };
  }

  // 5. Transactional insert & counter update
  const newRegisteredCount = event.registered + 1;
  const newStatus =
    newRegisteredCount >= event.capacity ? "full" : event.status === "upcoming" ? "open" : event.status;

  const result = await db.$transaction(async (tx) => {
    const registration = await tx.registration.create({
      data: {
        event_id: eventId,
        student_id: studentId,
        name,
      },
    });

    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: {
        registered: { increment: 1 },
        status: newStatus,
      },
      include: { registrations: true },
    });

    return { registration, updatedEvent };
  });

  // 6. Broadcast SSE live updates
  notifyChange("events", { action: "update", id: eventId });
  notifyChange("registrations", { action: "create", id: `${eventId}-${studentId}` });

  return {
    success: true,
    registration: result.registration,
    event: result.updatedEvent,
    status: 201,
  };
}

/**
 * Cancels a student registration transactionally and decrements registered count.
 */
export async function cancelRegistration(eventId: string, studentId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { registrations: true },
  });

  if (!event) {
    return {
      success: false,
      error: `Event '${eventId}' not found.`,
      status: 404,
    };
  }

  const registration = await db.registration.findUnique({
    where: {
      event_id_student_id: {
        event_id: eventId,
        student_id: studentId,
      },
    },
  });

  if (!registration) {
    return {
      success: false,
      error: `Registration for student '${studentId}' on event '${eventId}' not found.`,
      status: 404,
    };
  }

  await db.$transaction(async (tx) => {
    await tx.registration.delete({
      where: {
        event_id_student_id: {
          event_id: eventId,
          student_id: studentId,
        },
      },
    });

    const newCount = Math.max(0, event.registered - 1);
    const newStatus = event.status === "full" && newCount < event.capacity ? "open" : event.status;

    await tx.event.update({
      where: { id: eventId },
      data: {
        registered: newCount,
        status: newStatus,
      },
    });
  });

  notifyChange("events", { action: "update", id: eventId });
  notifyChange("registrations", { action: "delete", id: `${eventId}-${studentId}` });

  return {
    success: true,
    status: 200,
  };
}
