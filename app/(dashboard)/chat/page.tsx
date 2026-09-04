"use client";

import { useState, useRef, useEffect } from "react";
import { StudentSelector, StudentIdentity } from "@/components/chat/student-selector";
import { ChatMessage } from "@/components/chat/message";
import { useLiveResource } from "@/hooks/useLiveResource";
import {
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Radio,
  AlertCircle,
} from "lucide-react";

export interface ToolInvocation {
  state: "partial-call" | "call" | "result";
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

const SUGGESTED_PROMPTS = [
  "What classes do I have on Wednesday?",
  "What rooms are available tomorrow afternoon?",
  "Show me upcoming assignments and deadlines",
  "What campus events are coming up?",
  "Who is teaching CSE101?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentStudent, setCurrentStudent] = useState<StudentIdentity>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campusos_student");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return { name: "Sakibul Hassan", studentId: "20-40532" };
  });

  const [recentLiveUpdate, setRecentLiveUpdate] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to live SSE updates for transparency indicator
  useLiveResource("*", () => {
    setRecentLiveUpdate(`Live DB update detected: ${new Date().toLocaleTimeString()}`);
    const timer = setTimeout(() => setRecentLiveUpdate(null), 4000);
    return () => clearTimeout(timer);
  });

  const handleStudentChange = (student: StudentIdentity) => {
    setCurrentStudent(student);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusos_student", JSON.stringify(student));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = "assistant-" + Date.now();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      toolInvocations: [],
    };

    setMessages([...newMessages, assistantMessage]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          student: currentStudent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";
      const toolInvocationsMap = new Map<string, ToolInvocation>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse AI SDK Data Stream protocol
          // 0:"text chunk"
          // 9:{"toolCallId":"...","toolName":"...","args":{...}}
          // a:{"toolCallId":"...","result":{...}}
          // e:{"finishReason":"...","usage":{...}}
          const colonIndex = line.indexOf(":");
          if (colonIndex === -1) continue;

          const type = line.slice(0, colonIndex);
          const rawPayload = line.slice(colonIndex + 1);

          try {
            if (type === "0") {
              // Text token chunk
              const textChunk = JSON.parse(rawPayload);
              streamedContent += textChunk;
            } else if (type === "9") {
              // Tool call invocation
              const toolCallData = JSON.parse(rawPayload);
              const toolCallId = toolCallData.toolCallId || "tc-" + Date.now();
              toolInvocationsMap.set(toolCallId, {
                state: "call",
                toolCallId,
                toolName: toolCallData.toolName,
                args: toolCallData.args || {},
              });
            } else if (type === "a") {
              // Tool call result
              const toolResultData = JSON.parse(rawPayload);
              const toolCallId = toolResultData.toolCallId;
              const existing = toolInvocationsMap.get(toolCallId) || {
                state: "result",
                toolCallId,
                toolName: "tool",
                args: {},
              };
              existing.state = "result";
              existing.result = toolResultData.result;
              toolInvocationsMap.set(toolCallId, existing);
            }
          } catch {
            // If parsing fails for a single line, continue
          }

          // Update message state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: streamedContent,
                    toolInvocations: Array.from(toolInvocationsMap.values()),
                  }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User intentionally stopped generation
        return;
      }
      console.error("Chat error:", err);
      setError(err.message || "Failed to communicate with CampusOS agent");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  msg.content ||
                  `⚠️ Error: ${err.message || "Unable to complete request. Please verify your API key in .env."}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col gap-3">
      {/* Top Bar: Student Identity & Live Sync Status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
              CampusOS AI Assistant
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Interactive campus intelligence with live tool execution & verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {recentLiveUpdate ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 animate-pulse dark:bg-emerald-950/80 dark:text-emerald-300">
                <Radio className="h-3.5 w-3.5" />
                {recentLiveUpdate}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                SSE Live Sync Active
              </span>
            )}

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        <StudentSelector
          currentStudent={currentStudent}
          onStudentChange={handleStudentChange}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 shadow-inner dark:border-neutral-800 dark:bg-neutral-950/50">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
              How can I help you today?
            </h2>
            <p className="mt-1 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
              Ask about your schedule, check room availability, register for events,
              or track assignment deadlines. Real tools execute live against MySQL.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 shadow-2xs transition hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                studentName={currentStudent.name}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Thinking & querying live database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white p-2 shadow-xs transition-within:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:transition-within:border-neutral-400">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about schedule, book a room, register for an event..."
            className="flex-1 bg-transparent px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white hover:bg-rose-700"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
