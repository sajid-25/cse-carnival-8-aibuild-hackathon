/**
 * scripts/test-action-tools.ts
 *
 * Standalone test script for all Step 17 action tools.
 * Calls lib functions directly — no LLM involved.
 * Uses real MySQL via Prisma.
 *
 * Usage:
 *   npx tsx scripts/test-action-tools.ts
 */

import "dotenv/config";
import db from "../lib/db";
import { createBooking, cancelBooking, isRoomAvailable } from "../lib/rooms";
import { registerForEvent, cancelRegistration } from "../lib/events";

// ── helpers ──────────────────────────────────────────────────────────────────

function log(label: string, data: unknown) {
  console.log("\n" + "─".repeat(60));
  console.log(`✅  ${label}`);
  console.log("─".repeat(60));
  console.log(JSON.stringify(data, null, 2));
}

function fail(label: string, err: unknown) {
  console.error("\n" + "─".repeat(60));
  console.error(`❌  ${label} FAILED`);
  console.error("─".repeat(60));
  console.error(err);
}

// ── test_book_room ────────────────────────────────────────────────────────────

async function testBookRoom() {
  // Pick any room that exists
  const room = await db.room.findFirst({ orderBy: { room_number: "asc" } });
  if (!room) throw new Error("No rooms found — is the DB seeded?");

  const testDate = "2099-12-25";
  const startTime = "10:00";
  const endTime = "12:00";

  // 1. Should succeed on a clear slot
  const bookResult = await createBooking({
    roomId: room.id,
    bookedBy: "Test Agent",
    date: testDate,
    startTime,
    endTime,
    purpose: "Step 17 test booking",
  });
  log("book_room — success on free slot", {
    success: bookResult.success,
    booking_id: bookResult.booking?.booking_id,
    room_number: room.room_number,
  });
  if (!bookResult.success) throw new Error("Expected booking to succeed");

  // 2. Availability check should now return false for overlapping slot
  const stillAvailable = await isRoomAvailable(
    room.id,
    testDate,
    "09:00",
    "11:00" // overlaps with 10:00-12:00
  );
  log("isRoomAvailable — should be false (overlapping slot)", { available: stillAvailable });
  if (stillAvailable) throw new Error("Expected room to be unavailable after booking");

  // 3. Double-booking the exact same slot should fail with 409
  const conflictResult = await createBooking({
    roomId: room.id,
    bookedBy: "Another Person",
    date: testDate,
    startTime: "10:30",
    endTime: "11:30",
    purpose: "Conflict test",
  });
  log("book_room — conflict on taken slot (should be 409)", {
    success: conflictResult.success,
    status: conflictResult.status,
    error: conflictResult.error,
  });
  if (conflictResult.success) throw new Error("Expected booking to fail with conflict");
  if (conflictResult.status !== 409) throw new Error(`Expected 409, got ${conflictResult.status}`);

  // 4. Cancel the test booking
  const bookingId = bookResult.booking!.booking_id;
  const cancelResult = await cancelBooking(room.id, bookingId);
  log("cancel_booking — success", {
    success: cancelResult.success,
    booking_id: bookingId,
  });
  if (!cancelResult.success) throw new Error("Expected cancellation to succeed");

  // 5. Slot should be free again
  const availableAgain = await isRoomAvailable(room.id, testDate, "10:00", "12:00");
  log("isRoomAvailable — should be true again after cancel", { available: availableAgain });
  if (!availableAgain) throw new Error("Expected room to be available after cancellation");

  // 6. Cancel non-existent booking should fail
  const badCancel = await cancelBooking(room.id, "bk-doesnotexist");
  log("cancel_booking — 404 on non-existent booking", {
    success: badCancel.success,
    status: badCancel.status,
    error: badCancel.error,
  });
  if (badCancel.success) throw new Error("Expected cancellation to fail for missing booking");
}

// ── test_register_event ───────────────────────────────────────────────────────

async function testRegisterEvent() {
  // Pick an event that isn't at capacity
  const event = await db.event.findFirst({
    where: { registered: { lt: db.event.fields.capacity } },
    include: { registrations: true },
    orderBy: { registered: "asc" },
  });
  if (!event) throw new Error("No available events found — is the DB seeded?");

  const testStudentId = `test-student-${Date.now()}`;
  const testName = "Test Student";

  // 1. Register successfully
  const regResult = await registerForEvent({
    eventId: event.id,
    studentId: testStudentId,
    name: testName,
  });
  log("register_event — success", {
    success: regResult.success,
    event_name: regResult.event?.name,
    new_count: regResult.event?.registered,
    spots_remaining: Math.max(0, (regResult.event?.capacity ?? 0) - (regResult.event?.registered ?? 0)),
  });
  if (!regResult.success) throw new Error(`Expected registration to succeed: ${regResult.error}`);

  // 2. Double registration should fail
  const dupResult = await registerForEvent({
    eventId: event.id,
    studentId: testStudentId,
    name: testName,
  });
  log("register_event — duplicate blocked (409)", {
    success: dupResult.success,
    status: dupResult.status,
    error: dupResult.error,
  });
  if (dupResult.success) throw new Error("Expected duplicate registration to be rejected");
  if (dupResult.status !== 409) throw new Error(`Expected 409, got ${dupResult.status}`);

  // 3. Cancel registration
  const cancelResult = await cancelRegistration(event.id, testStudentId);
  log("cancel_registration — success", {
    success: cancelResult.success,
    event_id: event.id,
    student_id: testStudentId,
  });
  if (!cancelResult.success) throw new Error(`Expected cancellation to succeed: ${cancelResult.error}`);

  // 4. Verify count decremented
  const updated = await db.event.findUnique({ where: { id: event.id } });
  log("Event registered count after cancel", {
    original: event.registered,
    after_registration: event.registered + 1,
    after_cancellation: updated?.registered,
  });
  if (updated?.registered !== event.registered) {
    throw new Error(`Count mismatch: expected ${event.registered}, got ${updated?.registered}`);
  }

  // 5. Cancel non-existent registration should fail
  const badCancel = await cancelRegistration(event.id, "nonexistent-student");
  log("cancel_registration — 404 on non-existent registration", {
    success: badCancel.success,
    status: badCancel.status,
    error: badCancel.error,
  });
  if (badCancel.success) throw new Error("Expected cancellation to fail for missing registration");
}

// ── test_capacity_enforcement ─────────────────────────────────────────────────

async function testCapacityEnforcement() {
  // Find a full event, or create a scenario
  const fullEvent = await db.event.findFirst({ where: { status: "full" } });

  if (fullEvent) {
    const result = await registerForEvent({
      eventId: fullEvent.id,
      studentId: "overflow-student",
      name: "Overflow Student",
    });
    log("register_event — capacity enforcement on full event", {
      success: result.success,
      status: result.status,
      error: result.error,
    });
    if (result.success) throw new Error("Expected registration to fail on full event");
    if (result.status !== 409) throw new Error(`Expected 409, got ${result.status}`);
  } else {
    log("capacity_enforcement — no full events in DB, skipping", {
      note: "This test is best verified when an event reaches capacity",
    });
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧪  CampusOS — Step 17 Action Tools Test");
  console.log("=".repeat(60));

  const tests: Array<[string, () => Promise<void>]> = [
    ["book_room + cancel_booking + isRoomAvailable", testBookRoom],
    ["register_event + cancel_registration", testRegisterEvent],
    ["capacity enforcement", testCapacityEnforcement],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
    } catch (err) {
      fail(name, err);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊  Results: ${passed} passed, ${failed} failed`);

  await db.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await db.$disconnect();
  process.exit(1);
});
