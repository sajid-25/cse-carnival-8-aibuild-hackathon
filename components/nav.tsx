"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  DoorOpen, 
  CalendarCheck, 
  Megaphone, 
  BookOpenCheck, 
  Bot,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Events", href: "/events", icon: CalendarCheck },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Assignments", href: "/assignments", icon: BookOpenCheck },
  { label: "Chat", href: "/chat", icon: Bot },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-colors hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-none">CampusOS</span>
              <span className="text-[11px] text-muted-foreground font-normal">Intelligent Campus Platform</span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
