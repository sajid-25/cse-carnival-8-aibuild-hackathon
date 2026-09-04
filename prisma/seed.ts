import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

interface BookingData {
  booking_id: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

interface RoomData {
  id: string;
  room_number: string;
  type: string;
  capacity: number;
  equipment: string[];
  floor: number;
  status: string;
  bookings: BookingData[];
}

interface RegistrationData {
  student_id: string;
  name: string;
}

interface EventData {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date: string;
  venue: string;
  organizer: string;
  capacity: number;
  registered: number;
  registrations: RegistrationData[];
  status: string;
}

function readJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

async function main() {
  const force = process.argv.includes("--force");

  // Check if already seeded
  const scheduleCount = await db.schedule.count();
  if (scheduleCount > 0 && !force) {
    console.log(
      "✅ Database already seeded. Use --force to reseed (this will delete all data)."
    );
    return;
  }

  if (force) {
    console.log("🗑️  --force flag detected. Clearing all data...");
    // Delete in reverse dependency order
    await db.registration.deleteMany();
    await db.booking.deleteMany();
    await db.event.deleteMany();
    await db.room.deleteMany();
    await db.schedule.deleteMany();
    await db.announcement.deleteMany();
    await db.assignment.deleteMany();
    console.log("✅ All data cleared.");
  }

  console.log("🌱 Seeding database...");

  // 1. Schedules
  const schedules = readJson<object[]>("schedules.json");
  await db.schedule.createMany({ data: schedules as Prisma.ScheduleCreateManyInput[] });
  console.log(`✅ Schedules: ${schedules.length} rows`);

  // 2. Rooms + Bookings
  const rooms = readJson<RoomData[]>("rooms.json");
  for (const room of rooms) {
    const { bookings, ...roomData } = room;
    await db.room.create({
      data: {
        ...roomData,
        equipment: roomData.equipment,
        bookings: {
          create: bookings.map((b) => ({
            booking_id: b.booking_id,
            booked_by: b.booked_by,
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            purpose: b.purpose,
          })),
        },
      },
    });
  }
  const totalBookings = rooms.reduce((sum, r) => sum + r.bookings.length, 0);
  console.log(`✅ Rooms: ${rooms.length} rows, Bookings: ${totalBookings} rows`);

  // 3. Events + Registrations
  const events = readJson<EventData[]>("events.json");
  for (const event of events) {
    const { registrations, ...eventData } = event;
    await db.event.create({
      data: {
        ...eventData,
        registrations: {
          create: registrations.map((r) => ({
            student_id: r.student_id,
            name: r.name,
          })),
        },
      },
    });
  }
  const totalRegistrations = events.reduce((sum, e) => sum + e.registrations.length, 0);
  console.log(`✅ Events: ${events.length} rows, Registrations: ${totalRegistrations} rows`);

  // 4. Announcements
  const announcements = readJson<object[]>("announcements.json");
  await db.announcement.createMany({ data: announcements as Prisma.AnnouncementCreateManyInput[] });
  console.log(`✅ Announcements: ${announcements.length} rows`);

  // 5. Assignments
  const assignments = readJson<object[]>("assignments.json");
  await db.assignment.createMany({ data: assignments as Prisma.AssignmentCreateManyInput[] });
  console.log(`✅ Assignments: ${assignments.length} rows`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
