"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface ToolInvocation {
  state: "partial-call" | "call" | "result";
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
}

interface ToolCallChipProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallChip({ toolInvocation }: ToolCallChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toolName, args, result, state } = toolInvocation;

  const isSuccess =
    state === "result" &&
    result &&
    (result.success !== false && !result.error);

  const isConflictOrError =
    state === "result" &&
    result &&
    (result.success === false || result.error || result.status === 409);

  const isPending = state !== "result";

  return (
    <div className="my-1.5 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50/90 text-xs text-neutral-800 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
      >
        <div className="flex items-center gap-2 font-mono">
          <Wrench className="h-3.5 w-3.5 text-neutral-500" />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {toolName}
          </span>
          {args && Object.keys(args).length > 0 && (
            <span className="max-w-[200px] truncate text-[11px] text-neutral-500 sm:max-w-[320px]">
              {JSON.stringify(args).slice(0, 50)}
              {JSON.stringify(args).length > 50 ? "..." : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isPending && (
            <span className="flex items-center gap-1 font-sans text-[11px] text-amber-600 dark:text-amber-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </span>
          )}
          {isSuccess && (
            <span className="flex items-center gap-1 font-sans text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Executed
            </span>
          )}
          {isConflictOrError && (
            <span className="flex items-center gap-1 font-sans text-[11px] text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-3 w-3" />
              Notice
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-neutral-200 bg-neutral-100/70 p-2.5 font-mono text-[11px] dark:border-neutral-800 dark:bg-neutral-950/70">
          <div className="mb-2">
            <div className="mb-0.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
              Arguments
            </div>
            <pre className="max-h-36 overflow-auto rounded bg-white p-2 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {result !== undefined && (
            <div>
              <div className="mb-0.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Result
              </div>
              <pre className="max-h-48 overflow-auto rounded bg-white p-2 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
