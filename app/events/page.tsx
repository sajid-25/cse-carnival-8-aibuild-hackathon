"use client";

import { useMemo, useState } from "react";
import events from "@/data/events.json";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type Event = (typeof events)[number];
type EventFilter = "all" | "upcoming" | "full" | "completed" | "cancelled";

const filters: EventFilter[] = ["all", "upcoming", "full", "completed", "cancelled"];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

export default function EventsPage() {
  const [eventList, setEventList] = useState<Event[]>(events);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<EventFilter>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", date: "", start_time: "", end_time: "", venue: "", capacity: "" });

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return eventList
      .filter((event) => {
        const matchesQuery =
          !normalizedQuery ||
          [event.name, event.description, event.organizer, event.venue].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        const matchesFilter = activeFilter === "all" || event.status === activeFilter;
        return matchesQuery && matchesFilter;
      })
      .sort((first, second) => first.date.localeCompare(second.date));
  }, [activeFilter, eventList, query]);

  const openSpots = eventList.reduce((total, event) => total + Math.max(event.capacity - event.registered, 0), 0);
  const registeredTotal = eventList.reduce((total, event) => total + event.registered, 0);
  const upcomingCount = eventList.filter((event) => event.status === "upcoming").length;

  function addEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEvent.name || !newEvent.date || !newEvent.start_time || !newEvent.end_time || !newEvent.venue || !newEvent.capacity) return;

    setEventList((current) => [
      ...current,
      {
        id: `evt-${Date.now()}`,
        name: newEvent.name,
        description: "New campus event",
        date: newEvent.date,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        end_date: newEvent.date,
        venue: newEvent.venue,
        organizer: "CampusOS user",
        capacity: Number(newEvent.capacity),
        registered: 0,
        registrations: [],
        status: "upcoming",
      } as Event,
    ]);
    setNewEvent({ name: "", date: "", start_time: "", end_time: "", venue: "", capacity: "" });
    setIsAddOpen(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700">
                <Sparkles className="h-4 w-4" />
                Campus calendar / Events
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">What is happening on campus?</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Find talks, workshops, contests, and student activities. Reserve a place before the room fills up.
              </p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800" onClick={() => setIsAddOpen(true)} type="button">
              <CalendarDays className="h-4 w-4" />
              Add an event
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
            <Summary label="Total events" value={events.length} />
            <Summary label="Coming up" value={upcomingCount} tone="teal" />
            <Summary label="Open places" value={openSpots} tone="amber" />
            <Summary label="Registrations" value={registeredTotal} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search events"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events, organizers, or venues"
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
            Showing <span className="font-semibold text-slate-900">{filteredEvents.length}</span> of {eventList.length} events
          </p>
          <span className="hidden text-xs text-slate-400 sm:inline">Updated from campus data</span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">No events match those filters</h2>
            <p className="mt-1 text-sm text-slate-500">Try another search or choose a different status.</p>
          </div>
        )}
      </main>

      {isAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <div aria-labelledby="add-event-title" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold text-slate-950" id="add-event-title">Add an event</h2><p className="mt-1 text-sm text-slate-500">Create a campus event and add it to the calendar.</p></div>
              <button aria-label="Close add event dialog" className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" onClick={() => setIsAddOpen(false)} type="button"><X className="h-4 w-4" /></button>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={addEvent}>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Event name<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" onChange={(event) => setNewEvent({ ...newEvent, name: event.target.value })} value={newEvent.name} /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Date<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" onChange={(event) => setNewEvent({ ...newEvent, date: event.target.value })} type="date" value={newEvent.date} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Venue<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" onChange={(event) => setNewEvent({ ...newEvent, venue: event.target.value })} placeholder="7C01" value={newEvent.venue} /></label></div>
              <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Start<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" onChange={(event) => setNewEvent({ ...newEvent, start_time: event.target.value })} type="time" value={newEvent.start_time} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">End<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" onChange={(event) => setNewEvent({ ...newEvent, end_time: event.target.value })} type="time" value={newEvent.end_time} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Capacity<input required min="1" className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" onChange={(event) => setNewEvent({ ...newEvent, capacity: event.target.value })} type="number" value={newEvent.capacity} /></label></div>
              <div className="mt-2 flex justify-end gap-2"><button className="rounded-md px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setIsAddOpen(false)} type="button">Cancel</button><button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" type="submit">Create event</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "teal" | "amber" }) {
  const colors = { slate: "text-slate-500", teal: "text-teal-700", amber: "text-amber-600" };
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const spotsLeft = Math.max(event.capacity - event.registered, 0);
  const isFull = event.status === "full" || spotsLeft === 0;
  const registrationPercentage = Math.min((event.registered / event.capacity) * 100, 100);

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(`${event.date}T00:00:00`))}</span>
              <span className="text-lg font-bold leading-5">{event.date.slice(-2)}</span>
            </div>
            <div>
              <h2 className="line-clamp-2 text-base font-semibold leading-5 text-slate-950">{event.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{event.organizer}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isFull ? "bg-amber-50 text-amber-700" : event.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"}`}>
            {isFull ? "Full" : event.status}
          </span>
        </div>
        <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{event.description}</p>
      </div>

      <div className="p-5">
        <div className="grid gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-slate-400" />{formatDate(event.date)} · {event.start_time}-{event.end_time}</div>
          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" />{event.venue} · {event.organizer}</div>
          <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-slate-400" />{event.registered} of {event.capacity} registered</div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${registrationPercentage}%` }} /></div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">{isFull ? "Registration closed" : `${spotsLeft} places left`}</span>
          <button className={`inline-flex items-center gap-1 text-xs font-bold ${isFull ? "text-slate-400" : "text-teal-700 hover:text-teal-900"}`} disabled={isFull || event.status === "cancelled"}>
            {isFull ? "View details" : <><Check className="h-3.5 w-3.5" /> Register</>}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}