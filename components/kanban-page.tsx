"use client";

import { LiveblocksRoom } from "@/components/liveblocks-provider";
import { ActiveUsersBar, ShareDialog, CollaborationButton } from "@/components/kanban-collaboration";
import { TaskCommentBadge, TaskDetailDialog } from "@/components/kanban-task-comments";
import { useMyPresence, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { MessageSquare, Users } from "lucide-react";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
  CalendarDays,
  Columns3,
  GripVertical,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
  Tag,
  Flag,
} from "lucide-react";

/* ──────────────────────── Types ──────────────────────── */

type Priority = "low" | "medium" | "high";
type Label = { id: string; name: string; color: string };

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

type Column = { id: string; name: string };

type Board = {
  id: string;
  name: string;
  color: string;
  columns: Column[];
  createdAt: number;
};

/* ──────────────────── Constants ────────────────────── */

const BOARD_COLORS = [
  { name: "Violet", value: "#7C3AED", bg: "bg-violet-500", ring: "ring-violet-200" },
  { name: "Sky", value: "#0284C7", bg: "bg-sky-500", ring: "ring-sky-200" },
  { name: "Rose", value: "#E11D48", bg: "bg-rose-500", ring: "ring-rose-200" },
  { name: "Amber", value: "#D97706", bg: "bg-amber-500", ring: "ring-amber-200" },
  { name: "Emerald", value: "#059669", bg: "bg-emerald-500", ring: "ring-emerald-200" },
  { name: "Orange", value: "#EA580C", bg: "bg-orange-500", ring: "ring-orange-200" },
  { name: "Fuchsia", value: "#C026D3", bg: "bg-fuchsia-500", ring: "ring-fuchsia-200" },
  { name: "Indigo", value: "#4F46E5", bg: "bg-indigo-500", ring: "ring-indigo-200" },
];

