"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Folder, FileText, Plus, Search, Grid3X3, List, ArrowUpDown, Star, MoreHorizontal,
  Clock, ChevronRight, Pencil, Trash2, Copy, Share2, Archive, Download, X, Menu,
  Columns3, NotebookPen, Presentation, Users, Filter, SortAsc, Hash, MessageSquare,
  Link2, Eye, ChevronDown, Check, FolderOpen, File, ArrowLeft, Tag,
} from "lucide-react";
import { LiveblocksRoom } from "@/components/liveblocks-provider";
import { ActiveUsersBar, ShareDialog, CollaborationButton } from "@/components/kanban-collaboration";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";

type Space = { id: string; name: string; description: string; color: string; favorite: boolean; archived: boolean; createdAt: number; updatedAt: number; };
type Page = { id: string; spaceId: string; name: string; template: string; favorite: boolean; archived: boolean; createdAt: number; updatedAt: number; content: string; };

const SPACE_COLORS = ["#7C3AED","#0284C7","#E11D48","#D97706","#059669","#EA580C","#C026D3","#4F46E5","#0891B2","#BE185D"];
const TEMPLATES = ["Blank Page","Project Plan","Meeting Notes","PRD","Research Notes","Task Plan"];
const TEMPLATE_COLORS: Record<string,string> = { "Blank Page":"bg-slate-100 text-slate-600", "Project Plan":"bg-violet-100 text-violet-600", "Meeting Notes":"bg-sky-100 text-sky-600", PRD:"bg-rose-100 text-rose-600", "Research Notes":"bg-amber-100 text-amber-600", "Task Plan":"bg-emerald-100 text-emerald-600" };

function createId() { return crypto.randomUUID(); }
function timeAgo(ts: number) {
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return "Just now"; if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const dy = Math.floor(h / 24); if (dy === 1) return "Yesterday"; if (dy < 7) return dy + "d ago";
  return Math.floor(dy / 7) + "w ago";
}

