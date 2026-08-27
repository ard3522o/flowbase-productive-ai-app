"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TpLink from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import TpColor from "@tiptap/extension-color";
import { Editor, Extension } from "@tiptap/core";
import { useAssemblyAIStreaming } from "@/hooks/use-assemblyai-streaming";
import {
  FileText, Plus, Search, Pin, Trash2, MoreHorizontal,
  Copy, Palette, Clock, X, List, ListOrdered, CheckSquare,
  Quote, Code, Minus, Type, Heading1, Heading2, Heading3,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight, Sparkles, Eraser,
  RefreshCw, PlusCircle, MinusCircle, BookOpen, Spline,
  NotebookPen, LayoutDashboard, Columns3, Menu, Mic, Square, Loader2,
} from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  trashed: boolean;
  createdAt: number;
  updatedAt: number;
};

const NOTE_COLORS = [
  { name: "Default", value: "#ffffff", dot: "bg-slate-300", border: "border-slate-200", bg: "bg-white" },
  { name: "Violet", value: "#f5f3ff", dot: "bg-violet-400", border: "border-violet-200", bg: "bg-violet-50" },
  { name: "Sky", value: "#f0f9ff", dot: "bg-sky-400", border: "border-sky-200", bg: "bg-sky-50" },
  { name: "Rose", value: "#fff1f2", dot: "bg-rose-400", border: "border-rose-200", bg: "bg-rose-50" },
  { name: "Amber", value: "#fffbeb", dot: "bg-amber-400", border: "border-amber-200", bg: "bg-amber-50" },
  { name: "Emerald", value: "#ecfdf5", dot: "bg-emerald-400", border: "border-emerald-200", bg: "bg-emerald-50" },
  { name: "Orange", value: "#fff7ed", dot: "bg-orange-400", border: "border-orange-200", bg: "bg-orange-50" },
  { name: "Fuchsia", value: "#fdf4ff", dot: "bg-fuchsia-400", border: "border-fuchsia-200", bg: "bg-fuchsia-50" },
];

const AI_OPTIONS = [
  { label: "Improve grammar", icon: CheckSquare },
  { label: "Rephrase", icon: RefreshCw },
  { label: "Make shorter", icon: MinusCircle },
  { label: "Make longer", icon: PlusCircle },
  { label: "Simplify language", icon: BookOpen },
  { label: "Change tone", icon: Spline },
];

