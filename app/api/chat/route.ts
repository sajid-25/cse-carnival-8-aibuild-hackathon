import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import * as tools from "@/lib/agent/tools";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function getModel() {
  if (process.env.OPENAI_API_KEY) {
    return openai(process.env.OPENAI_MODEL || "gpt-4o");
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022");
  }
  if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY
  ) {
    return google(process.env.GOOGLE_MODEL || "gemini-2.0-flash");
  }
  // Default fallback
  return openai("gpt-4o");
}

export async function POST(req: Request) {
  try {
    const { messages, student } = await req.json();

    const model = getModel();

    const result = streamText({
      model,
      system: buildSystemPrompt(student),
      messages,
      tools: {
        get_current_datetime: tools.get_current_datetime,
        get_schedule: tools.get_schedule,
        get_rooms: tools.get_rooms,
        get_events: tools.get_events,
        get_announcements: tools.get_announcements,
        get_assignments: tools.get_assignments,
        book_room: tools.book_room,
        cancel_booking: tools.cancel_booking,
        register_event: tools.register_event,
        cancel_registration: tools.cancel_registration,
      },
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
