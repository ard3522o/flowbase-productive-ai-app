"use client";

import { useState, useEffect, useCallback } from "react";
import { Wand2, Trash2, Eye, PanelLeftClose, PanelLeftOpen, Loader2, AlertCircle, Sparkles, X, BarChart3, Tags, TrendingUp, TrendingDown, Minus, Calendar, Search, Pin, PinOff, CheckSquare } from "lucide-react";

type SectionItem = Record<string, any>;
type Section = { id: string; type: string; title: string; items: SectionItem[] };
type Action = { id: string; label: string; icon: string; variant: string };
type SampleItem = { id: string; name: string; value: string | number; status: string; category: string; date: string; progress: number };
type AppJSON = { appName: string; description: string; icon: string; color: string; layout: string; sections: Section[]; actions: Action[]; sampleData: SampleItem[] };
type SavedApp = { id: string; userId: string; appName: string; description: string; icon: string; color: string; layout: string; sections: any; actions: any; sampleData: any; appData: any; createdAt: string; updatedAt: string };

const iconMap: Record<string, any> = { Sparkles, Wand2, BarChart3, Tags, TrendingUp, TrendingDown, Minus, CheckSquare, Calendar, Search, Pin, PinOff };
function getIcon(name: string, cls?: string) { const I = iconMap[name] || Sparkles; return <I className={cls || "h-4 w-4"} />; }
function timeAgo(d: string) { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000); if (m < 1) return "just now"; if (m < 60) return m + "m ago"; const h = Math.floor(m / 60); if (h < 24) return h + "h ago"; return Math.floor(h / 24) + "d ago"; }