/* ── Tiptap Page Editor ── */
function PageEditor({ page, onUpdate }: { page: Page; onUpdate: (content: string) => void }) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Underline,
      Highlight.configure({ multicolor: true }),
    ],
    content: page.content || "",
    onUpdate: ({ editor: e }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { onUpdate(e.getHTML()); }, 500);
    },
    editorProps: { attributes: { class: "prose prose-slate prose-lg max-w-none focus:outline-none min-h-[400px]" } },
  });
  if (!editor) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {[{l:"B",a:()=>editor.chain().focus().toggleBold().run(),v:editor.isActive("bold"),c:"font-bold"},{l:"I",a:()=>editor.chain().focus().toggleItalic().run(),v:editor.isActive("italic"),c:"italic"},{l:"U",a:()=>editor.chain().focus().toggleUnderline().run(),v:editor.isActive("underline"),c:"underline"},{l:"S",a:()=>editor.chain().focus().toggleStrike().run(),v:editor.isActive("strike"),c:"line-through"},{l:"H1",a:()=>editor.chain().focus().toggleHeading({level:1}).run(),v:editor.isActive("heading",{level:1}),c:"text-[11px] font-bold"},{l:"H2",a:()=>editor.chain().focus().toggleHeading({level:2}).run(),v:editor.isActive("heading",{level:2}),c:"text-[11px] font-bold"},{l:"H3",a:()=>editor.chain().focus().toggleHeading({level:3}).run(),v:editor.isActive("heading",{level:3}),c:"text-[11px] font-bold"}].map(b=><button key={b.l} type="button" onClick={b.a} className={"grid h-7 w-7 place-items-center rounded-lg text-[12px] transition-colors "+(b.v?"bg-indigo-100 text-indigo-700":"text-slate-500 hover:bg-slate-100")+" "+b.c}>{b.l}</button>)}
        <div className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" onClick={()=>editor.chain().focus().toggleBulletList().run()} className={"grid h-7 w-7 place-items-center rounded-lg transition-colors "+(editor.isActive("bulletList")?"bg-indigo-100 text-indigo-700":"text-slate-500 hover:bg-slate-100")}>•</button>
        <button type="button" onClick={()=>editor.chain().focus().toggleOrderedList().run()} className={"grid h-7 w-7 place-items-center rounded-lg transition-colors "+(editor.isActive("orderedList")?"bg-indigo-100 text-indigo-700":"text-slate-500 hover:bg-slate-100")}>1.</button>
        <button type="button" onClick={()=>editor.chain().focus().toggleBlockquote().run()} className={"grid h-7 w-7 place-items-center rounded-lg transition-colors "+(editor.isActive("blockquote")?"bg-indigo-100 text-indigo-700":"text-slate-500 hover:bg-slate-100")}>“</button>
        <button type="button" onClick={()=>editor.chain().focus().toggleCodeBlock().run()} className={"grid h-7 w-7 place-items-center rounded-lg transition-colors "+(editor.isActive("codeBlock")?"bg-indigo-100 text-indigo-700":"text-slate-500 hover:bg-slate-100")}>&lt;/&gt;</button>
        <div className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" onClick={()=>editor.chain().focus().setHorizontalRule().run()} className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">—</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all"|"favorites"|"recent"|"archived">("all");
  const [viewMode, setViewMode] = useState<"grid"|"list">("grid");
  const [sortBy, setSortBy] = useState<"updated"|"name"|"pages"|"favorites">("updated");
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newSpace, setNewSpace] = useState({ name: "", description: "", color: SPACE_COLORS[0] });
  const [newPage, setNewPage] = useState({ name: "", spaceId: "", template: "Blank Page" });
  const [spaceMenu, setSpaceMenu] = useState<{id:string;x:number;y:number}|null>(null);
  const [pageMenu, setPageMenu] = useState<{id:string;x:number;y:number}|null>(null);
  const [renameId, setRenameId] = useState<string|null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [viewingPage, setViewingPage] = useState<Page|null>(null);

  const activeSpace = spaces.find(s => s.id === activeSpaceId) ?? null;
  const spacePages = useMemo(() => pages.filter(p => p.spaceId === activeSpaceId && !p.archived), [pages, activeSpaceId]);

  /* ── Load from API ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/spaces");
        if (res.ok) {
          const data = await res.json();
          if (data.spaces?.length) setSpaces(data.spaces);
          if (data.pages?.length) setPages(data.pages);
        }
      } catch (e) { console.error("Failed to load spaces:", e); }
    })();
  }, []);

  /* localStorage */
  useEffect(() => {
    try {
      const s = localStorage.getItem("spaces-data");
      const p = localStorage.getItem("pages-data");
      if (s) setSpaces(JSON.parse(s));
      if (p) setPages(JSON.parse(p));
    } catch {}
  }, []);
  useEffect(() => { /* sync handled below */ }, [spaces, pages]);

  /* CRUD - Spaces */
  const createSpace = () => {
    if (!newSpace.name.trim()) return;
    const s: Space = { id: createId(), name: newSpace.name.trim(), description: newSpace.description.trim(), color: newSpace.color, favorite: false, archived: false, createdAt: Date.now(), updatedAt: Date.now() };
    setSpaces(p => [s, ...p]); setNewSpace({ name: "", description: "", color: SPACE_COLORS[0] }); setShowNewSpace(false); fetch("/api/spaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, name: s.name, description: s.description, color: s.color }) }).catch(() => {});
  };
  const deleteSpace = (id: string) => { setSpaces(p => p.filter(s => s.id !== id)); setPages(p => p.filter(pg => pg.spaceId !== id)); if (activeSpaceId === id) setActiveSpaceId(null); setSpaceMenu(null); fetch("/api/spaces?id=" + id, { method: "DELETE" }).catch(() => {}); };
  const renameSpace = (id: string, name: string) => { setSpaces(p => p.map(s => s.id === id ? { ...s, name: name || "Untitled Space", updatedAt: Date.now() } : s)); setRenameId(null); fetch("/api/spaces", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: name || "Untitled Space" }) }).catch(() => {}); };
  const toggleSpaceFav = (id: string) => { setSpaces(p => p.map(s => s.id === id ? { ...s, favorite: !s.favorite, updatedAt: Date.now() } : s)); setSpaceMenu(null); };
  const toggleSpaceArchive = (id: string) => { setSpaces(p => p.map(s => s.id === id ? { ...s, archived: !s.archived, updatedAt: Date.now() } : s)); setSpaceMenu(null); };
  const setSpaceColor = (id: string, color: string) => { setSpaces(p => p.map(s => s.id === id ? { ...s, color, updatedAt: Date.now() } : s)); setSpaceMenu(null); };
  const duplicateSpace = (id: string) => { const s = spaces.find(x => x.id === id); if (!s) return; const ns = { ...s, id: createId(), name: s.name + " (copy)", createdAt: Date.now(), updatedAt: Date.now() }; setSpaces(p => [ns, ...p]); setSpaceMenu(null); };

  /* CRUD - Pages */
  const createPage = () => {
    if (!newPage.name.trim() || !newPage.spaceId) return;
    const pg: Page = { id: createId(), spaceId: newPage.spaceId, name: newPage.name.trim(), template: newPage.template, favorite: false, archived: false, createdAt: Date.now(), updatedAt: Date.now(), content: "" };
    setPages(p => [pg, ...p]); setSpaces(s => s.map(sp => sp.id === newPage.spaceId ? { ...sp, updatedAt: Date.now() } : sp));
    setNewPage({ name: "", spaceId: "", template: "Blank Page" }); setShowNewPage(false);
  };
  const deletePage = (id: string) => { setPages(p => p.filter(pg => pg.id !== id)); setPageMenu(null); fetch("/api/pages?id=" + id, { method: "DELETE" }).catch(() => {});  };
  const renamePage = (id: string, name: string) => { setPages(p => p.map(pg => pg.id === id ? { ...pg, name: name || "Untitled", updatedAt: Date.now() } : pg)); setRenameId(null); fetch("/api/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: name || "Untitled" }) }).catch(() => {}); };
  const togglePageFav = (id: string) => { setPages(p => p.map(pg => pg.id === id ? { ...pg, favorite: !pg.favorite, updatedAt: Date.now() } : pg)); setPageMenu(null); };
  const togglePageArchive = (id: string) => { setPages(p => p.map(pg => pg.id === id ? { ...pg, archived: !pg.archived, updatedAt: Date.now() } : pg)); setPageMenu(null); };
  const duplicatePage = (id: string) => { const pg = pages.find(x => x.id === id); if (!pg) return; const np = { ...pg, id: createId(), name: pg.name + " (copy)", createdAt: Date.now(), updatedAt: Date.now() }; setPages(p => [np, ...p]); setPageMenu(null); };
  const movePage = (id: string, newSpaceId: string) => { setPages(p => p.map(pg => pg.id === id ? { ...pg, spaceId: newSpaceId, updatedAt: Date.now() } : pg)); setPageMenu(null); };

  /* Auto-save page content */
  const savePageContent = useCallback((pageId: string, content: string) => {
    setPages(p => p.map(pg => pg.id === pageId ? { ...pg, content, updatedAt: Date.now() } : pg));
    fetch("/api/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pageId, content }) }).catch(() => {});
  }, []);

  /* Close menus on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-spacemenu]")) setSpaceMenu(null);
      if (!t.closest("[data-pagemenu]")) setPageMenu(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Filtered & sorted spaces */
  const filteredSpaces = useMemo(() => {
    let result = spaces.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
    if (filterTab === "favorites") result = result.filter(s => s.favorite && !s.archived);
    else if (filterTab === "recent") result = result.filter(s => !s.archived).sort((a,b) => b.updatedAt - a.updatedAt);
    else if (filterTab === "archived") result = result.filter(s => s.archived);
    else result = result.filter(s => !s.archived);
    if (sortBy === "name") result.sort((a,b) => a.name.localeCompare(b.name));
    else if (sortBy === "pages") result.sort((a,b) => pages.filter(p => p.spaceId === b.id).length - pages.filter(p => p.spaceId === a.id).length);
    else if (sortBy === "favorites") result.sort((a,b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    else result.sort((a,b) => b.updatedAt - a.updatedAt);
    return result;
  }, [spaces, pages, search, filterTab, sortBy]);

  const pageCount = (sid: string) => pages.filter(p => p.spaceId === sid && !p.archived).length;

  /* Inline rename helpers */
  const startRename = (id: string, current: string) => { setRenameId(id); setRenameVal(current); };
  const commitRename = (kind: "space"|"page", id: string) => {
    if (kind === "space") renameSpace(id, renameVal);
    else renamePage(id, renameVal);
  };

  return (
    <main className="flex min-h-screen bg-[#fbfcff] text-slate-900">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-[228px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2.5 py-3 backdrop-blur">
        <div className="flex h-9 items-center px-1"><Link href="/" className="flex min-w-0 items-center gap-2.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-300"><Menu className="h-5 w-5 text-white" /></span><span className="truncate text-[17px] font-bold tracking-tight">Flowbase</span></Link></div>
        <nav className="mt-5 flex-1"><p className="mb-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Create & think</p><div className="space-y-0.5">
          <Link href="/" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80:bg-slate-800/80 hover:text-slate-900:text-slate-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-600"><FileText className="h-3.5 w-3.5" /></span><span className="truncate">Dashboard</span></Link>
          <Link href="/notes" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80:bg-slate-800/80 hover:text-slate-900:text-slate-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-600"><NotebookPen className="h-3.5 w-3.5" /></span><span className="truncate">Notes</span></Link>
          <Link href="/kanban" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80:bg-slate-800/80 hover:text-slate-900:text-slate-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-rose-100 text-rose-600"><Columns3 className="h-3.5 w-3.5" /></span><span className="truncate">Task / Kanban</span></Link>
          <Link href="/whiteboard" className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100/80:bg-slate-800/80 hover:text-slate-900:text-slate-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-orange-100 text-orange-600"><Presentation className="h-3.5 w-3.5" /></span><span className="truncate">Whiteboard</span></Link>
          <span className="flex w-full items-center gap-2 rounded-lg bg-indigo-50 px-1.5 py-1 text-[12px] font-semibold text-indigo-950 shadow-sm ring-1 ring-indigo-100"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-indigo-100 text-indigo-600"><Folder className="h-3.5 w-3.5" /></span><span className="truncate">Pages / Spaces</span></span>
        </div></nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {activeSpace ? (
                <>
                  <button type="button" onClick={() => setActiveSpaceId(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Back to all spaces"><ArrowLeft className="h-4 w-4" /></button>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400"><button type="button" onClick={() => setActiveSpaceId(null)} className="hover:text-indigo-600 transition-colors">All Spaces</button><ChevronRight className="h-3 w-3" /><span className="text-slate-600 font-medium">{activeSpace.name}</span></div>
                    <h1 className="mt-0.5 text-[18px] font-bold text-slate-900">{activeSpace.name}</h1>
                    <LiveblocksRoom roomId={activeSpace.id} key={"collab-bar" + activeSpace.id}><div className="mt-2 flex items-center gap-3"><ActiveUsersBar /><CollaborationButton onClick={() => setShareDialogOpen(true)} onlineCount={0} /></div></LiveblocksRoom>
                  </div>
                </>
              ) : (
                <div><h1 className="text-[18px] font-bold text-slate-900">All Spaces</h1><p className="text-[12px] text-slate-400">{filteredSpaces.length} spaces</p></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spaces or pages..." className="w-[220px] rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
              {!activeSpace && <>
                <button type="button" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-colors" title="Toggle view">{viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}</button>
                <div className="relative group">
                  <button type="button" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><ArrowUpDown className="h-3.5 w-3.5" /> Sort <ChevronDown className="h-3 w-3 text-slate-400" /></button>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[{k:"updated",l:"Recently Updated"},{k:"name",l:"Name"},{k:"pages",l:"Most Pages"},{k:"favorites",l:"Favorites"}].map(s => <button key={s.k} type="button" onClick={() => setSortBy(s.k as typeof sortBy)} className={"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors " + (sortBy === s.k ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50:bg-slate-800")}>{sortBy === s.k && <Check className="h-3 w-3" />}{s.l}</button>) }
                  </div>
                </div>
              </>}
              <button type="button" onClick={() => activeSpace ? setShowNewPage(true) : setShowNewSpace(true)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"><Plus className="h-3.5 w-3.5" />{activeSpace ? "New Page" : "New Space"}</button>
            </div>
          </div>
          {!activeSpace && (
            <div className="mt-3 flex items-center gap-1">
              {(["all","favorites","recent","archived"] as const).map(tab => <button key={tab} type="button" onClick={() => setFilterTab(tab)} className={"rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors " + (filterTab === tab ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100")}>{tab === "all" ? "All Spaces" : tab === "favorites" ? "Favorites" : tab === "recent" ? "Recently Opened" : "Archived"}</button>) }
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!activeSpace ? (
            filteredSpaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-indigo-500"><Folder className="h-8 w-8" /></span>
                <h3 className="mt-4 text-[16px] font-bold text-slate-800">No spaces yet</h3>
                <p className="mt-1.5 text-[13px] text-slate-400">Create your first space to get started.</p>
                <button type="button" onClick={() => setShowNewSpace(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"><Plus className="h-4 w-4" /> New Space</button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSpaces.map(space => (
                  <div key={space.id} data-spacemenu className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer" onClick={() => setActiveSpaceId(space.id)}>
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: space.color + "18" }}><Folder className="h-5 w-5" style={{ color: space.color }} /></span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleSpaceFav(space.id); }} className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-all"><Star className={"h-3.5 w-3.5" + (space.favorite ? " fill-amber-400 text-amber-400 opacity-100" : "")} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSpaceMenu({ id: space.id, x: e.clientX, y: e.clientY }); }} className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all"><MoreHorizontal className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="mt-3">
                      {renameId === space.id ? (
                        <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)} onBlur={() => commitRename("space", space.id)} onKeyDown={e => e.key === "Enter" && commitRename("space", space.id)} onClick={e => e.stopPropagation()} className="w-full rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-[13px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200" />
                      ) : (
                        <h3 className="text-[13px] font-bold text-slate-900 truncate">{space.name}</h3>
                      )}
                      {space.description && <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{space.description}</p>}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{pageCount(space.id)} pages</span>
                      <span>{timeAgo(space.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSpaces.map(space => (
                  <div key={space.id} data-spacemenu className="group flex items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2.5 hover:border-slate-200 hover:bg-slate-50:bg-slate-800/50 transition-all cursor-pointer" onClick={() => setActiveSpaceId(space.id)}>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: space.color + "18" }}><Folder className="h-4 w-4" style={{ color: space.color }} /></span>
                    <div className="flex-1 min-w-0">
                      {renameId === space.id ? (
                        <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)} onBlur={() => commitRename("space", space.id)} onKeyDown={e => e.key === "Enter" && commitRename("space", space.id)} onClick={e => e.stopPropagation()} className="w-full rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-[13px] font-semibold text-slate-900 outline-none" />
                      ) : (
                        <span className="text-[13px] font-semibold text-slate-900 truncate block">{space.name}</span>
                      )}
                      <span className="text-[11px] text-slate-400">{pageCount(space.id)} pages · {timeAgo(space.updatedAt)}</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleSpaceFav(space.id); }} className="grid h-6 w-6 place-items-center rounded text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-all"><Star className={"h-3.5 w-3.5" + (space.favorite ? " fill-amber-400 text-amber-400 opacity-100" : "")} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSpaceMenu({ id: space.id, x: e.clientX, y: e.clientY }); }} className="grid h-6 w-6 place-items-center rounded text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )
          ) : (
            spacePages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-indigo-500"><FileText className="h-8 w-8" /></span>
                <h3 className="mt-4 text-[16px] font-bold text-slate-800">No pages in this space</h3>
                <p className="mt-1.5 text-[13px] text-slate-400">Add your first page to start writing.</p>
                <button type="button" onClick={() => setShowNewPage(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"><Plus className="h-4 w-4" /> New Page</button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_120px_80px_40px] gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Page Name</span><span>Type</span><span>Last Updated</span><span>Status</span><span></span>
                </div>
                {spacePages.map(page => (
                  <div key={page.id} data-pagemenu className="group grid grid-cols-[1fr_120px_120px_80px_40px] gap-2 items-center border-b border-slate-50 px-4 py-3 hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => setViewingPage(page)}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><FileText className="h-3.5 w-3.5" /></span>
                      {renameId === page.id ? (
                        <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)} onBlur={() => commitRename("page", page.id)} onKeyDown={e => e.key === "Enter" && commitRename("page", page.id)} onClick={e => e.stopPropagation()} className="w-full rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-[13px] font-semibold text-slate-900 outline-none" />
                      ) : (
                        <span className="text-[13px] font-semibold text-slate-900 truncate">{page.name}</span>
                      )}
                    </div>
                    <span className={"inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold " + (TEMPLATE_COLORS[page.template] || "bg-slate-100 text-slate-600")}>{page.template}</span>
                    <span className="text-[11px] text-slate-400">{timeAgo(page.updatedAt)}</span>
                    <span className="text-[11px] text-slate-400">{page.favorite ? "★ Fav" : ""}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setPageMenu({ id: page.id, x: e.clientX, y: e.clientY }); }} className="grid h-6 w-6 place-items-center rounded text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Space Context Menu */}
        {spaceMenu && (() => {
          const space = spaces.find(s => s.id === spaceMenu.id);
          if (!space) return null;
          return (
            <div data-spacemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: spaceMenu.x, top: spaceMenu.y }}>
              <button type="button" onClick={() => { startRename(space.id, space.name); setSpaceMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => toggleSpaceFav(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (space.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {space.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicateSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Color</p>
              <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
                {SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setSpaceColor(space.id, c)} className={"h-5 w-5 rounded-full ring-2 transition-all " + (space.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => toggleSpaceArchive(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {space.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deleteSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* Page Context Menu */}
        {pageMenu && (() => {
          const page = pages.find(pg => pg.id === pageMenu.id);
          if (!page) return null;
          return (
            <div data-pagemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: pageMenu.x, top: pageMenu.y }}>
              <button type="button" onClick={() => { startRename(page.id, page.name); setPageMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => togglePageFav(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (page.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {page.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicatePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to</p>
              {spaces.filter(s => s.id !== page.spaceId && !s.archived).slice(0, 5).map(s => (
                <button key={s.id} type="button" onClick={() => movePage(page.id, s.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Folder className="h-3.5 w-3.5" style={{ color: s.color }} /> {s.name}</button>
              ))}
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => togglePageArchive(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {page.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deletePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* New Space Modal */}
        {showNewSpace && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewSpace(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Space</h2><button type="button" onClick={() => setShowNewSpace(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space Name</label><input autoFocus value={newSpace.name} onChange={e => setNewSpace(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createSpace()} placeholder="e.g. Work Projects" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</label><textarea value={newSpace.description} onChange={e => setNewSpace(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Short description..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Color</label><div className="flex flex-wrap gap-2">{SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setNewSpace(p => ({ ...p, color: c }))} className={"h-8 w-8 rounded-full ring-2 transition-all " + (newSpace.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewSpace(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createSpace} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Space</button></div>
            </div>
          </div>
        )}

        {/* New Page Modal */}
        {showNewPage && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewPage(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Page</h2><button type="button" onClick={() => setShowNewPage(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Page Name</label><input autoFocus value={newPage.name} onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createPage()} placeholder="e.g. Q2 Roadmap" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space</label><select value={newPage.spaceId} onChange={e => setNewPage(p => ({ ...p, spaceId: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"><option value="">Select a space...</option>{spaces.filter(s => !s.archived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Template</label><div className="flex flex-wrap gap-2">{TEMPLATES.map(t => <button key={t} type="button" onClick={() => setNewPage(p => ({ ...p, template: t }))} className={"rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all " + (newPage.template === t ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{t}</button>)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewPage(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createPage} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Page</button></div>
            </div>
          </div>
        )}

        {/* Full Page Editor View */}
        {viewingPage && (() => {
          const vp = pages.find(p => p.id === viewingPage.id);
          if (!vp) return null;
          return (
            <div className="fixed inset-0 z-[90] bg-[#fbfcff] flex flex-col">
              {/* Page Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setViewingPage(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Back to pages"><ArrowLeft className="h-4 w-4" /></button>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400"><button type="button" onClick={() => setViewingPage(null)} className="hover:text-indigo-600 transition-colors">{activeSpace?.name}</button><ChevronRight className="h-3 w-3" /><span className="text-slate-600 font-medium">{vp.name}</span></div>
                    <input
                      autoFocus
                      value={vp.name}
                      onChange={e => setPages(p => p.map(pg => pg.id === vp.id ? { ...pg, name: e.target.value } : pg))}
                      onBlur={() => setViewingPage({ ...vp })}
                      className="mt-0.5 w-full border-none bg-transparent text-[20px] font-bold text-slate-900 outline-none placeholder:text-slate-300"
                      placeholder="Untitled"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold " + (TEMPLATE_COLORS[vp.template] || "bg-slate-100 text-slate-600")}>{vp.template}</span>
                  <span className="text-[11px] text-slate-400">Saved {timeAgo(vp.updatedAt)}</span>
                </div>
              </div>
              {/* Editor Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-6 py-8">
                  <PageEditor page={vp} onUpdate={(content) => savePageContent(vp.id, content)} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Space Context Menu */}
        {spaceMenu && (() => {
          const space = spaces.find(s => s.id === spaceMenu.id);
          if (!space) return null;
          return (
            <div data-spacemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: spaceMenu.x, top: spaceMenu.y }}>
              <button type="button" onClick={() => { startRename(space.id, space.name); setSpaceMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => toggleSpaceFav(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (space.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {space.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicateSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Color</p>
              <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
                {SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setSpaceColor(space.id, c)} className={"h-5 w-5 rounded-full ring-2 transition-all " + (space.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => toggleSpaceArchive(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {space.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deleteSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* Page Context Menu */}
        {pageMenu && (() => {
          const page = pages.find(pg => pg.id === pageMenu.id);
          if (!page) return null;
          return (
            <div data-pagemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: pageMenu.x, top: pageMenu.y }}>
              <button type="button" onClick={() => { startRename(page.id, page.name); setPageMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => togglePageFav(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (page.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {page.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicatePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to</p>
              {spaces.filter(s => s.id !== page.spaceId && !s.archived).slice(0, 5).map(s => (
                <button key={s.id} type="button" onClick={() => movePage(page.id, s.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Folder className="h-3.5 w-3.5" style={{ color: s.color }} /> {s.name}</button>
              ))}
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => togglePageArchive(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {page.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deletePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* New Space Modal */}
        {showNewSpace && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewSpace(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Space</h2><button type="button" onClick={() => setShowNewSpace(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space Name</label><input autoFocus value={newSpace.name} onChange={e => setNewSpace(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createSpace()} placeholder="e.g. Work Projects" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</label><textarea value={newSpace.description} onChange={e => setNewSpace(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Short description..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Color</label><div className="flex flex-wrap gap-2">{SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setNewSpace(p => ({ ...p, color: c }))} className={"h-8 w-8 rounded-full ring-2 transition-all " + (newSpace.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewSpace(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createSpace} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Space</button></div>
            </div>
          </div>
        )}

        {/* New Page Modal */}
        {showNewPage && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewPage(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Page</h2><button type="button" onClick={() => setShowNewPage(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Page Name</label><input autoFocus value={newPage.name} onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createPage()} placeholder="e.g. Q2 Roadmap" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space</label><select value={newPage.spaceId} onChange={e => setNewPage(p => ({ ...p, spaceId: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"><option value="">Select a space...</option>{spaces.filter(s => !s.archived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Template</label><div className="flex flex-wrap gap-2">{TEMPLATES.map(t => <button key={t} type="button" onClick={() => setNewPage(p => ({ ...p, template: t }))} className={"rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all " + (newPage.template === t ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{t}</button>)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewPage(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createPage} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Page</button></div>
            </div>
          </div>
        )}

        {/* Space Context Menu */}
        {spaceMenu && (() => {
          const space = spaces.find(s => s.id === spaceMenu.id);
          if (!space) return null;
          return (
            <div data-spacemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: spaceMenu.x, top: spaceMenu.y }}>
              <button type="button" onClick={() => { startRename(space.id, space.name); setSpaceMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => toggleSpaceFav(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (space.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {space.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicateSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Color</p>
              <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
                {SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setSpaceColor(space.id, c)} className={"h-5 w-5 rounded-full ring-2 transition-all " + (space.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => toggleSpaceArchive(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {space.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deleteSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* Page Context Menu */}
        {pageMenu && (() => {
          const page = pages.find(pg => pg.id === pageMenu.id);
          if (!page) return null;
          return (
            <div data-pagemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: pageMenu.x, top: pageMenu.y }}>
              <button type="button" onClick={() => { startRename(page.id, page.name); setPageMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => togglePageFav(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (page.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {page.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicatePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to</p>
              {spaces.filter(s => s.id !== page.spaceId && !s.archived).slice(0, 5).map(s => (
                <button key={s.id} type="button" onClick={() => movePage(page.id, s.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Folder className="h-3.5 w-3.5" style={{ color: s.color }} /> {s.name}</button>
              ))}
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => togglePageArchive(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {page.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deletePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* New Space Modal */}
        {showNewSpace && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewSpace(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Space</h2><button type="button" onClick={() => setShowNewSpace(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space Name</label><input autoFocus value={newSpace.name} onChange={e => setNewSpace(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createSpace()} placeholder="e.g. Work Projects" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</label><textarea value={newSpace.description} onChange={e => setNewSpace(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Short description..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Color</label><div className="flex flex-wrap gap-2">{SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setNewSpace(p => ({ ...p, color: c }))} className={"h-8 w-8 rounded-full ring-2 transition-all " + (newSpace.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewSpace(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createSpace} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Space</button></div>
            </div>
          </div>
        )}

        {/* New Page Modal */}
        {showNewPage && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewPage(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Page</h2><button type="button" onClick={() => setShowNewPage(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Page Name</label><input autoFocus value={newPage.name} onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createPage()} placeholder="e.g. Q2 Roadmap" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space</label><select value={newPage.spaceId} onChange={e => setNewPage(p => ({ ...p, spaceId: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"><option value="">Select a space...</option>{spaces.filter(s => !s.archived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Template</label><div className="flex flex-wrap gap-2">{TEMPLATES.map(t => <button key={t} type="button" onClick={() => setNewPage(p => ({ ...p, template: t }))} className={"rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all " + (newPage.template === t ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{t}</button>)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewPage(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createPage} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Page</button></div>
            </div>
          </div>
        )}

                {/* Space Context Menu */}
        {spaceMenu && (() => {
          const space = spaces.find(s => s.id === spaceMenu.id);
          if (!space) return null;
          return (
            <div data-spacemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: spaceMenu.x, top: spaceMenu.y }}>
              <button type="button" onClick={() => { startRename(space.id, space.name); setSpaceMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => toggleSpaceFav(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (space.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {space.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicateSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Color</p>
              <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
                {SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setSpaceColor(space.id, c)} className={"h-5 w-5 rounded-full ring-2 transition-all " + (space.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => toggleSpaceArchive(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {space.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deleteSpace(space.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* Page Context Menu */}
        {pageMenu && (() => {
          const page = pages.find(pg => pg.id === pageMenu.id);
          if (!page) return null;
          return (
            <div data-pagemenu className="fixed z-[100] w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ left: pageMenu.x, top: pageMenu.y }}>
              <button type="button" onClick={() => { startRename(page.id, page.name); setPageMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename</button>
              <button type="button" onClick={() => togglePageFav(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Star className={"h-3.5 w-3.5 " + (page.favorite ? "fill-amber-400 text-amber-400" : "text-slate-400")} /> {page.favorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" onClick={() => duplicatePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate</button>
              <div className="my-1 h-px bg-slate-100" />
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to</p>
              {spaces.filter(s => s.id !== page.spaceId && !s.archived).slice(0, 5).map(s => (
                <button key={s.id} type="button" onClick={() => movePage(page.id, s.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Folder className="h-3.5 w-3.5" style={{ color: s.color }} /> {s.name}</button>
              ))}
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" onClick={() => togglePageArchive(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50:bg-slate-800 transition-colors"><Archive className="h-3.5 w-3.5 text-slate-400" /> {page.archived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => deletePage(page.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          );
        })()}

        {/* New Space Modal */}
        {showNewSpace && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewSpace(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Space</h2><button type="button" onClick={() => setShowNewSpace(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space Name</label><input autoFocus value={newSpace.name} onChange={e => setNewSpace(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createSpace()} placeholder="e.g. Work Projects" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</label><textarea value={newSpace.description} onChange={e => setNewSpace(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Short description..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Color</label><div className="flex flex-wrap gap-2">{SPACE_COLORS.map(c => <button key={c} type="button" onClick={() => setNewSpace(p => ({ ...p, color: c }))} className={"h-8 w-8 rounded-full ring-2 transition-all " + (newSpace.color === c ? "ring-slate-900 scale-110" : "ring-transparent hover:ring-slate-300")} style={{ backgroundColor: c }} />)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewSpace(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createSpace} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Space</button></div>
            </div>
          </div>
        )}

        {/* New Page Modal */}
        {showNewPage && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewPage(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-slate-900">Create New Page</h2><button type="button" onClick={() => setShowNewPage(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 space-y-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Page Name</label><input autoFocus value={newPage.name} onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createPage()} placeholder="e.g. Q2 Roadmap" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Space</label><select value={newPage.spaceId} onChange={e => setNewPage(p => ({ ...p, spaceId: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"><option value="">Select a space...</option>{spaces.filter(s => !s.archived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Template</label><div className="flex flex-wrap gap-2">{TEMPLATES.map(t => <button key={t} type="button" onClick={() => setNewPage(p => ({ ...p, template: t }))} className={"rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all " + (newPage.template === t ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{t}</button>)}</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewPage(false)} className="rounded-lg px-4 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button><button type="button" onClick={createPage} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Page</button></div>
            </div>
          </div>
        )}

      </div>

      {/* Share Dialog */}
      <ShareDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} boardName={activeSpace?.name || "Space"} />
    </main>
  );



/* ── Tiptap Page Editor ── */
}