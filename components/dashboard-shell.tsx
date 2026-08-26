"use client";

import { useState, type ComponentType } from "react";
import { ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, Clock3, Columns3, Files, LayoutDashboard, Menu, MoreHorizontal, NotebookPen, PanelLeftClose, PanelLeftOpen, Plus, Presentation, Search, Settings, Sparkles, UsersRound, Wand2 } from "lucide-react";

type NavigationItem = { label: string; icon: ComponentType<{ className?: string }>; iconClass: string; active?: boolean };

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  { label: "Plan & track", items: [
    { label: "Dashboard", icon: LayoutDashboard, iconClass: "bg-violet-100 text-violet-600", active: true },
    { label: "AI Assistant", icon: Sparkles, iconClass: "bg-amber-100 text-amber-600" },
    { label: "Calendar", icon: CalendarDays, iconClass: "bg-sky-100 text-sky-600" },
    { label: "Task / Kanban", icon: Columns3, iconClass: "bg-rose-100 text-rose-600" },
  ] },
  { label: "Create & think", items: [
    { label: "Notes", icon: NotebookPen, iconClass: "bg-emerald-100 text-emerald-600" },
    { label: "Whiteboard", icon: Presentation, iconClass: "bg-orange-100 text-orange-600" },
    { label: "Pages / Spaces", icon: Files, iconClass: "bg-indigo-100 text-indigo-600" },
    { label: "AI Template Builder", icon: Wand2, iconClass: "bg-fuchsia-100 text-fuchsia-600" },
  ] },
  { label: "Manage", items: [{ label: "Settings", icon: Settings, iconClass: "bg-slate-100 text-slate-600" }] },
];

function NavItem({ item, collapsed }: { item: NavigationItem; collapsed: boolean }) {
  const Icon = item.icon;
  return <button type="button" title={collapsed ? item.label : undefined} className={`group flex w-full items-center rounded-lg px-1.5 py-1 text-left text-[12px] font-medium transition-colors ${item.active ? "bg-violet-50 text-violet-950 shadow-sm ring-1 ring-violet-100" : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"} ${collapsed ? "justify-center" : "gap-2"}`}>
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${item.iconClass}`}><Icon className="h-3.5 w-3.5" /></span>
    {!collapsed && <span className="truncate">{item.label}</span>}
  </button>;
}

export function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false);
  const stats = [
    { label: "Focus time", value: "2h 40m", detail: "+32 min from yesterday", icon: Clock3, tone: "bg-violet-100 text-violet-600" },
    { label: "Tasks done", value: "8 / 12", detail: "Great momentum", icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-600" },
    { label: "Meetings", value: "3", detail: "Next at 11:30 AM", icon: UsersRound, tone: "bg-sky-100 text-sky-600" },
    { label: "Ideas captured", value: "14", detail: "Across 4 spaces", icon: Sparkles, tone: "bg-amber-100 text-amber-600" },
  ];

  return <main className="flex min-h-screen bg-[#fbfcff] text-slate-900">
    <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2.5 py-3 backdrop-blur transition-[width] duration-300 ${collapsed ? "w-[68px]" : "w-[228px]"}`}>
      <div className={`flex h-9 items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
        <div className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200"><Menu className="h-4 w-4 text-white" /></span>{!collapsed && <span className="truncate text-[15px] font-bold tracking-tight">Nestwork</span>}</div>
        {!collapsed && <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><PanelLeftClose className="h-4 w-4" /></button>}
      </div>
      {collapsed && <button type="button" onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="mt-3 grid h-8 w-full place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><PanelLeftOpen className="h-4 w-4" /></button>}
      <nav className="mt-5 flex flex-1 flex-col gap-4" aria-label="Main navigation">
        {navigationGroups.map((group) => <section key={group.label} className="w-full">{!collapsed && <p className="mb-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>}<div className="space-y-0.5">{group.items.map((item) => <NavItem key={item.label} item={item} collapsed={collapsed} />)}</div></section>)}
      </nav>
      <div className={`border-t border-slate-100 pt-3 ${collapsed ? "" : "px-1"}`}>
        {!collapsed && <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Your space</p>}
        <button type="button" title={collapsed ? "Personal workspace" : undefined} className={`flex w-full items-center rounded-lg p-1 text-left transition hover:bg-slate-100 ${collapsed ? "justify-center" : "gap-2"}`}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[9px] font-bold text-white">AK</span>{!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-700">Abhay&apos;s space</span><span className="block truncate text-[9px] text-slate-400">Personal workspace</span></span>}{!collapsed && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}</button>
      </div>
    </aside>

    <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4"><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-400 shadow-sm sm:flex"><Search className="h-3.5 w-3.5" /><span>Search anything...</span><kbd className="ml-6 rounded border border-slate-200 px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div><div className="ml-auto flex items-center gap-2"><button type="button" aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-violet-600"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></button><button type="button" className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-[12px] font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">New</span></button></div></header>
      <div className="mx-auto mt-10 max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-[12px] font-semibold text-violet-600">TUESDAY, 26 AUGUST</p><h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-900 sm:text-4xl">Good morning, Abhay <span aria-hidden="true">✦</span></h1><p className="mt-2 text-sm text-slate-500">A calm overview for a focused day.</p></div><button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm hover:border-violet-200 hover:text-violet-700"><CalendarDays className="h-3.5 w-3.5 text-violet-500" />This week<ChevronDown className="h-3.5 w-3.5 text-slate-400" /></button></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.3)]"><div className="flex items-start justify-between"><span className={`grid h-8 w-8 place-items-center rounded-xl ${stat.tone}`}><Icon className="h-4 w-4" /></span><MoreHorizontal className="h-4 w-4 text-slate-300" /></div><p className="mt-5 text-[12px] font-medium text-slate-500">{stat.label}</p><p className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{stat.value}</p><p className="mt-1 text-[11px] text-slate-400">{stat.detail}</p></article>; })}</div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.3)]"><div className="flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-slate-800">Keep moving</h2><p className="mt-1 text-[12px] text-slate-400">Your priority tasks for today</p></div><button type="button" className="text-[12px] font-semibold text-violet-600 hover:text-violet-700">View board</button></div><div className="mt-5 space-y-2.5">{["Outline the product dashboard", "Review onboarding flow", "Collect whiteboard feedback"].map((task, index) => <div key={task} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 transition hover:border-violet-100 hover:bg-violet-50/40"><span className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? "bg-violet-500" : index === 1 ? "bg-amber-400" : "bg-sky-400"}`} /><span className="flex-1 text-[13px] font-medium text-slate-700">{task}</span><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400">{index === 0 ? "Today" : index === 1 ? "11:30 AM" : "Tomorrow"}</span></div>)}</div></article>
          <article className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-[0_14px_30px_-16px_rgba(79,70,229,0.75)]"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-100"><Sparkles className="h-3 w-3" /> AI workspace</span><h2 className="mt-5 max-w-xs text-xl font-bold tracking-tight">Turn your loose ideas into an action plan.</h2><p className="mt-2 max-w-sm text-[12px] leading-5 text-violet-100">Start with a note, a prompt, or a blank whiteboard. We&apos;ll help connect the dots.</p><button type="button" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] font-bold text-violet-700 transition hover:bg-violet-50">Try AI Assistant <ArrowUpRight className="h-3.5 w-3.5" /></button></article>
        </div>
      </div>
    </section>
  </main>;
}
