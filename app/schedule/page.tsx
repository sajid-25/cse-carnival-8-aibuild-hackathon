"use client";

import { FormEvent, useMemo, useState } from "react";
import schedules from "@/data/schedules.json";
import { useApiList } from "@/lib/use-api-list";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type Schedule = (typeof schedules)[number];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;

function dayAbbreviation(day: string) {
  return day.slice(0, 3);
}

export default function SchedulePage() {
  const { data: scheduleList, setData: setScheduleList, isLoading, error } = useApiList<Schedule>("/api/schedules");
  const [selectedDay, setSelectedDay] = useState<(typeof days)[number]>("Sunday");
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClass, setNewClass] = useState({ course: "", title: "", day: "Sunday" as (typeof days)[number], start_time: "", end_time: "", room: "", instructor: "", section: "" });

  const visibleClasses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scheduleList
      .filter((schedule) => {
        const matchesDay = schedule.day === selectedDay;
        const matchesQuery =
          !normalizedQuery ||
          [schedule.course, schedule.title, schedule.room, schedule.instructor, schedule.section].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        return matchesDay && matchesQuery;
      })
      .sort((first, second) => first.start_time.localeCompare(second.start_time));
  }, [query, scheduleList, selectedDay]);

  const busiestDay = days.reduce<{ day: (typeof days)[number]; count: number }>((busiest, day) => {
    const count = scheduleList.filter((schedule) => schedule.day === day).length;
    return count > busiest.count ? { day, count } : busiest;
  }, { day: days[0], count: 0 });

  async function addClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newClass.course || !newClass.title || !newClass.start_time || !newClass.end_time || !newClass.room || !newClass.instructor || !newClass.section) return;
    const response = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClass) });
    if (!response.ok) return;
    const createdSchedule = await response.json();
    setScheduleList((current) => [...current, createdSchedule]);
    setSelectedDay(newClass.day);
    setNewClass({ course: "", title: "", day: "Sunday", start_time: "", end_time: "", room: "", instructor: "", section: "" });
    setIsAddOpen(false);
  }

  async function editClass(schedule: Schedule) {
    const title = window.prompt("New course title", schedule.title);
    if (!title || title === schedule.title) return;
    const response = await fetch(`/api/schedules/${schedule.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    if (response.ok) setScheduleList((current) => current.map((item) => item.id === schedule.id ? { ...item, title } : item));
  }

  async function deleteClass(schedule: Schedule) {
    if (!window.confirm(`Delete ${schedule.course} from the schedule?`)) return;
    const response = await fetch(`/api/schedules/${schedule.id}`, { method: "DELETE" });
    if (response.ok) setScheduleList((current) => current.filter((item) => item.id !== schedule.id));
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700">
                <CalendarDays className="h-4 w-4" />
                Academic calendar / Schedule
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Your week, at a glance</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Keep every class, lab, room, and instructor in view across the university week.
              </p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800" onClick={() => setIsAddOpen(true)} type="button">
              <Plus className="h-4 w-4" />
              Add class
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
            <Summary label="Weekly classes" value={scheduleList.length} />
            <Summary label="Course sections" value={new Set(scheduleList.map((schedule) => schedule.course)).size} tone="teal" />
            <Summary label="Busiest day" value={busiestDay.count} detail={busiestDay.day} tone="amber" />
            <Summary label="Teaching rooms" value={new Set(scheduleList.map((schedule) => schedule.room)).size} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search schedule"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search course, room, or instructor"
              value={query}
            />
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-md border border-slate-300 bg-white p-1">
            {days.map((day) => (
              <button className={`shrink-0 rounded px-4 py-2 text-xs font-semibold transition sm:px-5 ${selectedDay === day ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`} key={day} onClick={() => setSelectedDay(day)}>
                <span className="sm:hidden">{dayAbbreviation(day)}</span>
                <span className="hidden sm:inline">{day}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{selectedDay}</h2>
            <p className="mt-1 text-sm text-slate-500">{visibleClasses.length} {visibleClasses.length === 1 ? "class" : "classes"} scheduled</p>
          </div>
          <span className="hidden text-xs text-slate-400 sm:inline">Sunday to Thursday</span>
        </div>

        {isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading schedule...</div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-700">{error}</div> : visibleClasses.length > 0 ? (
          <div className="space-y-3">
            {visibleClasses.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} onEdit={editClass} onDelete={deleteClass} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">No classes match this view</h2>
            <p className="mt-1 text-sm text-slate-500">Try another day or search term.</p>
          </div>
        )}
      </main>

      {isAddOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4"><div aria-labelledby="add-class-title" aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-slate-950" id="add-class-title">Add class</h2><p className="mt-1 text-sm text-slate-500">Add a lecture or lab to the timetable.</p></div><button aria-label="Close add class dialog" className="rounded p-2 text-slate-400 hover:bg-slate-100" onClick={() => setIsAddOpen(false)} type="button"><X className="h-4 w-4" /></button></div><form className="mt-6 grid gap-4" onSubmit={addClass}><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Course code<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, course: event.target.value })} placeholder="CSE 4113" value={newClass.course} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Course title<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, title: event.target.value })} value={newClass.title} /></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Day<select className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, day: event.target.value as (typeof days)[number] })} value={newClass.day}>{days.map((day) => <option key={day}>{day}</option>)}</select></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Start<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, start_time: event.target.value })} type="time" value={newClass.start_time} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">End<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, end_time: event.target.value })} type="time" value={newClass.end_time} /></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Room<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, room: event.target.value })} placeholder="7A03" value={newClass.room} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Instructor<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, instructor: event.target.value })} value={newClass.instructor} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Section<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900" onChange={(event) => setNewClass({ ...newClass, section: event.target.value })} placeholder="B" value={newClass.section} /></label></div><div className="flex justify-end gap-2"><button className="rounded-md px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setIsAddOpen(false)} type="button">Cancel</button><button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" type="submit">Add class</button></div></form></div></div>}
    </div>
  );
}

function Summary({ label, value, detail, tone = "slate" }: { label: string; value: number; detail?: string; tone?: "slate" | "teal" | "amber" }) {
  const colors = { slate: "text-slate-950", teal: "text-teal-700", amber: "text-amber-600" };
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${colors[tone]}`}>{value}</p>
      {detail && <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>}
    </div>
  );
}

