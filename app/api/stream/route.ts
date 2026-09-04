import { NextRequest, NextResponse } from "next/server";
import { notifyChange, subscribeToChanges, ResourceChangeEvent } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE endpoint at /api/stream
 * Keeps open connection and broadcasts `{ resource: string }` events to all connected clients.
 * Includes keepalive ping every 15s to prevent dropped connections.
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;
  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Broadcast listener
      const onEvent = (event: ResourceChangeEvent) => {
        try {
          const payload = JSON.stringify({
            resource: event.resource,
            action: event.action,
            id: event.id,
            timestamp: event.timestamp,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Stream might be closed
        }
      };

      cleanup = subscribeToChanges(onEvent);

      // Keepalive heartbeat every 15s
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
        }
      }, 15000);
    },
    cancel() {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    },
  });

  request.signal.addEventListener("abort", () => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * POST /api/stream
 * Manual test endpoint to broadcast a change event.
 * Body: { resource: string, action?: string, id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = await request.json().catch(async () => {
      const text = await request.text().catch(() => "");
      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    });

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = { resource: body };
      }
    }

    const resource =
      body && typeof body.resource === "string" && body.resource.trim() !== ""
        ? body.resource
        : "test";
    notifyChange(resource, { action: body?.action, id: body?.id });
    return NextResponse.json({ success: true, broadcasted: resource });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
