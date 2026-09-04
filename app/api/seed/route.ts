import { NextResponse } from "next/server";
import db from "@/lib/db";

// This route auto-seeds the database on the first request if it's empty.
// Called from the root layout via a fire-and-forget fetch on server startup.
export async function GET() {
  try {
    const count = await db.schedule.count();
    if (count > 0) {
      return NextResponse.json({ seeded: false, message: "Already seeded" });
    }

    // Dynamic import to avoid bundling seed data in production chunks
    const { execSync } = await import("child_process");
    execSync("npx tsx prisma/seed.ts", {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    return NextResponse.json({ seeded: true, message: "Database seeded successfully" });
  } catch (error) {
    console.error("Auto-seed error:", error);
    return NextResponse.json(
      { seeded: false, error: "Seed failed" },
      { status: 500 }
    );
  }
}
