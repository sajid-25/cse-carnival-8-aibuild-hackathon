"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import rooms from "@/data/rooms.json";
import { useApiList } from "@/lib/use-api-list";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  Filter,
  Search,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";

type Room = (typeof rooms)[number];

const roomTypes = ["all", "classroom", "lab", "seminar"] as const;

function formatEquipment(equipment: string[]) {
  return equipment.map((item) => item.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" · ");
}

export default function RoomsPage() {
  const { data: roomList, setData: setRoomList, isLoading, error } = useApiList<Room>("/api/rooms");

  async function deleteRoom(room: Room) {
    if (!window.confirm(`Delete room ${room.room_number}?`)) return;
    const response = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    if (response.ok) setRoomList((current) => current.filter((item) => item.id !== room.id));
  }

  async function editRoom(room: Room) {
    const capacity = window.prompt("New room capacity", String(room.capacity));
    if (!capacity || Number(capacity) <= 0) return;
    const response = await fetch(`/api/rooms/${room.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ capacity: Number(capacity) }) });
    if (response.ok) setRoomList((current) => current.map((item) => item.id === room.id ? { ...item, capacity: Number(capacity) } : item));
  }
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<(typeof roomTypes)[number]>("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  const filteredRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return roomList.filter((room) => {
      const matchesQuery =
        !normalizedQuery ||
        [room.room_number, room.type, ...room.equipment].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesType = selectedType === "all" || room.type === selectedType;
      const matchesAvailability = !availableOnly || room.status === "available";

      return matchesQuery && matchesType && matchesAvailability;
    });
  }, [availableOnly, query, roomList, selectedType]);

  const availableCount = roomList.filter((room) => room.status === "available").length;
  const bookedCount = roomList.length - availableCount;
  const labCount = roomList.filter((room) => room.type === "lab").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-700">
                <DoorOpen className="h-4 w-4" />
                Campus resources / Rooms
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Find the right room
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Browse rooms by capacity, type, and equipment. Live bookings will appear here as soon as they are added.
              </p>
            </div>
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800" href="/rooms/calendar">
              <CalendarDays className="h-4 w-4" />
              View booking calendar
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
            <Summary label="Total rooms" value={roomList.length} icon={DoorOpen} />
            <Summary label="Available now" value={availableCount} icon={CheckCircle2} tone="teal" />
            <Summary label="With bookings" value={bookedCount} icon={CalendarDays} tone="amber" />
            <Summary label="Computer labs" value={labCount} icon={Wrench} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search rooms"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search room, type, or equipment"
              value={query}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1">
              {roomTypes.map((type) => (
                <button
                  className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${selectedType === type ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                  key={type}
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600">
              <input
                checked={availableOnly}
                className="h-4 w-4 accent-teal-700"
                onChange={(event) => setAvailableOnly(event.target.checked)}
                type="checkbox"
              />
              <Filter className="h-3.5 w-3.5" />
              Available only
            </label>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredRooms.length}</span> of {roomList.length} rooms
          </p>
          <span className="text-xs text-slate-400">Updated from campus data</span>
        </div>

        {isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading rooms...</div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-700">{error}</div> : filteredRooms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onDelete={deleteRoom} onEdit={editRoom} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <DoorOpen className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">No rooms match those filters</h2>
            <p className="mt-1 text-sm text-slate-500">Try a different room number, type, or equipment.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone = "slate" }: { label: string; value: number; icon: typeof DoorOpen; tone?: "slate" | "teal" | "amber" }) {
  const colors = {
    slate: "text-slate-500",
    teal: "text-teal-700",
    amber: "text-amber-600",
  };

  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className={`h-4 w-4 ${colors[tone]}`} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function RoomCard({ room, onDelete, onEdit }: { room: Room; onDelete: (room: Room) => Promise<void>; onEdit: (room: Room) => Promise<void> }) {
  const nextBooking = room.bookings[0];
  const isAvailable = room.status === "available";

  return (
    <article className="group rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">{room.room_number}</h2>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isAvailable ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
          <p className="mt-1 text-sm capitalize text-slate-500">{room.type} · Floor {room.floor}</p>
        </div>
        <div className="flex items-center gap-1"><button aria-label={`Edit ${room.room_number}`} className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" onClick={() => void onEdit(room)} type="button"><Wrench className="h-4 w-4" /></button><button aria-label={`Delete ${room.room_number}`} className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-700" onClick={() => void onDelete(room)} type="button"><Trash2 className="h-4 w-4" /></button><div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition group-hover:bg-teal-50 group-hover:text-teal-700">
          <DoorOpen className="h-5 w-5" />
        </div></div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-y border-slate-100 py-3 text-sm text-slate-600">
        <Users className="h-4 w-4 text-slate-400" />
        <span>Capacity</span>
        <strong className="ml-auto text-slate-950">{room.capacity} people</strong>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Equipment</p>
        <p className="mt-1.5 min-h-5 text-sm text-slate-600">{formatEquipment(room.equipment)}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        {nextBooking ? (
          <div className="min-w-0 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Next booking</p>
            <p className="mt-1 truncate">{nextBooking.date} · {nextBooking.start_time}-{nextBooking.end_time}</p>
          </div>
        ) : (
          <div className="text-xs text-slate-400">No upcoming bookings</div>
        )}
        <button className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal-700 transition hover:text-teal-900">
          {isAvailable ? "Book room" : "View details"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}