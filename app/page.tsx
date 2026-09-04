import Link from "next/link";
import { CalendarDays, ChevronRight, Clock3, DoorOpen, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import db from "@/lib/db";

const today = "2026-09-04";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export default async function HomePage() {
  const [announcements, assignments, events, rooms, schedules] = await Promise.all([
    db.announcement.findMany(),
    db.assignment.findMany(),
    db.event.findMany(),
    db.room.findMany(),
    db.schedule.findMany(),
  ]);
  const urgentAnnouncements = announcements.filter((announcement) => announcement.priority === "high" && announcement.expires >= today).slice(0, 3);
  const upcomingAssignments = assignments.filter((assignment) => assignment.status === "pending").sort((first, second) => first.deadline.localeCompare(second.deadline)).slice(0, 3);
  const upcomingEvents = events.filter((event) => event.status === "upcoming").sort((first, second) => first.date.localeCompare(second.date)).slice(0, 3);
  const nextClasses = schedules.filter((schedule) => schedule.day === "Sunday").sort((first, second) => first.start_time.localeCompare(second.start_time)).slice(0, 3);
  const availableRooms = rooms.filter((room) => room.status === "available").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700"><TrendingUp className="h-4 w-4" />Friday, September 4, 2026</div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Good morning, Sakibul</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Here is what needs your attention across campus today.</p>
            </div>
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800" href="/chat"><Sparkles className="h-4 w-4" />Ask CampusOS</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
            <Metric label="Classes this week" value={schedules.length} href="/schedule" icon={CalendarDays} />
            <Metric label="Open rooms" value={availableRooms} href="/rooms" icon={DoorOpen} tone="teal" />
            <Metric label="Upcoming events" value={upcomingEvents.length} href="/events" icon={Sparkles} tone="amber" />
            <Metric label="Pending assignments" value={assignments.filter((assignment) => assignment.status === "pending").length} href="/assignments" icon={Clock3} tone="red" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading icon={Clock3} title="Coming up" href="/schedule" action="View schedule" />
            <div className="mt-5 space-y-3">
              {nextClasses.map((schedule) => <div className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0" key={schedule.id}><div className="w-14 shrink-0 text-sm font-semibold text-slate-950">{schedule.start_time}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{schedule.course} <span className="font-normal text-slate-500">{schedule.title}</span></p><p className="mt-1 text-xs text-slate-400">Room {schedule.room} · {schedule.instructor}</p></div><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{schedule.section}</span></div>)}
            </div>
          </section>

          <section className="rounded-lg border border-red-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading icon={Megaphone} title="Needs your attention" href="/announcements" action="All notices" tone="red" />
            <div className="mt-5 space-y-4">{urgentAnnouncements.map((announcement) => <Link className="block border-l-2 border-red-500 pl-3 transition hover:border-teal-600" href="/announcements" key={announcement.id}><p className="text-sm font-semibold leading-5 text-slate-900">{announcement.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{announcement.body}</p></Link>)}</div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading icon={Clock3} title="Deadlines ahead" href="/assignments" action="All assignments" />
            <div className="mt-5 space-y-3">{upcomingAssignments.map((assignment) => <Link className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0" href="/assignments" key={assignment.id}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-xs font-bold text-amber-700">{formatDate(assignment.deadline).split(" ")[1]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{assignment.title}</p><p className="mt-1 text-xs text-slate-500">{assignment.course} · {assignment.marks} marks</p></div><span className="text-xs font-semibold text-slate-500">{formatDate(assignment.deadline)}</span></Link>)}</div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading icon={Sparkles} title="On campus soon" href="/events" action="All events" tone="amber" />
            <div className="mt-5 space-y-3">{upcomingEvents.map((event) => <Link className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0" href="/events" key={event.id}><div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-teal-50 text-[10px] font-bold uppercase text-teal-700"><span>{formatDate(event.date).split(" ")[0]}</span><span className="text-sm leading-4">{event.date.slice(-2)}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{event.name}</p><p className="mt-1 text-xs text-slate-500">{event.start_time} · {event.venue} · {event.registered}/{event.capacity} registered</p></div></Link>)}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, href, icon: Icon, tone = "slate" }: { label: string; value: number; href: string; icon: typeof CalendarDays; tone?: "slate" | "teal" | "amber" | "red" }) {
  const colors = { slate: "text-slate-500", teal: "text-teal-700", amber: "text-amber-600", red: "text-red-700" };
  return <Link className="bg-white px-4 py-4 transition hover:bg-slate-50 sm:px-5" href={href}><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className={`h-4 w-4 ${colors[tone]}`} />{label}</div><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></Link>;
}

function SectionHeading({ icon: Icon, title, href, action, tone = "teal" }: { icon: typeof CalendarDays; title: string; href: string; action: string; tone?: "teal" | "red" | "amber" }) {
  const colors = { teal: "text-teal-700", red: "text-red-700", amber: "text-amber-600" };
  return <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-semibold text-slate-950"><Icon className={`h-4 w-4 ${colors[tone]}`} />{title}</h2><Link className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900" href={href}>{action}<ChevronRight className="h-3.5 w-3.5" /></Link></div>;
}
