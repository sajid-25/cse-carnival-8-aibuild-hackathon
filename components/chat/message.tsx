"use client";

import { ToolCallChip } from "./tool-call-chip";
import { Bot, User, Sparkles } from "lucide-react";

interface MessageProps {
  message: {
    id: string;
    role: string;
    content: string;
    toolInvocations?: Array<{
      state: "partial-call" | "call" | "result";
      toolCallId: string;
      toolName: string;
      args: any;
      result?: any;
    }>;
  };
  studentName?: string;
}

export function ChatMessage({ message, studentName }: MessageProps) {
  const isUser = message.role === "user";
  const hasToolCalls =
    message.toolInvocations && message.toolInvocations.length > 0;

  return (
    <div
      className={`flex gap-3 py-3 transition-colors ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isUser
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Body */}
      <div
        className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-1.5 px-1 text-xs text-neutral-400">
          <span>{isUser ? studentName || "You" : "CampusOS Assistant"}</span>
        </div>

        {/* Tool Invocations for Assistant */}
        {!isUser && hasToolCalls && (
          <div className="w-full space-y-1">
            {message.toolInvocations!.map((toolInvocation) => (
              <ToolCallChip
                key={toolInvocation.toolCallId}
                toolInvocation={toolInvocation}
              />
            ))}
          </div>
        )}

        {/* Content Bubble */}
        {message.content && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-200 bg-white text-neutral-900 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
