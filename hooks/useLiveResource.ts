"use client";

import { useEffect, useRef } from "react";
import { useSWRConfig } from "swr";

export interface LiveResourceEvent {
  resource: string;
  action?: string;
  id?: string;
  timestamp?: number;
}

// Client-side singleton EventSource to avoid multiple redundant open connections
let globalEventSource: EventSource | null = null;
let activeListenersCount = 0;
const eventListeners = new Set<(event: LiveResourceEvent) => void>();

function initEventSource(): EventSource | null {
  if (typeof window === "undefined") return null;

  if (!globalEventSource || globalEventSource.readyState === EventSource.CLOSED) {
    globalEventSource = new EventSource("/api/stream");

    globalEventSource.onmessage = (event) => {
      try {
        const parsed: LiveResourceEvent = JSON.parse(event.data);
        eventListeners.forEach((listener) => {
          try {
            listener(parsed);
          } catch (e) {
            console.error("[useLiveResource] Error in listener handler:", e);
          }
        });
      } catch {
        // Ignored or heartbeat comment
      }
    };

    globalEventSource.onerror = () => {
      // EventSource in browser automatically handles exponential backoff reconnection
      console.warn("[useLiveResource] SSE connection lost. Browser will auto-reconnect.");
    };
  }

  return globalEventSource;
}

/**
 * Client hook that connects to /api/stream and triggers SWR revalidation
 * whenever a matching resource is mutated on the server.
 *
 * @param resource Resource name or array of resource names (e.g. 'schedule', 'rooms', 'events')
 * @param customFilter Optional custom key matcher or key string for mutate()
 */
export function useLiveResource(
  resource: string | string[],
  customFilter?: string | ((key: any) => boolean)
) {
  const { mutate } = useSWRConfig();
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  const targetResources = Array.isArray(resource) ? resource : [resource];
  const resourcesRef = useRef(targetResources);
  resourcesRef.current = targetResources;

  useEffect(() => {
    activeListenersCount++;
    initEventSource();

    const handleEvent = (eventData: LiveResourceEvent) => {
      const currentTargets = resourcesRef.current;
      const eventResource = (eventData.resource || "").toLowerCase();

      const isMatch =
        currentTargets.includes("*") ||
        currentTargets.includes("all") ||
        currentTargets.some((r) => {
          const target = r.toLowerCase();
          return (
            target === eventResource ||
            eventResource.startsWith(target) ||
            target.startsWith(eventResource)
          );
        });

      if (isMatch) {
        if (typeof customFilter === "function") {
          mutateRef.current(customFilter);
        } else if (typeof customFilter === "string") {
          mutateRef.current(customFilter);
        } else {
          // Default: mutate any SWR key matching /api/<resource>
          mutateRef.current(
            (key: unknown) => {
              if (typeof key === "string") {
                return currentTargets.some((r) => {
                  const target = r.toLowerCase();
                  return key.toLowerCase().includes(`/api/${target}`);
                });
              }
              return false;
            },
            undefined,
            { revalidate: true }
          );
        }
      }
    };

    eventListeners.add(handleEvent);

    return () => {
      eventListeners.delete(handleEvent);
      activeListenersCount--;
      if (activeListenersCount <= 0 && globalEventSource) {
        globalEventSource.close();
        globalEventSource = null;
      }
    };
  }, [customFilter]);
}