const SLASH_ITEMS = [
  { title: "Text", icon: Type, desc: "Plain text", cmd: (e: any) => e.chain().focus().clearNodes().run() },
  { title: "Heading 1", icon: Heading1, desc: "Large heading", cmd: (e: any) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Heading 2", icon: Heading2, desc: "Medium heading", cmd: (e: any) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", icon: Heading3, desc: "Small heading", cmd: (e: any) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Bullet List", icon: List, desc: "Unordered list", cmd: (e: any) => e.chain().focus().toggleBulletList().run() },
  { title: "Numbered List", icon: ListOrdered, desc: "Ordered list", cmd: (e: any) => e.chain().focus().toggleOrderedList().run() },
  { title: "Task List", icon: CheckSquare, desc: "Checklist", cmd: (e: any) => e.chain().focus().toggleTaskList().run() },
  { title: "Quote", icon: Quote, desc: "Blockquote", cmd: (e: any) => e.chain().focus().toggleBlockquote().run() },
  { title: "Code Block", icon: Code, desc: "Code snippet", cmd: (e: any) => e.chain().focus().toggleCodeBlock().run() },
  { title: "Divider", icon: Minus, desc: "Horizontal rule", cmd: (e: any) => e.chain().focus().setHorizontalRule().run() },
];

function createId() { return crypto.randomUUID(); }
function timeAgo(ts: number) {
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return "Just now"; if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function defaultNote(): Note {
  return { id: createId(), title: "Untitled", content: "", color: "#ffffff", pinned: false, trashed: false, createdAt: Date.now(), updatedAt: Date.now() };
}

const PlaceholderExt = Placeholder.configure({ placeholder: "Press / for commands…" });
const HighlightExt = Highlight.configure({ multicolor: true });
const TextAlignExt = TextAlign.configure({ types: ["heading", "paragraph"] });
const TaskItemExt = TaskItem.configure({ nested: true });
const TpLinkExt = TpLink.configure({ openOnClick: false });

/* ─── Slash Command Menu ─── */
function SlashMenu({ query, onSelect, onClose }: { query: string; onSelect: (item: typeof SLASH_ITEMS[0]) => void; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = SLASH_ITEMS.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { setIdx(0); }, [query]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => (i + 1) % Math.max(filtered.length, 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1)); }
      if (e.key === "Enter" && filtered[idx]) { e.preventDefault(); onSelect(filtered[idx]); }
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [filtered, idx, onSelect, onClose]);
  if (filtered.length === 0) return null;
  return (
    <div ref={ref} data-slash-menu className="absolute z-50 w-[240px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Blocks</p>
      {filtered.map((item, i) => {
        const Icon = item.icon;
        return (
          <button key={item.title} type="button" onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
            onMouseEnter={() => setIdx(i)}
            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${i === idx ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="text-[12px] font-semibold">{item.title}</p><p className="text-[10px] text-slate-400">{item.desc}</p></div>
          </button>
        );
      })}
    </div>
  );
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ noteId: string; x: number; y: number } | null>(null);
  const [colorPicker, setColorPicker] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [slash, setSlash] = useState<{ open: boolean; query: string; top: number; left: number }>({ open: false, query: "", top: 0, left: 0 });
  const [aiMenu, setAiMenu] = useState(false);
  const [insertedTurns, setInsertedTurns] = useState<Set<string>>(new Set());

  const active = notes.find((n) => n.id === activeId) ?? null;

  /* ── localStorage ── */
  useEffect(() => {
    try {
      const raw = null; /* API-loaded */
      if (raw) { const p = JSON.parse(raw) as Note[]; setNotes(p); if (p.length) setActiveId(p[0].id); }
      else { const f = defaultNote(); setNotes([f]); setActiveId(f.id); }
    } catch { const f = defaultNote(); setNotes([f]); setActiveId(f.id); }
  }, []);
  /* ── Load from API ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notes");
        if (res.ok) { const data = await res.json(); if (data.length) setNotes(data); }
      } catch (e) { console.error("Failed to load notes:", e); }
    })();
  }, []);

  /* ── Sync to API on changes ── */
  useEffect(() => {
    if (!notes.length) return;
    localStorage.setItem("flowbase-notes", JSON.stringify(notes)); /* keep as backup */
  }, [notes]);

  /* ── Editor ── */
  const editorRef = useRef<Editor | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const e = new Editor({
    extensions: [StarterKit.configure({ link: false, underline: false }), PlaceholderExt, HighlightExt, TextAlignExt, TaskList, TaskItemExt, TpLinkExt, TextStyle, TpColor],
    content: active?.content || "",
    editorProps: { attributes: { class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] px-16 py-12 text-[15px] leading-[1.8]" } },
    onUpdate: ({ editor: ed }) => {
      if (!activeId) return;
      setSaveStatus("unsaved");
      const html = ed.getHTML();
      const textContent = ed.getText();
      const titleLine = textContent.split("\n")[0]?.trim() || "Untitled";
      setNotes((prev) => prev.map((n) => n.id === activeId ? { ...n, content: html, updatedAt: Date.now() } : n));
      clearTimeout((window as any).__ns);
      (window as any).__ns = setTimeout(() => setSaveStatus("saved"), 800);
    },
    });
    editorRef.current = e;
    setEditor(e);
    return () => { e.destroy(); editorRef.current = null; };
  }, [activeId]);

  /* ── AssemblyAI Streaming ── */
  const lastInsertedRef = useRef("");
  const handleTranscript = useCallback((text: string, _endOfTurn: boolean) => {
    const ed = editorRef.current;
    if (!ed || !text.trim()) return;
    // Insert delta text on every turn
    const prevLen = lastInsertedRef.current.length;
    if (text.length > prevLen) {
      const delta = text.slice(prevLen);
      ed.commands.insertContent(delta);
      setSaveStatus("unsaved");
      clearTimeout((window as any).__ns);
      (window as any).__ns = setTimeout(() => setSaveStatus("saved"), 800);
    }
    lastInsertedRef.current = text;
  }, []);

  const { isRecording, isConnecting, error: micError, liveTranscript, startRecording, stopRecording: rawStopRecording } = useAssemblyAIStreaming(handleTranscript);

  const stopRecording = useCallback(() => {
    // Insert any remaining live transcript before stopping
    const ed = editorRef.current;
    if (ed && liveTranscript.trim()) {
      const space = ed.getText().length > 0 ? " " : "";
      ed.commands.insertContent(space + liveTranscript);
      setSaveStatus("unsaved");
      clearTimeout((window as any).__ns);
      (window as any).__ns = setTimeout(() => setSaveStatus("saved"), 800);
    }
    rawStopRecording();
  }, [rawStopRecording, liveTranscript]);

  /* ── Sync on note change ── */
  useEffect(() => { if (editor && active) { const cur = editor.getHTML(); if (cur !== active.content) editor.commands.setContent(active.content || ""); } }, [activeId]);

  /* ── Word count ── */
  const wordCount = useMemo(() => { if (!editor) return 0; const t = editor.getText(); return t.trim() ? t.trim().split(/\s+/).length : 0; }, [editor?.getJSON()]);

  /* ── Slash commands ── */
  useEffect(() => {
    if (!editor) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !slash.open && !e.ctrlKey && !e.metaKey) {
        setTimeout(() => {
          const { view } = editor;
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          setSlash({ open: true, query: "", top: coords.bottom + 8, left: Math.min(coords.left, window.innerWidth - 260) });
        }, 10);
      }
    };
    editor.view.dom.addEventListener("keydown", handler);
    return () => editor.view.dom.removeEventListener("keydown", handler);
  }, [editor, slash.open]);

  /* ── Filter notes ── */
  const filtered = useMemo(() => {
    let list = showTrash ? notes.filter((n) => n.trashed) : notes.filter((n) => !n.trashed);
    if (search) list = list.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));
    return [...list.filter((n) => n.pinned), ...list.filter((n) => !n.pinned)];
  }, [notes, search, showTrash]);

  /* ── CRUD ── */
  const createNote = () => {
    const n = { ...defaultNote(), color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].value };
    setNotes((p) => [n, ...p]); setActiveId(n.id); setShowTrash(false);
    setTimeout(() => editor?.commands.setContent(""), 10);
  };
  const deleteNote = (id: string) => {
    setNotes((p) => p.map((n) => n.id === id ? { ...n, trashed: true } : n));
    if (activeId === id) setActiveId(notes.filter((n) => n.id !== id && !n.trashed)[0]?.id ?? null);
  };
  const restoreNote = (id: string) => setNotes((p) => p.map((n) => n.id === id ? { ...n, trashed: false } : n));
  const permDelete = (id: string) => {
    setNotes((p) => p.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(notes.filter((n) => n.id !== id)[0]?.id ?? null);
  };
  const togglePin = (id: string) => setNotes((p) => p.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const duplicateNote = (id: string) => {
    const s = notes.find((n) => n.id === id); if (!s) return;
    const d: Note = { ...s, id: createId(), title: s.title + " (copy)", pinned: false, trashed: false, createdAt: Date.now(), updatedAt: Date.now() };
    setNotes((p) => [d, ...p]); setActiveId(d.id);
  };
  const setNoteColor = (id: string, color: string) => { setNotes((p) => p.map((n) => n.id === id ? { ...n, color } : n)); setColorPicker(null); };
  const renameNote = (id: string, newTitle: string) => { setNotes((p) => p.map((n) => n.id === id ? { ...n, title: newTitle || "Untitled", updatedAt: Date.now() } : n)); };

  /* ── AI Refine (mock) ── */
  const aiRefine = (action: typeof AI_OPTIONS[0]) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (!text.trim()) return;
    let result = text;
    switch (action.label) {
      case "Make shorter": result = text.slice(0, Math.max(text.length * 0.6, 20)); break;
      case "Make longer": result = text + "\n\n" + text; break;
      case "Simplify language": result = text.replace(/(utilize|commence|endeavor|facilitate|implement)/gi, "use"); break;
      default: result = text.charAt(0).toUpperCase() + text.slice(1); break;
    }
    editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
    setAiMenu(false);
  };

  /* Close menus */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-ctx]") && !t.closest("[data-color]") && !t.closest("[data-slash]")) {
        setCtxMenu(null); setColorPicker(null); setSlash((s) => ({...s, open: false})); setAiMenu(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <main className="flex min-h-screen bg-[#fbfcff] text-slate-900">
      <aside className="sticky top-0 flex h-screen w-[228px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2.5 py-3 backdrop-blur">
        <div className="flex h-9 items-center px-1">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-300"><Menu className="h-5 w-5 text-white" /></span>
            <span className="truncate text-[17px] font-bold tracking-tight">Flowbase</span>
          </Link>
        </div>
        <nav className="mt-5 flex-1" aria-label="Main navigation">
          <p className="mb-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Create &amp; think</p>
          <div className="space-y-0.5">
            <Link href="/" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-900"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-600"><LayoutDashboard className="h-3.5 w-3.5" /></span><span className="truncate">Dashboard</span></Link>
            <span className="flex w-full items-center gap-2 rounded-lg bg-emerald-50 px-1.5 py-1 text-[12px] font-semibold text-emerald-950 shadow-sm ring-1 ring-emerald-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-600"><NotebookPen className="h-3.5 w-3.5" /></span><span className="truncate">Notes</span></span>
            <Link href="/kanban" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-900"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-rose-100 text-rose-600"><Columns3 className="h-3.5 w-3.5" /></span><span className="truncate">Task / Kanban</span></Link>
          </div>
        </nav>
        <div className="border-t border-slate-100 pt-3 px-1"><div className="flex w-full items-center rounded-lg p-1 gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[9px] font-bold text-white">AK</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-700">Abhay&apos;s space</span><span className="block truncate text-[9px] text-slate-400">Personal workspace</span></span></div></div>
      </aside>
      {/* Notes Panel */}
      <div className="flex h-screen w-[300px] shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><NotebookPen className="h-3.5 w-3.5" /></span>
            <div><h2 className="text-[13px] font-bold text-slate-800">Notes</h2><p className="text-[10px] text-slate-400">{filtered.length} notes</p></div>
          </div>
          {!showTrash && <button type="button" onClick={createNote} className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><Plus className="h-4 w-4" /></button>}
        </div>
        {!showTrash && <div className="px-3 py-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12px] outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" /></div></div>}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">          {filtered.map((note) => {
            const c = NOTE_COLORS.find((x) => x.value === note.color) ?? NOTE_COLORS[0];
            const isAct = note.id === activeId && !showTrash;
            return (
              <div key={note.id} onClick={() => { if (!showTrash) { setActiveId(note.id); setCtxMenu(null); } }} className={`group relative flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all ${isAct ? "ring-1 shadow-sm " + c.border + " " + c.bg : "hover:bg-slate-50"}`}>
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5">{note.pinned && <Pin className="h-2.5 w-2.5 shrink-0 text-amber-400 fill-amber-400" />}<p className={`truncate text-[12px] font-semibold ${isAct ? "text-slate-800" : "text-slate-600"}`}>{note.title}</p></div><div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-2.5 w-2.5 text-slate-300" /><p className="text-[10px] text-slate-400">{timeAgo(note.updatedAt)}</p></div></div>
                {!showTrash && <button type="button" onClick={(e) => { e.stopPropagation(); setCtxMenu({ noteId: note.id, x: e.clientX, y: e.clientY }); }} className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100"><MoreHorizontal className="h-3 w-3" /></button>}
              </div>); })}
          {filtered.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-300"><FileText className="h-6 w-6" /></span><p className="mt-3 text-[12px] font-medium text-slate-400">No notes yet</p></div>}
        </div>
        <div className="border-t border-slate-100 px-3 py-2"><button type="button" onClick={() => { setShowTrash(!showTrash); setSearch(""); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /><span>Trash</span>{notes.filter((n) => n.trashed).length > 0 && <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">{notes.filter((n) => n.trashed).length}</span>}</button></div>
      </div>
      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {active ? (
          <div className="flex items-center justify-between border-b border-slate-100 px-8 py-3 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Editing</span><input value={active.title} onChange={(e) => renameNote(activeId!, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") editor?.commands.focus(); }} className="border-none bg-transparent text-[18px] font-bold text-slate-800 outline-none placeholder:text-slate-300 w-[300px]" placeholder="Untitled" />
              <div className="flex items-center gap-1">{NOTE_COLORS.map((c) => (<button key={c.value} type="button" onClick={() => setNoteColor(activeId!, c.value)} title={c.name} className={`h-4 w-4 rounded-full border-2 transition-transform ${active.color === c.value ? "scale-125 border-slate-400" : "border-white hover:scale-110"}`} style={{ backgroundColor: c.value === "#ffffff" ? "#e2e8f0" : c.value }} />))}</div>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {/* Speak to Note */}
              <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isConnecting}
                className={isRecording ? "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all bg-rose-100 text-rose-600 ring-2 ring-rose-200 animate-pulse" : isConnecting ? "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all bg-slate-100 text-slate-400" : "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}>
                {isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isRecording ? <Square className="h-3 w-3" /> : <Mic className="h-3.5 w-3.5" />}
                {isConnecting ? "Connecting..." : isRecording ? "Stop" : "Speak to Note"}
              </button>
              {micError && <span className="text-[10px] text-rose-500">{micError}</span>}
              <span className="text-slate-400">{wordCount} words</span><span className={saveStatus === "saved" ? "text-emerald-500" : "text-slate-400"}>{saveStatus === "saved" ? "Saved" : "Editing..."}</span></div>
          </div>
        ) : null}

        {/* Toolbar */}
        {editor && active && (
          <div className="flex items-center gap-1 border-b border-slate-100 px-8 py-1.5 bg-white/80 flex-wrap">
            {[{ icon: Bold, act: editor.isActive("bold"), fn: () => editor.chain().focus().toggleBold().run() },
              { icon: Italic, act: editor.isActive("italic"), fn: () => editor.chain().focus().toggleItalic().run() },
              { icon: UnderlineIcon, act: editor.isActive("underline"), fn: () => editor.chain().focus().toggleUnderline().run() },
              { icon: Strikethrough, act: editor.isActive("strike"), fn: () => editor.chain().focus().toggleStrike().run() },
              { icon: Highlighter, act: editor.isActive("highlight"), fn: () => editor.chain().focus().toggleHighlight().run() },
            ].map(({ icon: I, act, fn }, i) => (<button key={i} type="button" onClick={fn} className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${act ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}><I className="h-3.5 w-3.5" /></button>))}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            {[{ icon: Heading1, act: editor.isActive("heading", { level: 1 }), fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
              { icon: Heading2, act: editor.isActive("heading", { level: 2 }), fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
              { icon: Heading3, act: editor.isActive("heading", { level: 3 }), fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
            ].map(({ icon: I, act, fn }, i) => (<button key={i} type="button" onClick={fn} className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${act ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}><I className="h-3.5 w-3.5" /></button>))}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            {[{ icon: List, act: editor.isActive("bulletList"), fn: () => editor.chain().focus().toggleBulletList().run() },
              { icon: ListOrdered, act: editor.isActive("orderedList"), fn: () => editor.chain().focus().toggleOrderedList().run() },
              { icon: CheckSquare, act: editor.isActive("taskList"), fn: () => editor.chain().focus().toggleTaskList().run() },
              { icon: Quote, act: editor.isActive("blockquote"), fn: () => editor.chain().focus().toggleBlockquote().run() },
              { icon: Code, act: editor.isActive("codeBlock"), fn: () => editor.chain().focus().toggleCodeBlock().run() },
            ].map(({ icon: I, act, fn }, i) => (<button key={i} type="button" onClick={fn} className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${act ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}><I className="h-3.5 w-3.5" /></button>))}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><Eraser className="h-3.5 w-3.5" /><div className="mx-1 h-5 w-px bg-slate-200" /><button type="button" onClick={() => setAiMenu(!aiMenu)} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1.5 text-[11px] font-bold text-white hover:from-violet-600 hover:to-indigo-600 transition-all ml-1"><Sparkles className="h-3 w-3" /> AI Refine</button></button>
          </div>
        )}
        {/* Live Transcript Preview */}
        {isRecording && liveTranscript && (
          <div className="mx-8 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <p className="flex-1 truncate text-[12px] font-medium text-rose-700 italic">{liveTranscript}</p>
            <span className="text-[10px] font-bold text-rose-400 uppercase">live</span>
          </div>
        )}
        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto bg-white" onClick={() => editor?.commands.focus()}>
          {active ? (
            <div className="mx-auto max-w-[800px]"><EditorContent editor={editor} /></div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-500"><NotebookPen className="h-8 w-8" /></span>
              <h3 className="mt-4 text-[18px] font-bold text-slate-800">No note selected</h3>
              <p className="mt-1.5 text-[13px] text-slate-400">Select a note or create a new one.</p>
              <button type="button" onClick={createNote} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition"><Plus className="h-4 w-4" /> New note</button>
            </div>
          )}
        </div>
      </div>

            {/* AI Refine Menu */}
      {aiMenu && (
        <div data-slash className="fixed z-50 w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600">AI Refine</p>
          {AI_OPTIONS.map((opt) => { const I = opt.icon; return (
            <button key={opt.label} type="button" onClick={() => aiRefine(opt)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500"><I className="h-3.5 w-3.5" /></span>{opt.label}</button>
          ); })}
        </div>
      )}

      {/* Slash Command Menu */}
      {slash.open && (
        <div data-slash style={{ position: "fixed", top: slash.top, left: slash.left }} className="z-50">
          <SlashMenu query={slash.query} onSelect={(item) => { item.cmd(editor!); setSlash({ open: false, query: "", top: 0, left: 0 }); }} onClose={() => setSlash({ open: false, query: "", top: 0, left: 0 })} />
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <div data-ctx style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 60 }} className="w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button type="button" onClick={() => { const note = notes.find((n) => n.id === ctxMenu.noteId); if (note) { const newTitle = prompt("Rename note:", note.title); if (newTitle !== null) renameNote(ctxMenu.noteId, newTitle); } setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-colors">Rename</button>
          <button type="button" onClick={() => { togglePin(ctxMenu.noteId); setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors">{notes.find((n) => n.id === ctxMenu.noteId)?.pinned ? "Unpin" : "Pin"}</button>
          <button type="button" onClick={() => { duplicateNote(ctxMenu.noteId); setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Duplicate</button>
          <button type="button" onClick={() => { setColorPicker(ctxMenu.noteId); setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Color</button>
          <div className="my-1 h-px bg-slate-100" />
          <button type="button" onClick={() => { deleteNote(ctxMenu.noteId); setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">Delete</button>
        </div>
      )}

      {/* Color Picker */}
      {colorPicker && (
        <div data-color className="fixed z-50 w-[200px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Note color</p>
          <div className="grid grid-cols-4 gap-2">{NOTE_COLORS.map((c) => (<button key={c.value} type="button" onClick={() => setNoteColor(colorPicker, c.value)} title={c.name} className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${notes.find((n) => n.id === colorPicker)?.color === c.value ? "border-slate-400 scale-110" : "border-transparent"}`} style={{ backgroundColor: c.value === "#ffffff" ? "#f1f5f9" : c.value }} />))}</div>
        </div>
      )}
    </main>
  );
}