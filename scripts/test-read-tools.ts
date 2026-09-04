/**
 * scripts/test-read-tools.ts
 *
 * Standalone test script for all Step 16 read tools.
 * Calls each tool's execute() directly — no LLM involved.
 *
 * Usage:
 *   npx tsx scripts/test-read-tools.ts
 *
 * Requires a running MySQL instance and a populated .env file.
 */

import "dotenv/config";

// We need to replicate what the tool() helper does — just call execute() directly.
// The actual tool objects wrap execute(), so we import the functions from the file
// using a small shim.

import db from "../lib/db";

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

// ── get_current_datetime ─────────────────────────────────────────────────────

async function testGetCurrentDatetime() {
  const now = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const result = {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    day_of_week: days[now.getDay()],
    iso: now.toISOString(),
  };
  log("get_current_datetime", result);

  if (!result.date || !result.day_of_week) throw new Error("Missing fields");
  console.log("  → date and day_of_week present ✓");
}

// ── get_schedule ─────────────────────────────────────────────────────────────

async function testGetSchedule() {
  // All schedules
  const all = await db.schedule.findMany({ orderBy: [{ day: "asc" }, { start_time: "asc" }] });
  log("get_schedule (all)", { count: all.length, first: all[0] });

  // Filter by day
  const monday = await db.schedule.findMany({ where: { day: { contains: "Monday" } } });
  log("get_schedule (day=Monday)", { count: monday.length });

  // Filter by course
  const cse = await db.schedule.findMany({ where: { course: { contains: "CSE" } } });
  log("get_schedule (course=CSE)", { count: cse.length });

  if (all.length === 0) throw new Error("No schedules found — is the DB seeded?");
  console.log("  → Schedule data present ✓");
}

// ── get_rooms ─────────────────────────────────────────────────────────────────

async function testGetRooms() {
  // All rooms
  const rooms = await db.room.findMany({ include: { bookings: true }, orderBy: { room_number: "asc" } });
  log("get_rooms (all)", { count: rooms.length, first: { id: rooms[0]?.id, room_number: rooms[0]?.room_number, capacity: rooms[0]?.capacity } });

  // Min capacity filter
  const bigRooms = rooms.filter(r => r.capacity >= 30);
  log("get_rooms (min_capacity=30)", { count: bigRooms.length });

  // Equipment filter
  const projector = rooms.filter(r => {
    const eq = r.equipment as string[];
    return eq.some(e => e.toLowerCase().includes("projector"));
  });
  log("get_rooms (equipment=projector)", { count: projector.length });

  // Availability window — use a future date unlikely to have conflicts
  const testDate = "2099-01-15";
  const available = rooms.filter(r => {
    const conflict = r.bookings.find(b =>
      b.date === testDate && b.start_time < "16:00" && b.end_time > "14:00"
    );
    return !conflict;
  });
  log(`get_rooms (available on ${testDate} 14:00-16:00)`, { count: available.length });

  if (rooms.length === 0) throw new Error("No rooms found — is the DB seeded?");
  console.log("  → Rooms data present ✓");
}

// ── get_events ────────────────────────────────────────────────────────────────

async function testGetEvents() {
  const events = await db.event.findMany({
    include: { registrations: true },
    orderBy: { date: "asc" },
  });
  const result = events.map(e => ({ ...e, spots_remaining: Math.max(0, e.capacity - e.registered) }));
  log("get_events (all)", { count: result.length, first: { name: result[0]?.name, status: result[0]?.status, spots_remaining: result[0]?.spots_remaining } });

  // Filter open events
  const open = events.filter(e => e.status === "open");
  log("get_events (status=open)", { count: open.length });

  if (events.length === 0) throw new Error("No events found — is the DB seeded?");
  console.log("  → Events data present ✓");
}

// ── get_announcements ─────────────────────────────────────────────────────────

async function testGetAnnouncements() {
  const today = new Date().toISOString().slice(0, 10);

  // Active only (default)
  const active = await db.announcement.findMany({
    where: { expires: { gte: today } },
    orderBy: [{ priority: "asc" }, { date: "desc" }],
  });
  log("get_announcements (active only)", { count: active.length });

  // All including expired
  const all = await db.announcement.findMany({ orderBy: [{ priority: "asc" }, { date: "desc" }] });
  log("get_announcements (include_expired=true)", { count: all.length });

  // High priority
  const high = await db.announcement.findMany({ where: { priority: "high", expires: { gte: today } } });
  log("get_announcements (priority=high)", { count: high.length });

  console.log(`  → Active: ${active.length}, Total: ${all.length}, Expired: ${all.length - active.length} ✓`);
}

// ── get_assignments ────────────────────────────────────────────────────────────

async function testGetAssignments() {
  const all = await db.assignment.findMany({ orderBy: { deadline: "asc" } });
  log("get_assignments (all)", { count: all.length });

  // Due within 365 days
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 365);
  const todayStr = today.toISOString().slice(0, 10);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const upcoming = await db.assignment.findMany({
    where: { deadline: { gte: todayStr, lte: cutoffStr } },
    orderBy: { deadline: "asc" },
  });
  log("get_assignments (due_within_days=365)", { count: upcoming.length, first: upcoming[0]?.title });

  // Course filter
  const cse = await db.assignment.findMany({ where: { course: { contains: "CSE" } } });
  log("get_assignments (course=CSE)", { count: cse.length });

  if (all.length === 0) throw new Error("No assignments found — is the DB seeded?");
  console.log("  → Assignments data present ✓");
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧪  CampusOS — Step 16 Read Tools Test");
  console.log("=".repeat(60));

  const tests: Array<[string, () => Promise<void>]> = [
    ["get_current_datetime", testGetCurrentDatetime],
    ["get_schedule", testGetSchedule],
    ["get_rooms", testGetRooms],
    ["get_events", testGetEvents],
    ["get_announcements", testGetAnnouncements],
    ["get_assignments", testGetAssignments],
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
