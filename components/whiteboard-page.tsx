"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FileText, Plus, Search, Trash2, MoreHorizontal, Clock,
  Pencil, Palette, Download, Sparkles, Menu, Columns3, NotebookPen,
  Presentation, X, Loader2, AlertCircle, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

const ExcalidrawComp = dynamic(() => import("@excalidraw/excalidraw").then(m => m.Excalidraw), { ssr: false });
type ExcalidrawAPI = any;

type Whiteboard = {
  id: string;
  name: string;
  color: string;
  updatedAt: number;
  createdAt: number;
};

const WB_COLORS = [
  { name: "Violet", value: "#7C3AED", dot: "bg-violet-400" },
  { name: "Sky", value: "#0284C7", dot: "bg-sky-400" },
  { name: "Rose", value: "#E11D48", dot: "bg-rose-400" },
  { name: "Amber", value: "#D97706", dot: "bg-amber-400" },
  { name: "Emerald", value: "#059669", dot: "bg-emerald-400" },
  { name: "Orange", value: "#EA580C", dot: "bg-orange-400" },
  { name: "Fuchsia", value: "#C026D3", dot: "bg-fuchsia-400" },
  { name: "Indigo", value: "#4F46E5", dot: "bg-indigo-400" },
];

const AI_DIAGRAMS = [
  { label: "Flowchart", prompt: "Create a flowchart with decision nodes and process steps" },
  { label: "Mind Map", prompt: "Create a mind map with a central topic and branching subtopics" },
  { label: "Architecture", prompt: "Create a system architecture diagram with services and databases" },
  { label: "User Journey", prompt: "Create a user journey diagram showing touchpoints and emotions" },
  { label: "Process", prompt: "Create a process diagram with sequential steps and loops" },
];

function createId() { return crypto.randomUUID(); }
function timeAgo(ts: number) {
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return "Just now"; if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function defaultBoard(): Whiteboard {
  return { id: createId(), name: "Untitled Board", color: WB_COLORS[0].value, updatedAt: Date.now(), createdAt: Date.now() };
}
export function WhiteboardPage() {
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [aiDialog, setAiDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [colorPicker, setColorPicker] = useState<string | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawAPI>(null);
  const boardDataRef = useRef<Record<string, string>>({});

  const active = boards.find((b) => b.id === activeId) ?? null;

  /* localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nestwork-wb");
      if (raw) { const p = JSON.parse(raw) as Whiteboard[]; setBoards(p); if (p.length) setActiveId(p[0].id); }
      else { const f = defaultBoard(); setBoards([f]); setActiveId(f.id); }
    } catch { const f = defaultBoard(); setBoards([f]); setActiveId(f.id); }
  }, []);
  useEffect(() => { if (boards.length) localStorage.setItem("nestwork-wb", JSON.stringify(boards)); }, [boards]);

  /* Load board data when active changes */
  useEffect(() => {
    if (!activeId || !excalidrawAPIRef.current) return;
    const saved = boardDataRef.current[activeId];
    if (saved) {
      try {
        const data = JSON.parse(saved);
        excalidrawAPIRef.current.updateScene({ elements: (data.elements || []).map((el: any) => { const { index, ...rest } = el; return rest; }) });
      } catch {}
    }
  }, [activeId]);

  /* Auto-save */
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
    if (!activeId || !excalidrawAPIRef.current) return;
    setSaveStatus("unsaved");
    const rawEls = excalidrawAPIRef.current.getSceneElements().map((el: any) => { const { index, ...rest } = el; return rest; });
    const data = JSON.stringify({ elements: rawEls, appState });
    boardDataRef.current[activeId] = data;
    setBoards((prev) => prev.map((b) => b.id === activeId ? { ...b, updatedAt: Date.now() } : b));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem("nestwork-wb-data", JSON.stringify(boardDataRef.current));
      setSaveStatus("saved");
    }, 1000);
  }, [activeId]);

  /* Load all board data on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nestwork-wb-data");
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.keys(parsed).forEach(key => {
          try {
            const d = JSON.parse(parsed[key]);
            if (d.elements) {
              d.elements = d.elements.map((el: any) => { const { index, ...rest } = el; return rest; });
              parsed[key] = JSON.stringify(d);
            }
          } catch {}
        });
        boardDataRef.current = parsed;
      }
    } catch {}
  }, []);  /* CRUD */
  const createBoard = () => {
    const b = { ...defaultBoard(), color: WB_COLORS[Math.floor(Math.random() * WB_COLORS.length)].value };
    setBoards((p) => [b, ...p]); setActiveId(b.id);
  };
  const deleteBoard = (id: string) => {
    setBoards((p) => p.filter((b) => b.id !== id));
    if (activeId === id) setActiveId(boards.find((b) => b.id !== id)?.id ?? null);
    delete boardDataRef.current[id];
  };
  const renameBoard = (id: string, name: string) => {
    setBoards((p) => p.map((b) => b.id === id ? { ...b, name: name || "Untitled Board" } : b));
  };
  const setBoardColor = (id: string, color: string) => {
    setBoards((p) => p.map((b) => b.id === id ? { ...b, color } : b));
    setColorPicker(null);
  };
  /* Export PNG */
  const exportPNG = async () => {
    if (!excalidrawAPIRef.current) return;
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();
      const blob = await exportToBlob({ elements, appState, files, mimeType: "image/png", quality: 1 });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (active?.name || "whiteboard") + ".png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error("Export failed:", e); }
  };
    /* AI Diagram (real AI) */
  const generateAIDiagram = async () => {
    if (!excalidrawAPIRef.current || !aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      const api = excalidrawAPIRef.current;
      const existing = api.getSceneElements();
      api.updateScene({ elements: [...existing, ...data.elements] });
      setAiDialog(false); setAiPrompt("");
    } catch (e: any) {
      console.error("AI diagram error:", e);
      alert("Failed to generate diagram: " + (e.message || "Unknown error"));
    } finally {
      setAiLoading(false);
    }
  };

