"use client";

import { useState, useMemo } from "react";
import { useThreads } from "@liveblocks/react/suspense";
import { useLiveblocksEnabled } from "@/components/liveblocks-provider";
import { Thread, Composer } from "@liveblocks/react-ui";
import {
  MessageSquare,
  X,
  CalendarDays,
  Flag,
  Tag,
  NotebookPen,
  Send,
} from "lucide-react";

/* ── Types ── */
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  labels: string[];
  syncCalendar: boolean;
  syncNotes: boolean;
  columnId: string;
  createdAt: number;
};

const PRIORITY_STYLES: Record<Priority, { label: string; bg: string; text: string; border: string; dot: string }> = {
  low: { label: "Low", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-400" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-400" },
  high: { label: "High", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", dot: "bg-rose-400" },
};

const LABEL_PALETTE: Record<string, string> = {
  Bug: "bg-rose-100 text-rose-600 border-rose-200",
  Feature: "bg-violet-100 text-violet-600 border-violet-200",
  Design: "bg-sky-100 text-sky-600 border-sky-200",
  Urgent: "bg-orange-100 text-orange-600 border-orange-200",
  Backend: "bg-emerald-100 text-emerald-600 border-emerald-200",
  Frontend: "bg-amber-100 text-amber-600 border-amber-200",
  Docs: "bg-slate-100 text-slate-600 border-slate-200",
  DevOps: "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200",
};

/* ── Comment Count Badge ── */
export function TaskCommentBadge({ taskId }: { taskId: string }) {
  const enabled = useLiveblocksEnabled();
  if (!enabled) return null;
  const { threads } = useThreads({ query: { metadata: { taskId } } });
  const count = threads.length;

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 border border-violet-200">
      <MessageSquare className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}

/* ── Task Detail Dialog with Comments ── */
export function TaskDetailDialog({
  open,
  onClose,
  task,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}) {
  if (!open || !task) return null;

  const ps = PRIORITY_STYLES[task.priority];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Task: ${task.title}`}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${ps.dot}`} />
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${ps.bg} ${ps.text} border ${ps.border}`}>
                <Flag className="h-2.5 w-2.5" />
                {ps.label}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{task.title}</h2>
            {task.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                {task.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task metadata */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-slate-200">
              <CalendarDays className="h-3 w-3 text-slate-400" />
              {task.dueDate}
            </span>
          )}
          {task.labels.map((ln) => (
            <span
              key={ln}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${LABEL_PALETTE[ln] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
            >
              <Tag className="h-2.5 w-2.5" />
              {ln}
            </span>
          ))}
          {task.syncCalendar && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-600 border border-sky-200">
              <CalendarDays className="h-2.5 w-2.5" />
              Calendar
            </span>
          )}
          {task.syncNotes && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600 border border-emerald-200">
              <NotebookPen className="h-2.5 w-2.5" />
              Notes
            </span>
          )}
        </div>

        {/* Comments section */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-500" />
            <h3 className="text-[13px] font-bold text-slate-700">Comments</h3>
          </div>

          {/* Liveblocks Thread for this task */}
          <TaskThread taskId={task.id} />
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 px-5 py-3">
          <TaskComposer taskId={task.id} />
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 -z-10"
        aria-label="Close backdrop"
      />
    </div>
  );
}

/* ── Task Thread (filters threads by taskId) ── */
function TaskThread({ taskId }: { taskId: string }) {
  const enabled = useLiveblocksEnabled();
  if (!enabled) return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-8 text-center">
      <MessageSquare className="h-8 w-8 text-slate-200" />
      <p className="mt-2 text-[12px] text-slate-400">Liveblocks not configured</p>
      <p className="mt-0.5 text-[11px] text-slate-300">Add a Liveblocks API key to enable comments</p>
    </div>
  );
  const { threads } = useThreads({ query: { metadata: { taskId } } });

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-8 text-center">
        <MessageSquare className="h-8 w-8 text-slate-200" />
        <p className="mt-2 text-[12px] text-slate-400">No comments yet</p>
        <p className="mt-0.5 text-[11px] text-slate-300">
          Start a conversation about this task
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => (
        <Thread
          key={thread.id}
          thread={thread}
          className="rounded-xl border border-slate-100"
        />
      ))}
    </div>
  );
}

/* ── Task Composer ── */
function TaskComposer({ taskId }: { taskId: string }) {
  const enabled = useLiveblocksEnabled();
  if (!enabled) return null;
  return (
    <Composer
      metadata={{ taskId }}
      className="rounded-xl border border-slate-200"
    />
  );
}
