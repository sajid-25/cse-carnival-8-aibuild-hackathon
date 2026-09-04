import { EventEmitter } from "events";

export type BroadcastResource =
  | "schedule"
  | "schedules"
  | "rooms"
  | "room"
  | "bookings"
  | "events"
  | "event"
  | "registrations"
  | "announcements"
  | "assignments"
  | "all"
  | string;

export interface ResourceChangeEvent {
  resource: string;
  action?: "create" | "update" | "delete" | "refresh";
  id?: string;
  timestamp: number;
}

// In Next.js dev server runtime, persist broadcaster across HMR / module reloads via globalThis
declare global {
  // eslint-disable-next-line no-var
  var __campusos_broadcaster__: EventEmitter | undefined;
}

const broadcaster: EventEmitter =
  globalThis.__campusos_broadcaster__ ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.__campusos_broadcaster__ = broadcaster;
}

// Support many concurrent browser tabs/SSE clients
broadcaster.setMaxListeners(200);

/**
 * Server-side notification helper called after any successful DB mutation.
 * Broadcasts `{ resource: string }` to all connected SSE clients.
 */
export function notifyChange(
  resource: BroadcastResource,
  extra?: { action?: "create" | "update" | "delete" | "refresh"; id?: string }
): void {
  const payload: ResourceChangeEvent = {
    resource,
    action: extra?.action ?? "update",
    id: extra?.id,
    timestamp: Date.now(),
  };

  broadcaster.emit("change", payload);
}

/**
 * Subscribe a callback to resource change events. Returns an unsubscribe function.
 */
export function subscribeToChanges(
  callback: (event: ResourceChangeEvent) => void
): () => void {
  broadcaster.on("change", callback);
  return () => {
    broadcaster.off("change", callback);
  };
}

export default broadcaster;