/* Close menus */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-ctx]") && !t.closest("[data-color]")) {
        setCtxMenu(null); setColorPicker(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const setExcalidrawAPI = useCallback((api: any) => { excalidrawAPIRef.current = api; }, []);
  const filtered = boards.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex min-h-screen bg-[#fbfcff] text-slate-900">
      {/* App Sidebar */}
      <aside className="sticky top-0 flex h-screen w-[228px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2.5 py-3 backdrop-blur">
        <div className="flex h-9 items-center px-1"><Link href="/" className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200"><Menu className="h-4 w-4 text-white" /></span><span className="truncate text-[15px] font-bold tracking-tight">Nestwork</span></Link></div>
        <nav className="mt-5 flex-1"><p className="mb-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Create &amp; think</p><div className="space-y-0.5">
          <Link href="/" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-600"><FileText className="h-3.5 w-3.5" /></span><span className="truncate">Dashboard</span></Link>
          <Link href="/notes" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-600"><NotebookPen className="h-3.5 w-3.5" /></span><span className="truncate">Notes</span></Link>
          <Link href="/kanban" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-rose-100 text-rose-600"><Columns3 className="h-3.5 w-3.5" /></span><span className="truncate">Task / Kanban</span></Link>
          <span className="flex w-full items-center gap-2 rounded-lg bg-orange-50 px-1.5 py-1 text-[12px] font-semibold text-orange-950 shadow-sm ring-1 ring-orange-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-orange-100 text-orange-600"><Presentation className="h-3.5 w-3.5" /></span><span className="truncate">Whiteboard</span></span>
        </div></nav>
        <div className="border-t border-slate-100 pt-3 px-1"><div className="flex w-full items-center rounded-lg p-1 gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[9px] font-bold text-white">AK</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-700">Abhay&apos;s space</span><span className="block truncate text-[9px] text-slate-400">Personal workspace</span></span></div></div>
      </aside>      {/* Whiteboard List Panel */}
      <div className={"flex h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white transition-all duration-300 overflow-hidden " + (sidebarOpen ? "w-[300px]" : "w-0 border-0")}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-100 text-orange-600"><Presentation className="h-3.5 w-3.5" /></span><div><h2 className="text-[13px] font-bold text-slate-800">Whiteboards</h2><p className="text-[10px] text-slate-400">{filtered.length} boards</p></div></div>
          <div className="flex items-center gap-1"><button type="button" onClick={createBoard} className="grid h-7 w-7 place-items-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"><Plus className="h-4 w-4" /></button><button type="button" onClick={() => setSidebarOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Collapse sidebar"><PanelLeftClose className="h-4 w-4" /></button></div>
        </div>
        <div className="px-3 py-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search boards..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12px] outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" /></div></div>
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filtered.map((b) => {
            const isActive = b.id === activeId;
            return (
              <div key={b.id} onClick={() => setActiveId(b.id)} className={"group relative flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all " + (isActive ? "ring-1 shadow-sm ring-orange-200 bg-orange-50" : "hover:bg-slate-50")}>
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                <div className="min-w-0 flex-1"><p className={"truncate text-[12px] font-semibold " + (isActive ? "text-slate-800" : "text-slate-600")}>{b.name}</p><div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-2.5 w-2.5 text-slate-300" /><p className="text-[10px] text-slate-400">{timeAgo(b.updatedAt)}</p></div></div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setCtxMenu({ id: b.id, x: e.clientX, y: e.clientY }); }} className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100"><MoreHorizontal className="h-3 w-3" /></button>
              </div>); })}
          {filtered.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-300"><Presentation className="h-6 w-6" /></span><p className="mt-3 text-[12px] font-medium text-slate-400">No boards yet</p></div>}
        </div>
      </div>      {/* Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar */}
        {active ? (
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-white z-10">
            <div className="flex items-center gap-3 min-w-0">{!sidebarOpen && <button type="button" onClick={() => setSidebarOpen(true)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Expand sidebar"><PanelLeftOpen className="h-4 w-4" /></button>}
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: active.color }} />
              <input value={active.name} onChange={(e) => renameBoard(activeId!, e.target.value)} className="border-none bg-transparent text-[14px] font-bold text-slate-800 outline-none w-[250px]" placeholder="Board name" />
            </div>
            <div className="flex items-center gap-2">
              <span className="">{saveStatus === "saved" ? "Saved" : "Saving..."}</span>
              <button type="button" onClick={() => setAiDialog(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1.5 text-[11px] font-bold text-white hover:from-violet-600 hover:to-indigo-600 transition-all"><Sparkles className="h-3 w-3" /> AI Diagram</button>
              <button type="button" onClick={exportPNG} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Download className="h-3 w-3" /> Export PNG</button>
            </div>
          </div>
        ) : null}

        {/* Excalidraw Canvas */}
        <div className="flex-1 overflow-hidden">
          {active ? (
            <div className="h-full w-full"><ExcalidrawComp excalidrawAPI={setExcalidrawAPI} onChange={handleChange} UIOptions={{ canvasActions: { export: false, loadScene: false, saveToActiveFile: false, toggleTheme: null, saveAsImage: false } }} theme="light" /></div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-orange-500"><Presentation className="h-8 w-8" /></span><h3 className="mt-4 text-[18px] font-bold text-slate-800">No board selected</h3><p className="mt-1.5 text-[13px] text-slate-400">Select a board or create a new one.</p><button type="button" onClick={createBoard} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition"><Plus className="h-4 w-4" /> New board</button></div>
          )}
        </div>
      </div>      {/* Context Menu */}
      {ctxMenu && (
        <div data-ctx style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 60 }} className="w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button type="button" onClick={() => { const b = boards.find((x) => x.id === ctxMenu.id); if (b) { const n = prompt("Rename board:", b.name); if (n !== null) renameBoard(ctxMenu.id, n); } setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">Rename</button>
          <button type="button" onClick={() => { setColorPicker(ctxMenu.id); setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Color</button>
          <div className="my-1 h-px bg-slate-100" />
          <button type="button" onClick={() => { deleteBoard(ctxMenu.id); setCtxMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">Delete</button>
        </div>
      )}

      {/* Color Picker */}
      {colorPicker && (
        <div data-color className="fixed z-50 w-[200px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Board color</p>
          <div className="grid grid-cols-4 gap-2">{WB_COLORS.map((c) => (<button key={c.value} type="button" onClick={() => setBoardColor(colorPicker, c.value)} title={c.name} className="" style={{ backgroundColor: c.value }} />))}</div>
        </div>
      )}

      {/* AI Diagram Dialog */}
      {aiDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">AI Diagram</p><h2 className="mt-1 text-lg font-bold">Generate diagram</h2><p className="mt-0.5 text-[12px] text-slate-400">Describe what you want to create</p></div><button type="button" onClick={() => setAiDialog(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-1.5">{AI_DIAGRAMS.map((d) => (<button key={d.label} type="button" onClick={() => setAiPrompt(d.prompt)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-colors">{d.label}</button>))}</div>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Create a flowchart for user registration..." rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none" />
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setAiDialog(false)} className="rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button type="button" onClick={generateAIDiagram} disabled={!aiPrompt.trim() || aiLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 disabled:opacity-50 transition-colors">{aiLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}</button></div>
          </div>
        </div>
      )}

    </main>
  );
}