function ScheduleCard({ schedule, onEdit, onDelete }: { schedule: Schedule; onEdit: (schedule: Schedule) => Promise<void>; onDelete: (schedule: Schedule) => Promise<void> }) {
  const isLab = schedule.title.toLowerCase().includes("lab");
  return (
    <article className="group flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex shrink-0 items-center gap-3 sm:w-44">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Clock3 className="h-5 w-5" /></div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{schedule.start_time}</p>
          <p className="text-xs text-slate-400">to {schedule.end_time}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold tracking-wider text-white">{schedule.course}</span>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isLab ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"}`}>{isLab ? "Lab" : "Lecture"}</span>
        </div>
        <h3 className="mt-2 truncate text-base font-semibold text-slate-950">{schedule.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{schedule.room}</span>
          <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5 text-slate-400" />{schedule.instructor}</span>
          <span>Section {schedule.section}</span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1">
        <button aria-label={`Edit ${schedule.course}`} className="rounded p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" onClick={() => void onEdit(schedule)} type="button"><Pencil className="h-4 w-4" /></button>
        <button aria-label={`Delete ${schedule.course}`} className="rounded p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700" onClick={() => void onDelete(schedule)} type="button"><Trash2 className="h-4 w-4" /></button>
        <button aria-label={`View ${schedule.course}`} className="rounded p-2 text-slate-400 transition hover:bg-teal-50 hover:text-teal-700"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </article>
  );
}