/* === Section Renderers === */
function StatsSection({ section, color }: { section: Section; color: string }) {
  return (<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {section.items.map((item: any, i: number) => (
      <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: color + "18" }}>{getIcon(item.icon || "BarChart3", "h-4 w-4")}</span>
          {item.trend && <span className={"flex items-center gap-0.5 text-[10px] font-semibold " + (item.trend === "up" ? "text-emerald-500" : item.trend === "down" ? "text-rose-500" : "text-slate-400")}>{item.trend === "up" ? <TrendingUp className="h-3 w-3" /> : item.trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}</span>}
        </div>
        <p className="mt-3 text-[12px] font-medium text-slate-500">{item.label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-900">{item.value}</p>
      </div>
    ))}</div>);
}
function ListSection({ section }: { section: Section }) {
  return (<div className="space-y-2">{section.items.map((item: any, i: number) => (
    <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-slate-200 hover:shadow-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: (item.color || "#7C3AED") + "18" }}>{getIcon(item.icon || "Sparkles", "h-4 w-4")}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-slate-800">{item.title}</p>{item.subtitle && <p className="truncate text-[11px] text-slate-400">{item.subtitle}</p>}</div>
    </div>))}</div>);
}
function ChecklistSection({ section }: { section: Section }) {
  return (<div className="space-y-1.5">{section.items.map((item: any, i: number) => (
    <label key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:bg-slate-50:bg-slate-800">
      <input type="checkbox" defaultChecked={item.checked} className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
      <span className={"text-[13px] " + (item.checked ? "text-slate-400 line-through" : "text-slate-700")}>{item.label}</span>
    </label>))}</div>);
}
function ProgressSection({ section }: { section: Section }) {
  return (<div className="space-y-3">{section.items.map((item: any, i: number) => (
    <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between"><span className="text-[13px] font-medium text-slate-700">{item.label}</span><span className="text-[12px] font-bold text-slate-500">{item.value}%</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all duration-500" style={{ width: item.value + "%", backgroundColor: item.color || "#7C3AED" }} /></div>
    </div>))}</div>);
}
function TagsSection({ section }: { section: Section }) {
  return (<div className="flex flex-wrap gap-2">{section.items.map((item: any, i: number) => (
    <span key={i} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white" style={{ backgroundColor: item.color || "#7C3AED" }}>{item.label}</span>
  ))}</div>);
}
function ChartSection({ section, color }: { section: Section; color: string }) {
  const max = Math.max(...section.items.map((item: any) => item.value || 0), 1);
  return (<div className="flex items-end gap-2 h-40 rounded-xl border border-slate-100 bg-white p-4">{section.items.map((item: any, i: number) => (
    <div key={i} className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[10px] font-bold text-slate-500">{item.value}</span>
      <div className="w-full rounded-t-md transition-all duration-500" style={{ height: ((item.value || 0) / max * 100) + "%", backgroundColor: color || "#7C3AED" }} />
      <span className="text-[9px] text-slate-400 truncate max-w-full">{item.label}</span>
    </div>))}</div>);
}
function TableSection({ section }: { section: Section }) {
  return (<div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
    <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-100 bg-slate-50">
      {(section.items[0]?.columns || []).map((col: string, i: number) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-slate-600">{col}</th>)}
    </tr></thead><tbody>{section.items.slice(1).map((item: any, i: number) => (
      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50:bg-slate-800/50">
        {(item.columns || []).map((cell: string, j: number) => <td key={j} className="px-4 py-2.5 text-slate-700">{cell}</td>)}
      </tr>))}</tbody></table></div>);
}

function SectionRenderer({ section, color }: { section: Section; color: string }) {
  switch (section.type) {
    case "stats": return <StatsSection section={section} color={color} />;
    case "list": return <ListSection section={section} />;
    case "checklist": return <ChecklistSection section={section} />;
    case "progress": return <ProgressSection section={section} />;
    case "tags": return <TagsSection section={section} />;
    case "chart": return <ChartSection section={section} color={color} />;
    case "table": return <TableSection section={section} />;
    default: return <ListSection section={section} />;
  }
}
function AppPreview({ app, onClose }: { app: SavedApp; onClose: () => void }) {
  const [sections, setSections] = useState<Section[]>((app.sections || []) as Section[]);
  const [actions] = useState<Action[]>((app.actions || []) as Action[]);
  const [sampleData, setSampleData] = useState<any[]>(app.appData?.sampleData || app.sampleData || []);
  const [showSamples, setShowSamples] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const color = app.color || "#7C3AED";
  const updateSection = (idx: number, items: any[]) => { setSections((prev) => { const n = [...prev]; n[idx] = { ...n[idx], items }; return n; }); };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const toggleEdit = (id: string) => setEditMode((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleAction = async (action: Action) => {
    const label = action.label.toLowerCase();
    if (label.includes("export") || label.includes("download")) {
      const blob = new Blob([JSON.stringify({ appName: app.appName, sections, sampleData }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = (app.appName || "app") + ".json"; a.click(); URL.revokeObjectURL(url);
      showToast("Exported as JSON!");
    } else if (label.includes("save")) {
      try { await fetch("/api/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: app.id, appData: { ...app.appData, sections, sampleData } }) }); showToast("Saved to database!"); } catch { showToast("Saved locally!"); }
    } else if (label.includes("reset")) {
      setSections((app.sections || []) as Section[]); setSampleData(app.appData?.sampleData || []); showToast("Reset to defaults");
    } else { showToast(action.label + " action triggered!"); }
  };
  const removeSample = (idx: number) => { const n = [...sampleData]; n.splice(idx, 1); setSampleData(n); };
  const addSample = () => { setSampleData([...sampleData, { id: "s" + Date.now(), name: "New item", value: "", status: "active", category: "", date: new Date().toISOString().slice(0, 10), progress: 0 }]); };
  const updateSample = (idx: number, field: string, value: any) => { const n = [...sampleData]; n[idx] = { ...n[idx], [field]: value }; setSampleData(n); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-8 backdrop-blur-sm">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-2xl animate-pulse">{toast}</div>}
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl mb-10">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderBottomColor: color + "30" }}>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: color + "18", color }}>{getIcon(app.icon || "Sparkles", "h-5 w-5")}</span><div><h2 className="text-lg font-bold text-slate-900">{app.appName}</h2><p className="text-[12px] text-slate-400">{app.description}</p></div></div>
          <div className="flex items-center gap-2"><button onClick={() => handleAction({ id: "save", label: "Save", icon: "Save", variant: "primary" })} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-200 transition">Save</button><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><X className="h-4 w-4" /></button></div>
        </div>
        <div className="space-y-6 p-6">
          {sections.map((section, idx) => (<div key={section.id}><div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-800">{section.title}</h3><div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 rounded-full px-2.5 py-1">{section.type}</span><button onClick={() => toggleEdit(section.id)} className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 transition">{editMode[section.id] ? "Done" : "Edit"}</button></div></div>
            {editMode[section.id] ? (<div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-4 space-y-2">
              {section.items.map((item: any, i: number) => (<div key={i} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 group">{Object.keys(item).filter(k => k !== "id").map((key) => (<input key={key} className="flex-1 min-w-0 bg-transparent text-[12px] text-slate-700 outline-none focus:ring-1 focus:ring-violet-300 rounded px-1 border-b border-transparent focus:border-violet-300" value={String(item[key] || "")} placeholder={key} onChange={(e) => { const n = [...section.items]; n[i] = { ...n[i], [key]: e.target.value }; updateSection(idx, n); }} />))}<button onClick={() => { const n = [...section.items]; n.splice(i, 1); updateSection(idx, n); }} className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button></div>))}
              <button onClick={() => updateSection(idx, [...section.items, section.type === "checklist" ? { label: "New item", checked: false } : section.type === "stats" ? { label: "New stat", value: "0", icon: "BarChart3" } : section.type === "tags" ? { label: "New tag", color: color } : { title: "New item", subtitle: "", icon: "Sparkles", color }])} className="w-full rounded-lg border border-dashed border-violet-300 bg-white py-2 text-[11px] font-semibold text-violet-600 hover:bg-violet-50 transition">+ Add {section.type}</button></div>)
            : (<SectionRenderer section={section} color={color} />)}
          </div>))}
          <div><div className="flex items-center justify-between mb-3"><button onClick={() => setShowSamples(!showSamples)} className="flex items-center gap-2 text-[14px] font-bold text-slate-800 hover:text-violet-600 transition"><span className={"transition-transform inline-block " + (showSamples ? "rotate-90" : "")}>▶</span> Sample Data ({sampleData.length} entries)</button>{showSamples && <button onClick={addSample} className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-200 transition">+ Add Entry</button>}</div>
            {showSamples && (<div className="overflow-x-auto rounded-xl border border-slate-100 bg-white"><table className="w-full text-[12px]"><thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-4 py-2.5 text-left font-semibold text-slate-600">Name</th><th className="px-4 py-2.5 text-left font-semibold text-slate-600">Value</th><th className="px-4 py-2.5 text-left font-semibold text-slate-600">Status</th><th className="px-4 py-2.5 text-left font-semibold text-slate-600">Category</th><th className="px-4 py-2.5 text-left font-semibold text-slate-600">Date</th><th className="px-4 py-2.5 text-left font-semibold text-slate-600">Progress</th><th className="w-10"></th></tr></thead><tbody>
              {sampleData.map((item: any, i: number) => (<tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50:bg-slate-800/50 group"><td className="px-4 py-2"><input className="w-full bg-transparent text-slate-700 font-medium outline-none focus:ring-1 focus:ring-violet-300 rounded px-1" value={item.name} onChange={(e) => updateSample(i, "name", e.target.value)} /></td><td className="px-4 py-2"><input className="w-full bg-transparent text-slate-700 outline-none focus:ring-1 focus:ring-violet-300 rounded px-1" value={item.value} onChange={(e) => updateSample(i, "value", e.target.value)} /></td><td className="px-4 py-2"><select className="bg-transparent text-slate-700 outline-none rounded border border-slate-200 px-1.5 py-0.5 text-[11px]" value={item.status} onChange={(e) => updateSample(i, "status", e.target.value)}><option value="active">Active</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="archived">Archived</option></select></td>
              <td className="px-4 py-2"><input className="w-full bg-transparent text-slate-700 outline-none focus:ring-1 focus:ring-violet-300 rounded px-1" value={item.category} onChange={(e) => updateSample(i, "category", e.target.value)} /></td><td className="px-4 py-2"><input type="date" className="bg-transparent text-slate-700 outline-none rounded border border-slate-200 px-1.5 py-0.5 text-[11px]" value={item.date} onChange={(e) => updateSample(i, "date", e.target.value)} /></td><td className="px-4 py-2"><div className="flex items-center gap-2"><input type="range" min={0} max={100} className="w-16 h-1" value={item.progress} onChange={(e) => updateSample(i, "progress", parseInt(e.target.value))} /><span className="text-[10px] font-bold text-slate-500 w-8">{item.progress}%</span></div></td><td className="px-2"><button onClick={() => removeSample(i)} className="grid h-5 w-5 place-items-center rounded text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button></td></tr>))}
            </tbody></table></div>)}</div>
          {actions.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">{actions.map((action) => (<button key={action.id} onClick={() => handleAction(action)} className={"inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition " + (action.variant === "primary" ? "text-white shadow-md hover:opacity-90" : action.variant === "danger" ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200")} style={action.variant === "primary" ? { backgroundColor: color } : undefined}>{getIcon(action.icon || "Sparkles", "h-3.5 w-3.5")}{action.label}</button>))}</div>}
        </div>
      </div>
    </div>);
}export function TemplatesPage() {
  const [apps, setApps] = useState<SavedApp[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewApp, setPreviewApp] = useState<SavedApp | null>(null);
  const [sidebarApps, setSidebarApps] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const loadApps = useCallback(async () => { try { const res = await fetch("/api/templates"); if (res.ok) { const data = await res.json(); setApps(data.apps || []); } } catch {} }, []);
  useEffect(() => { loadApps(); }, [loadApps]);
  useEffect(() => { try { const saved = localStorage.getItem("template-sidebar-apps"); if (saved) setSidebarApps(JSON.parse(saved)); } catch {} }, []);
  const saveSidebarApps = (ids: string[]) => { setSidebarApps(ids); localStorage.setItem("template-sidebar-apps", JSON.stringify(ids)); };
  const handleGenerate = async () => {
    if (!prompt.trim()) return; setLoading(true); setError("");
    try {
      const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim() }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Generation failed");
      setApps((prev) => [{ ...data.app, id: data.app.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), appData: data.app, sections: data.app.sections || [], actions: data.app.actions || [], sampleData: data.app.sampleData || [], userId: "" } as SavedApp, ...prev]); setPrompt("");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const handleDelete = async (id: string) => { if (!confirm("Delete this app?")) return; try { await fetch("/api/templates?id=" + id, { method: "DELETE" }); setApps((prev) => prev.filter((a) => a.id !== id)); saveSidebarApps(sidebarApps.filter((sid) => sid !== id)); } catch {} };
  const toggleSidebar = (appId: string) => {
    if (sidebarApps.includes(appId)) { saveSidebarApps(sidebarApps.filter((id) => id !== appId)); }
    else { if (sidebarApps.length >= 3) { alert("Maximum 3 apps can be added to the sidebar."); return; } saveSidebarApps([...sidebarApps, appId]); }
  };
  const filteredApps = apps.filter((a) => a.appName.toLowerCase().includes(searchQuery.toLowerCase()) || (a.description || "").toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="flex min-h-screen bg-[#fbfcff]">
      <aside className={"sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-4 transition-[width] duration-300 " + (sidebarOpen ? "w-[240px]" : "w-[52px]")}>
        <div className={"flex items-center " + (sidebarOpen ? "justify-between" : "justify-center")}>
          {sidebarOpen && <h2 className="text-[14px] font-bold text-slate-800">Template Apps</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
        {sidebarOpen && (<><p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pinned ({sidebarApps.length}/3)</p>
          <div className="mt-2 space-y-1">
            {sidebarApps.length === 0 && <p className="text-[11px] text-slate-400 py-2">No apps pinned yet.</p>}
            {sidebarApps.map((sid) => { const app = apps.find((a) => a.id === sid); if (!app) return null; return (
              <button key={sid} onClick={() => setPreviewApp(app)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-100">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: (app.color || "#7C3AED") + "18", color: app.color || "#7C3AED" }}>{getIcon(app.icon || "Sparkles", "h-3.5 w-3.5")}</span>
                <span className="truncate text-[12px] font-medium text-slate-700">{app.appName}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleSidebar(sid); }} className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 hover:text-rose-500"><X className="h-3 w-3" /></button>
              </button>); })}
          </div></>)}</aside>
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-200"><Wand2 className="h-5 w-5" /></span>
          <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Template Builder</h1><p className="text-[13px] text-slate-400">Describe your app idea and AI will generate a complete single-page app.</p></div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-[12px] font-semibold text-slate-600">What do you want to build?</label>
          <div className="flex gap-3">
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()} placeholder="e.g. Habit tracker, Budget planner, Meal planner, Study planner..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100" disabled={loading} />
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-fuchsia-200 transition hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {loading ? "Generating..." : "Generate"}
            </button>
          </div>
          {error && <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-[12px] text-rose-600"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}
        </div>
        {loading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => (<div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-4 w-32 rounded bg-slate-100" /><div className="h-3 w-48 rounded bg-slate-100" /></div></div><div className="mt-4 space-y-2"><div className="h-3 w-full rounded bg-slate-50" /><div className="h-3 w-3/4 rounded bg-slate-50" /></div></div>))}</div>}
        {!loading && (<div className="mt-6">
          <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><h2 className="text-[15px] font-bold text-slate-800">Your Apps</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{apps.length}</span></div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><Search className="h-3.5 w-3.5 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search apps..." className="w-32 bg-transparent text-[12px] text-slate-600 outline-none placeholder:text-slate-400" /></div></div>
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-50 text-fuchsia-500"><Wand2 className="h-7 w-7" /></span><h3 className="mt-4 text-[16px] font-bold text-slate-800">No apps generated yet</h3><p className="mt-1.5 text-[13px] text-slate-400">Enter a prompt above to generate your first app.</p></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApps.map((app) => { const isInSidebar = sidebarApps.includes(app.id); return (
                <div key={app.id} className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md" style={{ borderTopColor: app.color || "#7C3AED", borderTopWidth: 3 }}>
                  <div className="flex items-start justify-between"><div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: (app.color || "#7C3AED") + "18", color: app.color || "#7C3AED" }}>{getIcon(app.icon || "Sparkles", "h-5 w-5")}</span>
                    <div><h3 className="text-[14px] font-bold text-slate-800">{app.appName}</h3><p className="mt-0.5 text-[11px] text-slate-400">{(app.description || "No description").slice(0, 60)}{(app.description || "").length > 60 ? "..." : ""}</p></div>
                  </div>
                  <div className="relative"><button onClick={() => setMenuOpen(menuOpen === app.id ? null : app.id)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"><span className="text-[16px] leading-none">...</span></button>
                    {menuOpen === app.id && (<div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                      <button onClick={() => { setPreviewApp(app); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50:bg-slate-800"><Eye className="h-3.5 w-3.5 text-slate-400" /> Preview</button>
                      <button onClick={() => { toggleSidebar(app.id); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50:bg-slate-800">{isInSidebar ? <PinOff className="h-3.5 w-3.5 text-slate-400" /> : <Pin className="h-3.5 w-3.5 text-slate-400" />} {isInSidebar ? "Unpin" : "Pin to Sidebar"}</button>
                      <button onClick={() => { handleDelete(app.id); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>)}</div></div>
                  <div className="mt-4 flex flex-wrap gap-1.5">{(app.sections || []).slice(0, 3).map((s: any, i: number) => <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{s.title || s.type}</span>)}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="flex items-center gap-1 text-[10px] text-slate-400"><Calendar className="h-3 w-3" /> {timeAgo(app.createdAt)}</span>
                    <div className="flex items-center gap-1.5"><button onClick={() => setPreviewApp(app)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"><Eye className="h-3 w-3" /> Preview</button>
                      <button onClick={() => toggleSidebar(app.id)} className={"inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition " + (isInSidebar ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{isInSidebar ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />} {isInSidebar ? "Pinned" : "Pin"}</button>
                    </div></div></div>
              ); })}
            </div>
          )}
        </div>)}
      </main>
      {previewApp && <AppPreview app={previewApp} onClose={() => setPreviewApp(null)} />}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>);
}
