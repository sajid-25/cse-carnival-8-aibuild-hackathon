"use client";

import { FormEvent, useMemo, useState } from "react";
import announcements from "@/data/announcements.json";
import { useApiList } from "@/lib/use-api-list";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Announcement = (typeof announcements)[number];
type PriorityFilter = "all" | "high" | "medium" | "low";

const priorityFilters: PriorityFilter[] = ["all", "high", "medium", "low"];
const today = "2026-09-04";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

export default function AnnouncementsPage() {
  const { data: announcementList, setData: setAnnouncementList, isLoading, error } = useApiList<Announcement>("/api/announcements");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [showExpired, setShowExpired] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", body: "", priority: "medium" as PriorityFilter, posted_by: "", expires: "" });

  const visibleAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return announcementList
      .filter((announcement) => {
        const matchesQuery =
          !normalizedQuery ||
          [announcement.title, announcement.body, announcement.posted_by].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        const matchesPriority = priority === "all" || announcement.priority === priority;
        const isExpired = announcement.expires < today;
        return matchesQuery && matchesPriority && (showExpired || !isExpired);
      })
      .sort((first, second) => second.date.localeCompare(first.date));
  }, [announcementList, priority, query, showExpired]);

  const activeCount = announcementList.filter((announcement) => announcement.expires >= today).length;
  const highPriorityCount = announcementList.filter((announcement) => announcement.priority === "high").length;
  const expiringSoonCount = announcementList.filter(
    (announcement) => announcement.expires >= today && announcement.expires <= "2026-09-10",
  ).length;

  async function postAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.body || !newAnnouncement.posted_by || !newAnnouncement.expires) return;
    const response = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newAnnouncement, date: today }) });
    if (!response.ok) return;
    const createdAnnouncement = await response.json();
    setAnnouncementList((current) => [createdAnnouncement, ...current]);
    setNewAnnouncement({ title: "", body: "", priority: "medium", posted_by: "", expires: "" });
    setIsPostOpen(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700">
                <Megaphone className="h-4 w-4" />
                Campus communications / Announcements
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Keep up with campus</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Important notices, course updates, and deadlines in one place. High-priority updates stay easy to spot.
              </p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800" onClick={() => setIsPostOpen(true)} type="button">
              <Plus className="h-4 w-4" />
              Post announcement
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
            <Summary label="Total notices" value={announcements.length} />
            <Summary label="Active now" value={activeCount} tone="teal" />
            <Summary label="High priority" value={highPriorityCount} tone="red" />
            <Summary label="Expiring soon" value={expiringSoonCount} tone="amber" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search announcements"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notices, authors, or topics"
              value={query}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1">
              {priorityFilters.map((filter) => (
                <button
                  className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${priority === filter ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                  key={filter}
                  onClick={() => setPriority(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600">
              <input checked={showExpired} className="h-4 w-4 accent-teal-700" onChange={(event) => setShowExpired(event.target.checked)} type="checkbox" />
              Show expired
            </label>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{visibleAnnouncements.length}</span> of {announcementList.length} notices
          </p>
          <span className="hidden text-xs text-slate-400 sm:inline">Updated from campus data</span>
        </div>

        {isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading announcements...</div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-700">{error}</div> : visibleAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {visibleAnnouncements.map((announcement) => (
              <AnnouncementCard announcement={announcement} key={announcement.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">No announcements match those filters</h2>
            <p className="mt-1 text-sm text-slate-500">Try another search or include expired notices.</p>
          </div>
        )}
      </main>

      {isPostOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
          <div aria-labelledby="post-announcement-title" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" role="dialog">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950" id="post-announcement-title">Post announcement</h2><p className="mt-1 text-sm text-slate-500">Share a notice with the campus.</p></div><button aria-label="Close post announcement dialog" className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" onClick={() => setIsPostOpen(false)} type="button"><X className="h-4 w-4" /></button></div>
            <form className="mt-6 grid gap-4" onSubmit={postAnnouncement}>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Title<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600" onChange={(event) => setNewAnnouncement({ ...newAnnouncement, title: event.target.value })} value={newAnnouncement.title} /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Body<textarea required className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-teal-600" onChange={(event) => setNewAnnouncement({ ...newAnnouncement, body: event.target.value })} value={newAnnouncement.body} /></label>
              <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Priority<select className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal capitalize text-slate-900 outline-none focus:border-teal-600" onChange={(event) => setNewAnnouncement({ ...newAnnouncement, priority: event.target.value as PriorityFilter })} value={newAnnouncement.priority}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Posted by<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600" onChange={(event) => setNewAnnouncement({ ...newAnnouncement, posted_by: event.target.value })} value={newAnnouncement.posted_by} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Expires<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600" onChange={(event) => setNewAnnouncement({ ...newAnnouncement, expires: event.target.value })} type="date" value={newAnnouncement.expires} /></label></div>
              <div className="mt-2 flex justify-end gap-2"><button className="rounded-md px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setIsPostOpen(false)} type="button">Cancel</button><button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" type="submit">Post announcement</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "teal" | "red" | "amber" }) {
  const colors = { slate: "text-slate-950", teal: "text-teal-700", red: "text-red-700", amber: "text-amber-600" };
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const isExpired = announcement.expires < today;
  const priorityStyles = {
    high: { border: "border-l-red-500", badge: "bg-red-50 text-red-700", label: "High priority" },
    medium: { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-700", label: "Medium priority" },
    low: { border: "border-l-slate-400", badge: "bg-slate-100 text-slate-600", label: "Low priority" },
  };
  const styles = priorityStyles[announcement.priority as keyof typeof priorityStyles];

  return (
    <article className={`rounded-lg border border-slate-200 border-l-4 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md ${styles.border} ${isExpired ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
              {announcement.priority === "high" && <AlertCircle className="h-3 w-3" />}
              {styles.label}
            </span>
            {isExpired && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Expired</span>}
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{announcement.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{announcement.body}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
          <button aria-label={`Edit ${announcement.title}`} className="rounded p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
          <button aria-label={`Delete ${announcement.title}`} className="rounded p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
          <button aria-label={`View ${announcement.title}`} className="rounded p-2 text-slate-400 transition hover:bg-teal-50 hover:text-teal-700"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Posted {formatDate(announcement.date)} by <strong className="font-semibold text-slate-700">{announcement.posted_by}</strong></span>
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />Expires {formatDate(announcement.expires)}</span>
      </div>
    </article>
  );
}