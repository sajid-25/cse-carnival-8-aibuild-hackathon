"use client";

import { useMemo, useState } from "react";
import assignments from "@/data/assignments.json";
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type Assignment = (typeof assignments)[number];
type AssignmentFilter = "all" | "pending" | "submitted" | "graded" | "late";

const filters: AssignmentFilter[] = ["all", "pending", "submitted", "graded", "late"];
const today = "2026-09-04";
const dueSoonLimit = "2026-09-10";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

export default function AssignmentsPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<AssignmentFilter>("all");

  const visibleAssignments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return assignments
      .filter((assignment) => {
        const matchesQuery =
          !normalizedQuery ||
          [assignment.course, assignment.course_title, assignment.title, assignment.description].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        const matchesFilter = activeFilter === "all" || assignment.status === activeFilter;
        return matchesQuery && matchesFilter;
      })
      .sort((first, second) => first.deadline.localeCompare(second.deadline));
  }, [activeFilter, query]);

  const pendingCount = assignments.filter((assignment) => assignment.status === "pending").length;
  const submittedCount = assignments.filter((assignment) => assignment.status === "submitted").length;
  const dueSoonCount = assignments.filter(
    (assignment) => assignment.status === "pending" && assignment.deadline >= today && assignment.deadline <= dueSoonLimit,
  ).length;
  const totalMarks = assignments.reduce((total, assignment) => total + assignment.marks, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700">
                <BookOpenCheck className="h-4 w-4" />
                Academic work / Assignments
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Stay ahead of your deadlines</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                See what is due next, where to submit it, and which work is already complete.
              </p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800">
              <Plus className="h-4 w-4" />
              Add assignment
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
            <Summary label="Total assignments" value={assignments.length} />
            <Summary label="Pending" value={pendingCount} tone="amber" />
            <Summary label="Submitted" value={submittedCount} tone="teal" />
            <Summary label="Marks available" value={totalMarks} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search assignments"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses or assignments"
              value={query}
            />
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-md border border-slate-300 bg-white p-1">
            {filters.map((filter) => (
              <button
                className={`shrink-0 rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${activeFilter === filter ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{visibleAssignments.length}</span> of {assignments.length} assignments
          </p>
          <span className="hidden text-xs text-slate-400 sm:inline">{dueSoonCount} pending due by {formatDate(dueSoonLimit)}</span>
        </div>

        {visibleAssignments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleAssignments.map((assignment) => (
              <AssignmentCard assignment={assignment} key={assignment.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpenCheck className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">No assignments match those filters</h2>
            <p className="mt-1 text-sm text-slate-500">Try another course, title, or status.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Summary({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "teal" | "amber" }) {
  const colors = { slate: "text-slate-950", teal: "text-teal-700", amber: "text-amber-600" };
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const isSubmitted = assignment.status === "submitted" || assignment.status === "graded";
  const isOverdue = assignment.status === "pending" && assignment.deadline < today;
  const isDueSoon = assignment.status === "pending" && assignment.deadline >= today && assignment.deadline <= dueSoonLimit;
  const statusLabel = isOverdue ? "Overdue" : assignment.status;
  const statusStyle = isOverdue ? "bg-red-50 text-red-700" : isSubmitted ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700";

  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md ${isOverdue ? "border-l-4 border-l-red-500" : isDueSoon ? "border-l-4 border-l-amber-500" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{assignment.course}</span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}>{statusLabel}</span>
          </div>
          <h2 className="mt-3 text-base font-semibold leading-5 text-slate-950">{assignment.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{assignment.course_title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button aria-label={`Edit ${assignment.title}`} className="rounded p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
          <button aria-label={`Delete ${assignment.title}`} className="rounded p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-5 text-slate-600">{assignment.description}</p>
      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-2">
        <div className={`flex items-center gap-2 ${isOverdue ? "font-semibold text-red-700" : isDueSoon ? "font-semibold text-amber-700" : ""}`}>
          {isDueSoon || isOverdue ? <CalendarClock className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5 text-slate-400" />}
          Due {formatDate(assignment.deadline)}
        </div>
        <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />{assignment.marks} marks · {assignment.submission_platform}</div>
      </div>
      <button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700 transition hover:text-teal-900">View assignment <ChevronRight className="h-3.5 w-3.5" /></button>
    </article>
  );
}