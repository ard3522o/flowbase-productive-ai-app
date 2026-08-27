"use client";

import Link from "next/link";
import { useMemo, useState, type DragEvent } from "react";
import { BellRing, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, GripVertical, LayoutDashboard, ListPlus, Menu, Plus, Sparkles, X } from "lucide-react";

type Category = "Work" | "Personal" | "Study" | "Health";
type ItemKind = "Task" | "Reminder";
type CalendarItem = { id: string; title: string; date?: string; category: Category; kind: ItemKind; time?: string };

const categoryStyles: Record<Category, { chip: string; dot: string }> = {
  Work: { chip: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  Personal: { chip: "border-sky-200 bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  Study: { chip: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Health: { chip: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};
const kindStyles: Record<ItemKind, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  Task: { label: "Task", icon: CheckCircle2, tone: "text-violet-600" },
  Reminder: { label: "Reminder", icon: BellRing, tone: "text-rose-500" },
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [items, setItems] = useState<CalendarItem[]>(() => {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    return [
      { id: "1", title: "Design sync", date: dateKey(today), category: "Work", kind: "Reminder", time: "10:30" },
      { id: "2", title: "Plan weekly sprint", date: dateKey(today), category: "Work", kind: "Task" },
      { id: "3", title: "Review course notes", date: dateKey(tomorrow), category: "Study", kind: "Task" },
      { id: "4", title: "Outline launch notes", category: "Work", kind: "Task" },
      { id: "5", title: "Book a dentist checkup", category: "Health", kind: "Reminder" },
    ];
  });
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; date: string; category: Category; kind: ItemKind; time: string }>({ title: "", date: dateKey(new Date()), category: "Work", kind: "Task", time: "" });

  const visibleDays = useMemo(() => {
    if (view === "week") {
      const first = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, index) => { const date = new Date(first); date.setDate(first.getDate() + index); return date; });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(gridStart); date.setDate(gridStart.getDate() + index); return date; });
  }, [cursor, view]);

  const title = view === "month"
    ? cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : `${visibleDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${visibleDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const openComposer = (date = selectedDate) => {
    setSelectedDate(date);
    setForm({ title: "", date, category: "Work", kind: "Task", time: "" });
    setDialogOpen(true);
  };

  const saveItem = () => {
    if (!form.title.trim()) return;
    setItems((current) => [...current, { id: crypto.randomUUID(), title: form.title.trim(), date: form.date || undefined, category: form.category, kind: form.kind, time: form.time || undefined }]);
    setDialogOpen(false);
  };

  const moveItem = (id: string, date?: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, date } : item));
  const beginDrag = (event: DragEvent<HTMLButtonElement>, id: string) => {
    setDraggedId(id);
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  };
  const dropOnDate = (event: DragEvent<HTMLElement>, date?: string) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggedId;
    if (id) moveItem(id, date);
    setDraggedId(null);
  };
  const navigate = (offset: number) => setCursor((current) => {
    const next = new Date(current);
    view === "month" ? next.setMonth(next.getMonth() + offset) : next.setDate(next.getDate() + offset * 7);
    return next;
  });

  return <main className="flex min-h-screen bg-[#fbfcff] text-slate-900">
    <aside className="sticky top-0 hidden h-screen w-[210px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-3 py-4 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-1"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200"><Menu className="h-4 w-4 text-white" /></span><span className="text-[15px] font-bold tracking-tight">Nestwork</span></Link>
      <p className="mt-8 px-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Plan &amp; track</p>
      <nav className="mt-2 space-y-1" aria-label="Calendar navigation"><Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100"><span className="grid h-6 w-6 place-items-center rounded-md bg-violet-100 text-violet-600"><LayoutDashboard className="h-3.5 w-3.5" /></span>Dashboard</Link><span className="flex items-center gap-2 rounded-lg bg-violet-50 px-2 py-2 text-[12px] font-semibold text-violet-950 ring-1 ring-violet-100"><span className="grid h-6 w-6 place-items-center rounded-md bg-sky-100 text-sky-600"><CalendarDays className="h-3.5 w-3.5" /></span>Calendar</span></nav>
      <div className="mt-auto rounded-xl border border-violet-100 bg-violet-50/70 p-3"><p className="text-[11px] font-bold text-violet-800">Plan with ease</p><p className="mt-1 text-[10px] leading-4 text-violet-600">Drag tasks between days to keep your week flexible.</p></div>
    </aside>
    <div className="min-w-0 flex-1"><div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3"><Link href="/" className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200"><Sparkles className="h-4 w-4 text-white" /></Link><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Plan & track</p><h1 className="text-lg font-bold tracking-tight">Calendar</h1></div></div>
        <div className="flex items-center gap-2"><Link href="/" className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:text-violet-700 sm:flex"><LayoutDashboard className="h-3.5 w-3.5" /> Dashboard</Link><button type="button" onClick={() => openComposer()} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[12px] font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"><Plus className="h-3.5 w-3.5" /> Add task</button></div>
      </header>

      <div className="mt-5 grid gap-5 min-[1250px]:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button type="button" onClick={() => navigate(-1)} aria-label="Previous period" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setCursor(new Date())} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Today</button><button type="button" onClick={() => navigate(1)} aria-label="Next period" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button><h2 className="ml-1 text-[15px] font-bold text-slate-800 sm:text-lg">{title}</h2></div><div className="flex rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setView("month")} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${view === "month" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>Month</button><button type="button" onClick={() => setView("week")} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${view === "week" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>Week</button></div></div>
          <div className="mt-5 overflow-x-auto"><div className="min-w-[650px]"><div className="grid grid-cols-7 border-b border-slate-200">{weekdays.map((day) => <div key={day} className="px-2 pb-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{day}</div>)}</div><div className={`grid grid-cols-7 ${view === "month" ? "grid-rows-6" : "grid-rows-1"}`}>
            {visibleDays.map((day) => {
              const key = dateKey(day); const dayItems = items.filter((item) => item.date === key); const inMonth = day.getMonth() === cursor.getMonth(); const isToday = key === dateKey(new Date());
              return <div key={key} onClick={() => { setSelectedDate(key); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => dropOnDate(event, key)} className={`group min-h-[112px] border-b border-r border-slate-100 p-1.5 transition hover:bg-violet-50/40 ${!inMonth && view === "month" ? "bg-slate-50/60" : ""}`}>
                <div className="flex items-center justify-between"><span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${isToday ? "bg-violet-600 text-white" : inMonth || view === "week" ? "text-slate-600" : "text-slate-300"}`}>{day.getDate()}</span><button type="button" aria-label={`Add item on ${key}`} onClick={(event) => { event.stopPropagation(); openComposer(key); }} className="grid h-5 w-5 place-items-center rounded-md text-slate-300 opacity-0 hover:bg-violet-100 hover:text-violet-600 group-hover:opacity-100"><Plus className="h-3 w-3" /></button></div>
                <div className="mt-1 space-y-1">{dayItems.slice(0, view === "month" ? 3 : 7).map((item) => { const KindIcon = kindStyles[item.kind].icon; return <button type="button" draggable onDragStart={(event) => beginDrag(event, item.id)} onDragEnd={() => setDraggedId(null)} key={item.id} title={`Drag ${item.kind.toLowerCase()} to reschedule`} className={`flex w-full cursor-grab items-center gap-1 rounded-md border px-1.5 py-1 text-left text-[10px] font-semibold active:cursor-grabbing ${categoryStyles[item.category].chip}`}><KindIcon className={`h-3 w-3 shrink-0 ${kindStyles[item.kind].tone}`} aria-label={kindStyles[item.kind].label} /><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryStyles[item.category].dot}`} />{item.time && <span className="shrink-0 opacity-70">{item.time}</span>}<span className="truncate">{item.title}</span></button>; })}{dayItems.length > (view === "month" ? 3 : 7) && <p className="px-1 text-[10px] font-medium text-slate-400">+{dayItems.length - 3} more</p>}</div>
              </div>;
            })}
          </div></div></div>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-500">{(Object.keys(categoryStyles) as Category[]).map((category) => <span key={category} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${categoryStyles[category].dot}`} />{category}</span>)}<span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-violet-600" />Task</span><span className="inline-flex items-center gap-1"><BellRing className="h-3 w-3 text-rose-500" />Reminder</span><span className="ml-auto inline-flex items-center gap-1.5 text-slate-400"><GripVertical className="h-3 w-3" /> Drag tasks to reschedule</span></div>
        </section>

        <aside onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => dropOnDate(event)} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] min-[1250px]:sticky min-[1250px]:top-4 min-[1250px]:h-fit"><div className="flex items-start justify-between"><div><span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-600"><ListPlus className="h-4 w-4" /></span><h2 className="mt-3 text-[15px] font-bold">Draft tasks</h2><p className="mt-1 text-[11px] leading-4 text-slate-400">Keep ideas here until you&apos;re ready to schedule them.</p></div><button type="button" onClick={() => { setForm({ title: "", date: "", category: "Work", kind: "Task", time: "" }); setDialogOpen(true); }} className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100"><Plus className="h-4 w-4" /></button></div><div className="mt-5 space-y-2">{items.filter((item) => !item.date).map((item) => { const KindIcon = kindStyles[item.kind].icon; return <button type="button" draggable onDragStart={(event) => beginDrag(event, item.id)} onDragEnd={() => setDraggedId(null)} key={item.id} className="flex w-full cursor-grab items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50 active:cursor-grabbing"><GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" /><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-slate-700">{item.title}</span><span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400"><KindIcon className={`h-3 w-3 ${kindStyles[item.kind].tone}`} /><span className={`h-1.5 w-1.5 rounded-full ${categoryStyles[item.category].dot}`} />{item.category} · {item.kind}</span></span></button>; })}</div><div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/60 p-3 text-center text-[11px] leading-4 text-violet-700">Drag a draft onto any date to schedule it.</div></aside>
      </div>
    </div></div>

    {dialogOpen && <div role="dialog" aria-modal="true" aria-label="Create calendar item" className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Quick add</p><h2 className="mt-1 text-lg font-bold">New task or reminder</h2></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Close dialog" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Title</span><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") saveItem(); }} placeholder="What needs your attention?" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Type</span><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as ItemKind })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] outline-none focus:border-violet-300"><option>Task</option><option>Reminder</option></select></label><label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })} className={`w-full rounded-xl border px-3 py-2.5 text-[12px] font-semibold outline-none ${categoryStyles[form.category].chip}`}>{(Object.keys(categoryStyles) as Category[]).map((category) => <option key={category}>{category}</option>)}</select></label></div><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Date <span className="font-normal text-slate-400">(optional)</span></span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-violet-300" /></label><label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Time <span className="font-normal text-slate-400">(optional)</span></span><input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] outline-none focus:border-violet-300" /></label></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button type="button" onClick={saveItem} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-violet-700"><CalendarDays className="h-3.5 w-3.5" /> Save {form.date ? "to calendar" : "as draft"}</button></div></div></div>}
  </main>;
}
