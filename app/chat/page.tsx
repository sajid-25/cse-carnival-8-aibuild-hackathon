"use client";

import { FormEvent, useState } from "react";
import {
  ArrowUp,
  BotMessageSquare,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  DoorOpen,
  MessageSquareText,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

type Message = { id: number; role: "assistant" | "user"; text: string };

const suggestedPrompts = [
  "When is my next class?",
  "What assignments are due this week?",
  "Which labs have a projector and fit 30 people?",
  "Register me for the Guest Lecture on Deep Learning.",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi Sakibul. I can search the latest campus data, connect details across your schedule and events, and help with bookings or registrations.",
    },
  ]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: "Your request is ready for the live campus agent. Connect the API route to let me query current data and take actions here.",
      },
    ]);
    setInput("");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7f8]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-white p-5 lg:block">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white"><BotMessageSquare className="h-5 w-5" /></div>
            Campus agent
          </div>
          <div className="mt-8 rounded-lg border border-teal-100 bg-teal-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800"><span className="h-2 w-2 rounded-full bg-teal-500" />Live data mode</div>
            <p className="mt-2 text-xs leading-5 text-teal-900/70">Answers should come from the current campus records, including changes made in the dashboard.</p>
          </div>
          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agent can access</p>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <AccessItem icon={CalendarDays} label="Class schedule" />
              <AccessItem icon={DoorOpen} label="Rooms and bookings" />
              <AccessItem icon={Sparkles} label="Campus events" />
              <AccessItem icon={MessageSquareText} label="Announcements" />
              <AccessItem icon={CheckCircle2} label="Assignments" />
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="text-xs leading-5 text-slate-400">Ask naturally. I will clarify missing booking details before changing anything.</p>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-8">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700"><Sparkles className="h-4 w-4" />Campus assistant</div>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">How can I help today?</h1>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 sm:flex"><Wrench className="h-3.5 w-3.5 text-teal-700" />Tools ready</div>
            </div>
          </header>

          <div className="flex-1 px-4 py-7 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="space-y-5">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>

              {messages.length === 1 && (
                <div className="mt-10">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><CircleHelp className="h-3.5 w-3.5" />Try asking</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {suggestedPrompts.map((prompt) => (
                      <button className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300 hover:text-teal-800" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-5 sm:px-8">
            <form className="mx-auto max-w-3xl" onSubmit={submitMessage}>
              <div className="flex items-end gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-sm focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
                <textarea aria-label="Message CampusOS assistant" className="max-h-32 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask about classes, rooms, events, or deadlines..." rows={1} value={input} />
                <button aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200" disabled={!input.trim()} type="submit"><ArrowUp className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">The assistant checks live campus records before answering or taking action.</p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function AccessItem({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return <div className="flex items-center gap-2 rounded px-2 py-2"><Icon className="h-4 w-4 text-slate-400" />{label}</div>;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white"><BotMessageSquare className="h-4 w-4" /></div>}
      <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 ${isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"}`}>
        {message.text}
      </div>
      {isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-600"><User className="h-4 w-4" /></div>}
    </div>
  );
}