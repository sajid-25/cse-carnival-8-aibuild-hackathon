import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/nav";
import db from "@/lib/db";
import { execSync } from "child_process";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusOS — Intelligent Campus Management",
  description: "Next-generation campus operations and AI-powered assistant platform",
};

// Auto-seed: runs on every cold start but is a no-op if already seeded
async function autoSeed() {
  try {
    const count = await db.schedule.count();
    if (count === 0) {
      console.log("📦 Database empty — running auto-seed...");
      execSync("npx tsx prisma/seed.ts", { cwd: process.cwd(), stdio: "inherit" });
      console.log("✅ Auto-seed complete.");
    }
  } catch {
    // Non-fatal: app still works, manual seed may be needed
    console.warn("⚠️  Auto-seed skipped (DB may not be ready yet).");
  }
}

// Fire auto-seed once per process (module-level side-effect)
autoSeed();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          <TopNav />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