const LABEL_PALETTE: Omit<Label, "id">[] = [
  { name: "Bug", color: "bg-rose-100 text-rose-600 border-rose-200" },
  { name: "Feature", color: "bg-violet-100 text-violet-600 border-violet-200" },
  { name: "Design", color: "bg-sky-100 text-sky-600 border-sky-200" },
  { name: "Urgent", color: "bg-orange-100 text-orange-600 border-orange-200" },
  { name: "Backend", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { name: "Frontend", color: "bg-amber-100 text-amber-600 border-amber-200" },
  { name: "Docs", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { name: "DevOps", color: "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200" },
];

const PRIORITY_STYLES: Record<Priority, { label: string; bg: string; text: string; border: string; dot: string }> = {
  low: { label: "Low", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-400" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-400" },
  high: { label: "High", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", dot: "bg-rose-400" },
};

function createId() { return crypto.randomUUID(); }

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultColumns(): Column[] {
  return [
    { id: createId(), name: "Todo" },
    { id: createId(), name: "In Progress" },
    { id: createId(), name: "Done" },
  ];
}

/* ──────────────────── Dialog Helpers ────────────────── */

function Dialog({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">{children}</div>
      <button type="button" onClick={onClose} className="fixed inset-0 -z-10" aria-label="Close backdrop" />
    </div>
  );
}

function DialogHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Kanban</p>
        <h2 className="mt-1 text-lg font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close dialog" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ──────────────────── Main Component ───────────────── */

export function KanbanPage() {
  const [boards, setBoards] = useState<Board[]>(() => {
    const cols = defaultColumns();
    return [{ id: createId(), name: "Product Roadmap", color: "#7C3AED", columns: cols, createdAt: Date.now() }];
  });
  const [activeBoardId, setActiveBoardId] = useState<string | null>(() => boards[0]?.id ?? null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sampleInit, setSampleInit] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── API sync helper ── */
  const syncToAPI = useCallback((boardData: Board[], taskData: Task[]) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const activeB = boardData.find(b => b.id === activeBoardId);
        if (activeB) {
          await fetch("/api/kanban", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ board: activeB, taskList: taskData.filter(t => activeB.columns.some(c => c.id === t.columnId)) }) });
        }
      } catch (e) { console.error("API sync failed:", e); }
    }, 500);
  }, [activeBoardId]);

  /* ── Load from API on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/kanban");
        if (res.ok) {
          const data = await res.json();
          if (data.boards?.length) { setBoards(data.boards); setActiveBoardId(data.boards[0].id); }
          if (data.tasks?.length) setTasks(data.tasks);
        }
      } catch (e) { console.error("Failed to load from API:", e); }
    })();
  }, []);
  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;

  if (activeBoard && !sampleInit && activeBoard.columns.length > 0) {
    setTasks([{
      id: createId(), title: "Define product requirements", description: "Write up the core feature set for the MVP.",
      dueDate: todayString(), priority: "high", labels: ["Feature"], syncCalendar: true, syncNotes: false,
      columnId: activeBoard.columns[0].id, createdAt: Date.now(),
    }]);
    setSampleInit(true);
  }

  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [boardForm, setBoardForm] = useState({ name: "", color: BOARD_COLORS[0].value });

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnId, setTargetColumnId] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", dueDate: todayString(), priority: "medium" as Priority,
    labels: [] as string[], syncCalendar: false, syncNotes: false,
  });

  const [editingColName, setEditingColName] = useState<{ columnId: string; value: string } | null>(null);

  // Collaboration state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /* ── Board CRUD ── */
  const openCreateBoard = () => { setEditingBoard(null); setBoardForm({ name: "", color: BOARD_COLORS[0].value }); setBoardDialogOpen(true); };
  const openEditBoard = (board: Board) => { setEditingBoard(board); setBoardForm({ name: board.name, color: board.color }); setBoardDialogOpen(true); };
  const saveBoard = () => {
    if (!boardForm.name.trim()) return;
    if (editingBoard) {
      setBoards((prev) => prev.map((b) => (b.id === editingBoard.id ? { ...b, name: boardForm.name.trim(), color: boardForm.color } : b)));
    } else {
      const nb: Board = { id: createId(), name: boardForm.name.trim(), color: boardForm.color, columns: defaultColumns(), createdAt: Date.now() };
      setBoards((prev) => [...prev, nb]);
      setActiveBoardId(nb.id);
    }
    setBoardDialogOpen(false);
  };
  const deleteBoard = (boardId: string) => {
    const db = boards.find((b) => b.id === boardId);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    if (db) { const cids = new Set(db.columns.map((c) => c.id)); setTasks((prev) => prev.filter((t) => !cids.has(t.columnId))); }
    if (activeBoardId === boardId) setActiveBoardId(boards.find((b) => b.id !== boardId)?.id ?? null);
  };

  /* ── Column CRUD ── */
  const addColumn = () => {
    if (!activeBoard || activeBoard.columns.length >= 5) return;
    setBoards((prev) => prev.map((b) => (b.id === activeBoard.id ? { ...b, columns: [...b.columns, { id: createId(), name: "New Column" }] } : b)));
  };
  const renameColumn = (columnId: string) => {
    if (!editingColName || !editingColName.value.trim()) { setEditingColName(null); return; }
    setBoards((prev) => prev.map((b) => (b.id === activeBoard?.id ? { ...b, columns: b.columns.map((c) => (c.id === columnId ? { ...c, name: editingColName.value.trim() } : c)) } : b)));
    setEditingColName(null);
  };
  const deleteColumn = (columnId: string) => {
    if (!activeBoard || activeBoard.columns.length <= 1) return;
    setBoards((prev) => prev.map((b) => (b.id === activeBoard.id ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) } : b)));
    setTasks((prev) => prev.filter((t) => t.columnId !== columnId));
  };

  /* ── Task CRUD ── */
  const openAddTask = (columnId: string) => {
    setEditingTask(null); setTargetColumnId(columnId);
    setTaskForm({ title: "", description: "", dueDate: todayString(), priority: "medium", labels: [], syncCalendar: false, syncNotes: false });
    setTaskDialogOpen(true);
  };
  const openEditTask = (task: Task) => {
    setEditingTask(task); setTargetColumnId(task.columnId);
    setTaskForm({ title: task.title, description: task.description, dueDate: task.dueDate, priority: task.priority, labels: [...task.labels], syncCalendar: task.syncCalendar, syncNotes: task.syncNotes });
    setTaskDialogOpen(true);
  };
  const saveTask = () => {
    if (!taskForm.title.trim()) return;
    if (editingTask) {
      setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, title: taskForm.title.trim(), description: taskForm.description, dueDate: taskForm.dueDate, priority: taskForm.priority, labels: taskForm.labels, syncCalendar: taskForm.syncCalendar, syncNotes: taskForm.syncNotes } : t));
    } else {
      setTasks((prev) => [...prev, { id: createId(), title: taskForm.title.trim(), description: taskForm.description, dueDate: taskForm.dueDate, priority: taskForm.priority, labels: taskForm.labels, syncCalendar: taskForm.syncCalendar, syncNotes: taskForm.syncNotes, columnId: targetColumnId, createdAt: Date.now() }]);
    }
    setTaskDialogOpen(false);
  };
  const deleteTask = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      const activeB3 = boards.find(b => b.id === activeBoardId);
      if (activeB3) { const tl = updated.filter(t => activeB3.columns.some(col => col.id === t.columnId)); fetch("/api/kanban", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ board: activeB3, taskList: tl }) }).catch(() => {}); }
      return updated;
    });
  };
  const toggleLabel = (labelName: string) => setTaskForm((prev) => ({ ...prev, labels: prev.labels.includes(labelName) ? prev.labels.filter((l) => l !== labelName) : [...prev.labels, labelName] }));

  /* ── Drag & Drop ── */
  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    setTasks((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((t) => t.id === draggableId);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], columnId: destination.droppableId };
      const [moved] = updated.splice(idx, 1);
      const destTasks = updated.filter((t) => t.columnId === destination.droppableId);
      if (destTasks.length === 0) { updated.push(moved); }
      else { const target = destTasks[destination.index] ?? destTasks[destTasks.length - 1]; const ins = updated.indexOf(target); updated.splice(ins === -1 ? updated.length : ins + (destination.index >= destTasks.length ? 1 : 0), 0, moved); }
      return updated;
    });
  }, []);

  const tasksByColumn = (columnId: string) => tasks.filter((t) => t.columnId === columnId);

  /* ── Render ── */
  return (
    <main className="flex min-h-screen bg-[#fbfcff] text-slate-900">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 flex h-screen w-[228px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2.5 py-3 backdrop-blur">
        <div className="flex h-9 items-center px-1">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200">
              <Menu className="h-4 w-4 text-white" />
            </span>
            <span className="truncate text-[15px] font-bold tracking-tight">Nestwork</span>
          </Link>
        </div>
        <nav className="mt-5 flex flex-1 flex-col gap-4" aria-label="Main navigation">
          <section className="w-full">
            <p className="mb-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Plan &amp; track</p>
            <div className="space-y-0.5">
              <Link href="/" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100/80:bg-slate-800/80 hover:text-slate-900:text-slate-100">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-600"><LayoutDashboard className="h-3.5 w-3.5" /></span>
                <span className="truncate">Dashboard</span>
              </Link>
              <span className="flex w-full items-center gap-2 rounded-lg bg-violet-50 px-1.5 py-1 text-[12px] font-semibold text-violet-950 shadow-sm ring-1 ring-violet-100">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-rose-100 text-rose-600"><Columns3 className="h-3.5 w-3.5" /></span>
                <span className="truncate">Task / Kanban</span>
              </span>
            </div>
          </section>
        </nav>
        <div className="border-t border-slate-100 pt-3 px-1">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Your space</p>
          <div className="flex w-full items-center rounded-lg p-1 gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[9px] font-bold text-white">AK</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-slate-700">Abhay&apos;s space</span>
              <span className="block truncate text-[9px] text-slate-400">Personal workspace</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200">
                <Sparkles className="h-4 w-4 text-white" />
              </Link>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Plan &amp; track</p>
                <h1 className="text-lg font-bold tracking-tight">Task / Kanban</h1>
              </div>
            </div>
            <Link href="/" className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:text-violet-700 sm:flex">
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
          </header>

          <div className="mt-5 grid gap-5 min-[900px]:grid-cols-[260px_1fr]">
            {/* ── Left Panel: Boards ── */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-100 text-rose-600"><Columns3 className="h-4 w-4" /></span>
                  <h2 className="mt-3 text-[15px] font-bold">My Boards</h2>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">Organize your work into boards.</p>
                </div>
                <button type="button" onClick={openCreateBoard} className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors" title="Create new board">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-1.5">
                {boards.map((board) => {
                  const isActive = board.id === activeBoardId;
                  return (
                    <div key={board.id} role="button" tabIndex={0} onClick={() => setActiveBoardId(board.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveBoardId(board.id); }} className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${isActive ? "bg-violet-50 ring-1 ring-violet-200 shadow-sm" : "hover:bg-slate-50:bg-slate-800"}`}>
                      <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: board.color }} />
                      <span className={`flex-1 truncate text-[12px] font-medium ${isActive ? "text-violet-900" : "text-slate-600"}`}>{board.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openEditBoard(board); }} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-300 opacity-0 transition-opacity hover:bg-violet-100 hover:text-violet-600 group-hover:opacity-100" title="Edit board"><Pencil className="h-3 w-3" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); }} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100" title="Delete board"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  );
                })}
                {boards.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                    <p className="text-[12px] text-slate-400">No boards yet</p>
                    <button type="button" onClick={openCreateBoard} className="mt-2 text-[12px] font-semibold text-violet-600 hover:text-violet-700">Create your first board</button>
                  </div>
                )}
              </div>
            </section>

            {/* ── Right Panel: Board Content ── */}
            <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
              {activeBoard ? (
                <LiveblocksRoom roomId={activeBoard.id} key={activeBoard.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: activeBoard.color }} />
                      <div>
                        <h2 className="text-[18px] font-bold tracking-tight">{activeBoard.name}</h2>
                        <p className="text-[11px] text-slate-400">{activeBoard.columns.length} columns · {tasks.filter((t) => activeBoard.columns.some((c) => c.id === t.columnId)).length} tasks</p>
                      </div>
                    </div>
                    {activeBoard.columns.length < 5 && (
                      <button type="button" onClick={addColumn} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-violet-200 hover:text-violet-700">
                        <Plus className="h-3.5 w-3.5" /> Add Column
                      </button>
                    )}
                  </div>

                  {/* Collaboration bar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <ActiveUsersBar />
                    <CollaborationButton onClick={() => setShareDialogOpen(true)} onlineCount={0} />
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <div className="mt-5 flex gap-4 overflow-x-auto pb-4">
                      {activeBoard.columns.map((column) => {
                        const colTasks = tasksByColumn(column.id);
                        return (
                          <div key={column.id} className="flex w-[280px] shrink-0 flex-col rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between px-3 pt-3 pb-2">
                              {editingColName?.columnId === column.id ? (
                                <input autoFocus value={editingColName.value} onChange={(e) => setEditingColName({ ...editingColName, value: e.target.value })} onBlur={() => renameColumn(column.id)} onKeyDown={(e) => { if (e.key === "Enter") renameColumn(column.id); if (e.key === "Escape") setEditingColName(null); }} className="w-full rounded-lg border border-violet-300 bg-white px-2 py-1 text-[13px] font-semibold text-slate-800 outline-none ring-2 ring-violet-100" />
                              ) : (
                                <button type="button" onClick={() => setEditingColName({ columnId: column.id, value: column.name })} className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-violet-700 transition-colors">
                                  {column.name} <Pencil className="h-3 w-3 text-slate-300" />
                                </button>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500 px-1">{colTasks.length}</span>
                                {activeBoard.columns.length > 1 && (
                                  <button type="button" onClick={() => deleteColumn(column.id)} className="grid h-5 w-5 place-items-center rounded-md text-slate-300 hover:bg-rose-50 hover:text-rose-400 transition-colors" title="Delete column"><Trash2 className="h-3 w-3" /></button>
                                )}
                              </div>
                            </div>

                            <Droppable droppableId={column.id}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 space-y-2 px-2 pb-2 min-h-[80px] transition-colors rounded-b-xl ${snapshot.isDraggingOver ? "bg-violet-50/80" : ""}`}>
                                  {colTasks.map((task, index) => {
                                    const ps = PRIORITY_STYLES[task.priority];
                                    return (
                                      <Draggable key={task.id} draggableId={task.id} index={index}>
                                        {(dp, ds) => (
                                          <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps} className={`rounded-xl border bg-white p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing ${ds.isDragging ? "shadow-lg ring-2 ring-violet-200 rotate-[2deg]" : "hover:border-violet-200 hover:shadow-md"}`}>
                                            <div className={`h-1 w-full rounded-full ${ps.dot} mb-2 opacity-60`} />
                                            <div className="flex items-start justify-between gap-2">
                                              <h4 className="text-[13px] font-semibold text-slate-800 leading-snug">{task.title}</h4>
                                              <button type="button" onClick={() => { setSelectedTask(task); setTaskDetailOpen(true); }} className="inline-flex items-center gap-1 rounded-md text-slate-300 hover:bg-violet-50 hover:text-violet-500 transition-colors px-1 py-0.5" title="Comments"><MessageSquare className="h-3.5 w-3.5" /><TaskCommentBadge taskId={task.id} /></button>
                                              <button type="button" onClick={() => openEditTask(task)} className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors" title="Edit task"><Pencil className="h-3 w-3" /></button>
                                            </div>
                                            {task.description && <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>}
                                            {task.labels.length > 0 && (
                                              <div className="mt-2 flex flex-wrap gap-1">
                                                {task.labels.map((ln) => { const ld = LABEL_PALETTE.find((l) => l.name === ln); return <span key={ln} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${ld?.color ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{ln}</span>; })}
                                              </div>
                                            )}
                                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ps.bg} ${ps.text} border ${ps.border}`}><Flag className="h-2.5 w-2.5" />{ps.label}</span>
                                              {task.dueDate && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><CalendarDays className="h-3 w-3" />{task.dueDate}</span>}
                                              <span className="ml-auto flex items-center gap-1">
                                                {task.syncCalendar && <span className="grid h-4 w-4 place-items-center rounded bg-sky-100 text-sky-500" title="Synced with Calendar"><CalendarDays className="h-2.5 w-2.5" /></span>}
                                                {task.syncNotes && <span className="grid h-4 w-4 place-items-center rounded bg-emerald-100 text-emerald-500" title="Linked with Notes"><NotebookPen className="h-2.5 w-2.5" /></span>}
                                              </span>
                                            </div>
                                            <div className="mt-2 flex justify-end">
                                              <button type="button" onClick={() => deleteTask(task.id)} className="grid h-5 w-5 place-items-center rounded text-slate-200 hover:bg-rose-50 hover:text-rose-400 transition-colors" title="Delete task"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                  {colTasks.length === 0 && !snapshot.isDraggingOver && (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-6 text-center">
                                      <p className="text-[11px] text-slate-300">No tasks yet</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Droppable>

                            <div className="px-2 pb-2">
                              <button type="button" onClick={() => openAddTask(column.id)} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-[12px] font-medium text-slate-400 transition-colors hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600">
                                <Plus className="h-3.5 w-3.5" /> Add task
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>

                  {/* Task Detail Dialog - must be inside LiveblocksRoom for Composer/Thread */}
                  <TaskDetailDialog open={taskDetailOpen} onClose={() => { setTaskDetailOpen(false); setSelectedTask(null); }} task={selectedTask} />

                </LiveblocksRoom>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-500"><Columns3 className="h-8 w-8" /></span>
                  <h3 className="mt-4 text-[18px] font-bold text-slate-800">No board selected</h3>
                  <p className="mt-1.5 text-[13px] text-slate-400 max-w-sm">Select a board from the left panel, or create a new one to get started.</p>
                  <button type="button" onClick={openCreateBoard} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"><Plus className="h-4 w-4" /> Create board</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* ═══════════ Board Dialog ═══════════ */}
      <Dialog open={boardDialogOpen} onClose={() => setBoardDialogOpen(false)} label={editingBoard ? "Edit board" : "Create board"}>
        <DialogHeader title={editingBoard ? "Edit board" : "New board"} subtitle={editingBoard ? "Update your board details" : "Create a new Kanban board"} onClose={() => setBoardDialogOpen(false)} />
        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Board name</span>
            <input autoFocus value={boardForm.name} onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveBoard(); }} placeholder="e.g. Product Roadmap" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100" />
          </label>
          <div>
            <span className="mb-2 block text-[11px] font-bold text-slate-600">Board color</span>
            <div className="flex flex-wrap gap-2.5">
              {BOARD_COLORS.map((color) => (
                <button key={color.value} type="button" onClick={() => setBoardForm({ ...boardForm, color: color.value })} title={color.name} className={`grid h-9 w-9 place-items-center rounded-xl transition-all ${boardForm.color === color.value ? `ring-2 ring-offset-2 ${color.ring} scale-110` : "hover:scale-105"}`}>
                  <span className={`h-7 w-7 rounded-lg ${color.bg}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setBoardDialogOpen(false)} className="rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button type="button" onClick={saveBoard} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-colors">{editingBoard ? "Save changes" : "Create board"}</button>
        </div>
      </Dialog>

      {/* ═══════════ Task Dialog ═══════════ */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} label={editingTask ? "Edit task" : "Create task"}>
        <DialogHeader title={editingTask ? "Edit task" : "New task"} subtitle={editingTask ? "Update task details" : "Add a task to your board"} onClose={() => setTaskDialogOpen(false)} />
        <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Title</span>
            <input autoFocus value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="What needs to be done?" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Description</span>
            <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Add more details..." rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Due Date</span>
              <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-violet-300" />
            </label>
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Priority</span>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as Priority[]).map((p) => {
                  const s = PRIORITY_STYLES[p];
                  return (
                    <button key={p} type="button" onClick={() => setTaskForm({ ...taskForm, priority: p })} className={`flex-1 rounded-lg border px-1.5 py-2 text-[11px] font-semibold transition-all ${taskForm.priority === p ? `${s.bg} ${s.text} ${s.border} ring-2 ring-offset-1 ring-current/10` : "border-slate-200 text-slate-400 hover:border-slate-300"}`}>{s.label}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-bold text-slate-600">Labels</span>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_PALETTE.map((label) => (
                <button key={label.name} type="button" onClick={() => toggleLabel(label.name)} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all ${taskForm.labels.includes(label.name) ? `${label.color} ring-2 ring-offset-1 ring-current/10` : "border-slate-200 text-slate-400 hover:border-slate-300"}`}><Tag className="h-2.5 w-2.5" />{label.name}</button>
              ))}
            </div>
          </div>

          {/* Integrations section */}
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Integrations</p>
            <label className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-100 text-sky-600"><CalendarDays className="h-3 w-3" /></span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">Sync with Calendar</p>
                  <p className="text-[10px] text-slate-400">Add this task to your calendar</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={taskForm.syncCalendar} onClick={() => setTaskForm({ ...taskForm, syncCalendar: !taskForm.syncCalendar })} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${taskForm.syncCalendar ? "bg-violet-600" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${taskForm.syncCalendar ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            <label className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><NotebookPen className="h-3 w-3" /></span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">Link with Notes</p>
                  <p className="text-[10px] text-slate-400">Connect this task to a note</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={taskForm.syncNotes} onClick={() => setTaskForm({ ...taskForm, syncNotes: !taskForm.syncNotes })} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${taskForm.syncNotes ? "bg-violet-600" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${taskForm.syncNotes ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setTaskDialogOpen(false)} className="rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button type="button" onClick={saveTask} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-colors">{editingTask ? "Save changes" : "Add task"}</button>
        </div>
      </Dialog>
      {/* Share Dialog */}
      <ShareDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} boardName={activeBoard?.name ?? "Board"} />

    </main>
  );
}
