"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User, CreditCard, Palette, Sparkles, Bell, Settings2, Shield, Download,
  Check, ChevronRight, Plus, Trash2, Pencil, X, Save, Moon, Sun, Monitor,
  CalendarDays, Flag, FileText, Clock, Mail, Smartphone, AlertTriangle,
  Laptop, Globe, Key, Eye, EyeOff, Zap, MessageSquare, Wand2, ListTodo,
  Star, LogOut, Camera, RefreshCw
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

type Section = "profile" | "subscription" | "categories" | "ai" | "preferences" | "notifications" | "privacy";
type Category = { id: string; name: string; color: string; icon: string; context: string };
type Settings = {
  id?: string; userId?: string;
  displayName?: string; avatarUrl?: string;
  plan?: string; planStatus?: string; planRenewal?: string;
  categories?: Category[];
  aiModel?: string; aiTone?: string;
  aiFeatures?: { refine: boolean; assistant: boolean; templateBuilder: boolean };
  theme?: string;
  notifications?: { email: boolean; push: boolean; taskReminders: boolean; calendarAlerts: boolean };
  defaultCalendarView?: string; defaultTaskPriority?: string;
  autoSave?: boolean; dataExport?: boolean;
};

const COLORS = ["#7C3AED","#2563EB","#059669","#DC2626","#D97706","#EC4899","#0891B2","#4F46E5","#EA580C","#16A34A"];
const ICONS = ["CalendarDays","Flag","FileText","Clock","Star","ListTodo","Zap","Globe","Bell","BookOpen"];
const ICON_MAP: Record<string, any> = { CalendarDays, Flag, FileText, Clock, Star, ListTodo, Zap, Globe, Bell, BookOpen: FileText };

const sidebarItems: { label: string; icon: any; section: Section; color: string }[] = [
  { label: "Profile", icon: User, section: "profile", color: "bg-violet-100 text-violet-600" },
  { label: "Subscription", icon: CreditCard, section: "subscription", color: "bg-sky-100 text-sky-600" },
  { label: "Categories", icon: Palette, section: "categories", color: "bg-amber-100 text-amber-600" },
  { label: "AI Settings", icon: Sparkles, section: "ai", color: "bg-fuchsia-100 text-fuchsia-600" },
  { label: "Preferences", icon: Settings2, section: "preferences", color: "bg-emerald-100 text-emerald-600" },
  { label: "Notifications", icon: Bell, section: "notifications", color: "bg-rose-100 text-rose-600" },
  { label: "Privacy & Security", icon: Shield, section: "privacy", color: "bg-slate-100 text-slate-600" },
];

export function SettingsPage() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  
  const [toast, setToast] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [newCatContext, setNewCatContext] = useState("kanban");
  const [showNewCat, setShowNewCat] = useState(false);
  

  useEffect(() => {
    const cached = localStorage.getItem("nestwork-settings");
    if (cached) { try { setSettings(JSON.parse(cached)); setLoading(false); } catch {} }
    fetch("/api/settings").then(r => r.json()).then(data => {
      setSettings(data);
      localStorage.setItem("nestwork-settings", JSON.stringify(data));
      setLoading(false);
    }).catch(() => { if (!cached) setLoading(false); });
  }, []);

  const save = useCallback(async (patch: Partial<Settings>) => {
    setToast("");
    setSettings(prev => {
      const merged = { ...prev, ...patch };
      localStorage.setItem("nestwork-settings", JSON.stringify(merged));
      fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
        .then(r => r.json()).then(d => localStorage.setItem("nestwork-settings", JSON.stringify(d))).catch(() => {});
      return merged;
    });
    setToast("Saved!");
    setTimeout(() => setToast(""), 2000);
  }, []);

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const cat: Category = { id: crypto.randomUUID(), name: newCatName.trim(), color: newCatColor, icon: ICONS[0], context: newCatContext };
    save({ categories: [...(settings.categories || []), cat] });
    setNewCatName(""); setNewCatColor(COLORS[0]); setShowNewCat(false);
  };

  const updateCategory = (id: string, patch: Partial<Category>) => {
    const updated = (settings.categories || []).map(c => c.id === id ? { ...c, ...patch } : c);
    save({ categories: updated });
  };

  const deleteCategory = (id: string) => {
    save({ categories: (settings.categories || []).filter(c => c.id !== id) });
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbfcff]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        <span className="text-[13px] text-slate-400">Loading settings...</span>
      </div>
    </div>
  );

  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User" : "User";
  const email = user?.emailAddresses?.[0]?.emailAddress || "user@example.com";

  return (
    <div className="flex min-h-screen bg-[#fbfcff] text-slate-900 transition-colors">
      {toast && (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-xl bg-emerald-500 px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
      <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-4 transition-colors">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200">
              <Settings2 className="h-4 w-4 text-white" />
            </span>
            <div>
              <span className="block text-[15px] font-bold tracking-tight">Settings</span>
              <span className="block text-[9px] text-slate-400">Manage your preferences</span>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.section;
            return (
              <button key={item.section} type="button" onClick={() => setActiveSection(item.section)}
                className={"group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-medium transition-all " + (active ? "bg-violet-50 text-violet-900 shadow-sm ring-1 ring-violet-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")}>
                <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-lg " + item.color}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                <ChevronRight className={"h-3 w-3 transition-transform " + (active ? "rotate-90 text-violet-400" : "text-slate-300")} />
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 px-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[10px] font-bold text-white">
              {fullName.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-700">{settings.displayName || fullName}</p>
              <p className="truncate text-[9px] text-slate-400">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-3xl">
          {/* -- Profile Section -- */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">Profile</h1><p className="mt-1 text-[13px] text-slate-400">Manage your account details and preferences.</p></div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-200">
                      {(settings.displayName || fullName).split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </span>
                    <button type="button" className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-violet-600 text-white shadow hover:bg-violet-700"><Camera className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input value={nameInput} onChange={e => setNameInput(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[14px] font-semibold focus:border-violet-400 focus:outline-none" autoFocus />
                        <button type="button" onClick={() => { save({ displayName: nameInput }); setEditingName(false); }} className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200"><Check className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => setEditingName(false)} className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-[18px] font-bold">{settings.displayName || fullName}</h3>
                        <button type="button" onClick={() => { setNameInput(settings.displayName || fullName); setEditingName(true); }} className="grid h-6 w-6 place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500"><Pencil className="h-3 w-3" /></button>
                      </div>
                    )}
                    <p className="mt-0.5 text-[13px] text-slate-400">{email}</p>
                    <p className="mt-1 text-[11px] text-slate-300">Member since {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-[14px] font-semibold text-slate-800">Account Actions</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:border-violet-100 hover:bg-violet-50/40"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-600"><Key className="h-4 w-4" /></span><div><p className="text-[12px] font-semibold">Change Password</p><p className="text-[10px] text-slate-400">Update your password</p></div></button>
                  <button type="button" className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:border-violet-100 hover:bg-violet-50/40"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><Mail className="h-4 w-4" /></span><div><p className="text-[12px] font-semibold">Update Email</p><p className="text-[10px] text-slate-400">Change your email address</p></div></button>
                  <button type="button" className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:border-rose-100 hover:bg-rose-50/40"><span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-600"><LogOut className="h-4 w-4" /></span><div><p className="text-[12px] font-semibold text-rose-600">Sign Out</p><p className="text-[10px] text-slate-400">Sign out of your account</p></div></button>
                  <button type="button" className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:border-rose-100 hover:bg-rose-50/40"><span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-600"><Trash2 className="h-4 w-4" /></span><div><p className="text-[12px] font-semibold text-rose-600">Delete Account</p><p className="text-[10px] text-slate-400">Permanently delete your account</p></div></button>
                </div>
              </div>
            </div>
          )}

          {/* -- Subscription Section -- */}
          {activeSection === "subscription" && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">Subscription</h1><p className="mt-1 text-[13px] text-slate-400">Manage your plan and billing.</p></div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700">{(settings.plan || "free").toUpperCase()}</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">{(settings.planStatus || "active").toLowerCase()}</span>
                    </div>
                    <p className="mt-3 text-[14px] font-semibold text-slate-800">Free Plan</p>
                    <p className="mt-1 text-[12px] text-slate-400">Basic features for getting started.</p>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-600"><CreditCard className="h-6 w-6" /></span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-[10px] font-semibold text-slate-400">Boards</p><p className="text-[18px] font-bold text-slate-800">Unlimited</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-[10px] font-semibold text-slate-400">Notes</p><p className="text-[18px] font-bold text-slate-800">Unlimited</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-[10px] font-semibold text-slate-400">AI Credits</p><p className="text-[18px] font-bold text-slate-800">50/mo</p></div>
                </div>
                <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"><Zap className="h-4 w-4" /> Upgrade Plan</button>
              </div>
            </div>
          )}

          {/* -- Categories Section -- */}
          {activeSection === "categories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold tracking-tight">Categories</h1><p className="mt-1 text-[13px] text-slate-400">Create and manage categories for calendar, tasks, notes, and reminders.</p></div>
                <button type="button" onClick={() => setShowNewCat(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"><Plus className="h-3.5 w-3.5" /> New Category</button>
              </div>
              {showNewCat && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold">New Category</h3><button type="button" onClick={() => setShowNewCat(false)} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] focus:border-violet-400 focus:outline-none" />
                    <select value={newCatContext} onChange={e => setNewCatContext(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] focus:border-violet-400 focus:outline-none">
                      <option value="kanban">Kanban / Tasks</option><option value="calendar">Calendar</option><option value="notes">Notes</option><option value="reminders">Reminders</option>
                    </select>
                  </div>
                  <div className="mt-3 flex gap-2">{COLORS.map(c => <button key={c} type="button" className="h-6 w-6 rounded-full ring-2 ring-white transition hover:scale-110" style={{ backgroundColor: c, outline: newCatColor === c ? "2px solid " + c + "" : "none", outlineOffset: "2px" }} onClick={() => setNewCatColor(c)} />)}</div>
                  <button type="button" onClick={addCategory} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-violet-700">Create</button>
                </div>
              )}
              <div className="space-y-2">
                {(settings.categories || []).length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><Palette className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-[13px] text-slate-400">No categories yet. Create your first one!</p></div>}
                {(settings.categories || []).map(cat => {
                  const CatIcon = ICON_MAP[cat.icon] || FileText;
                  return (
                    <div key={cat.id} className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-slate-200 hover:shadow-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: cat.color + "20" }}><CatIcon className="h-4 w-4" style={{ color: cat.color }} /></span>
                      <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-slate-800 truncate">{cat.name}</p><p className="text-[10px] text-slate-400 capitalize">{cat.context}</p></div>
                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button type="button" onClick={() => setShowColorPicker(showColorPicker === cat.id ? null : cat.id)} className="grid h-6 w-6 place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500"><Palette className="h-3 w-3" /></button>
                        <button type="button" onClick={() => deleteCategory(cat.id)} className="grid h-6 w-6 place-items-center rounded-md text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                      </div>
                      {showColorPicker === cat.id && (
                        <div className="absolute right-4 top-12 z-10 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                          <div className="flex gap-1.5">{COLORS.map(c => <button key={c} type="button" onClick={() => { updateCategory(cat.id, { color: c }); setShowColorPicker(null); }} className="h-6 w-6 rounded-full ring-2 transition hover:scale-110" style={{ backgroundColor: c, outline: cat.color === c ? "2px solid " + c : "none", outlineOffset: "2px" }} />)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* -- AI Settings Section -- */}
          {activeSection === "ai" && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">AI Settings</h1><p className="mt-1 text-[13px] text-slate-400">Configure your preferred AI model and behavior.</p></div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                <div><label className="text-[12px] font-semibold text-slate-600">AI Model</label>
                  <select value={settings.aiModel || "gemini-2.5-flash"} onChange={e => save({ aiModel: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] focus:border-violet-400 focus:outline-none">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option><option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</option><option value="gpt-4o">GPT-4o (OpenAI)</option><option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                  </select>
                </div>
                <div><label className="text-[12px] font-semibold text-slate-600">Response Tone</label>
                  <div className="mt-2 flex flex-wrap gap-2">{["professional","casual","concise","detailed","creative"].map(tone => (
                    <button key={tone} type="button" onClick={() => save({ aiTone: tone })}
                      className={"rounded-lg px-3 py-1.5 text-[12px] font-medium transition " + (settings.aiTone === tone ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-[14px] font-semibold text-slate-800">AI Features</h3>
                {[
                  { key: "refine" as const, label: "AI Refine", desc: "Improve grammar, rephrase, and polish text", icon: Wand2, color: "bg-amber-100 text-amber-600" },
                  { key: "assistant" as const, label: "AI Assistant", desc: "Get help with planning and writing", icon: Sparkles, color: "bg-violet-100 text-violet-600" },
                  { key: "templateBuilder" as const, label: "AI Template Builder", desc: "Generate mini apps from prompts", icon: Zap, color: "bg-fuchsia-100 text-fuchsia-600" },
                ].map(feat => {
                  const enabled = settings.aiFeatures?.[feat.key] !== false;
                  const FeatIcon = feat.icon;
                  return (
                    <div key={feat.key} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className={"grid h-9 w-9 place-items-center rounded-lg " + feat.color}><FeatIcon className="h-4 w-4" /></span>
                        <div><p className="text-[13px] font-semibold text-slate-800">{feat.label}</p><p className="text-[10px] text-slate-400">{feat.desc}</p></div>
                      </div>
                      <button type="button" onClick={() => save({ aiFeatures: { refine: settings.aiFeatures?.refine !== false, assistant: settings.aiFeatures?.assistant !== false, templateBuilder: settings.aiFeatures?.templateBuilder !== false, [feat.key]: !enabled } as any })}
                        className={"relative h-6 w-11 rounded-full transition-colors " + (enabled ? "bg-violet-600" : "bg-slate-200")}>
                        <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " + (enabled ? "left-[22px]" : "left-0.5")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* -- Preferences Section -- */}
          {activeSection === "preferences" && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">Preferences</h1><p className="mt-1 text-[13px] text-slate-400">Customize your app experience.</p></div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                <div><label className="text-[12px] font-semibold text-slate-600">Theme</label>
                  <div className="mt-2 flex gap-2">{[
                    { value: "light", label: "Light", icon: Sun, tone: "bg-amber-100 text-amber-600" },
                    { value: "dark", label: "Dark", icon: Moon, tone: "bg-indigo-100 text-indigo-600" },
                    { value: "system", label: "System", icon: Monitor, tone: "bg-slate-100 text-slate-600" },
                  ].map(t => {
                    const TIcon = t.icon;
                    return (
                    <button key={t.value} type="button" onClick={() => save({ theme: t.value })}
                      className={"flex items-center gap-2 rounded-xl border px-4 py-3 text-[12px] font-medium transition " + (settings.theme === t.value ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
                      <span className={"grid h-7 w-7 place-items-center rounded-lg " + t.tone}><TIcon className="h-3.5 w-3.5" /></span> {t.label}
                    </button>
                  );})}</div>
                </div>
                <div><label className="text-[12px] font-semibold text-slate-600">Default Calendar View</label>
                  <select value={settings.defaultCalendarView || "month"} onChange={e => save({ defaultCalendarView: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] focus:border-violet-400 focus:outline-none">
                    <option value="day">Day</option><option value="week">Week</option><option value="month">Month</option><option value="agenda">Agenda</option>
                  </select>
                </div>
                <div><label className="text-[12px] font-semibold text-slate-600">Default Task Priority</label>
                  <div className="mt-2 flex gap-2">{["low","medium","high"].map(p => (
                    <button key={p} type="button" onClick={() => save({ defaultTaskPriority: p })}
                      className={"rounded-lg px-4 py-2 text-[12px] font-medium transition " + (settings.defaultTaskPriority === p ? (p === "high" ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300" : p === "medium" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" : "bg-sky-100 text-sky-700 ring-1 ring-sky-300") : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}</div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><RefreshCw className="h-4 w-4" /></span><div><p className="text-[13px] font-semibold">Auto-save</p><p className="text-[10px] text-slate-400">Save changes automatically</p></div></div>
                  <button type="button" onClick={() => save({ autoSave: settings.autoSave !== false ? false : true })} className={"relative h-6 w-11 rounded-full transition-colors " + (settings.autoSave !== false ? "bg-violet-600" : "bg-slate-200")}><span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " + (settings.autoSave !== false ? "left-[22px]" : "left-0.5")} /></button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-600"><Download className="h-4 w-4" /></span><div><p className="text-[13px] font-semibold">Data Export</p><p className="text-[10px] text-slate-400">Enable data export option</p></div></div>
                  <button type="button" onClick={() => save({ dataExport: settings.dataExport === true ? false : true })} className={"relative h-6 w-11 rounded-full transition-colors " + (settings.dataExport === true ? "bg-violet-600" : "bg-slate-200")}><span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " + (settings.dataExport === true ? "left-[22px]" : "left-0.5")} /></button>
                </div>
              </div>
            </div>
          )}
          {/* -- Notifications Section -- */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">Notifications</h1><p className="mt-1 text-[13px] text-slate-400">Control how and when you get notified.</p></div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-3">
                {[
                  { key: "email" as const, label: "Email Notifications", desc: "Receive updates via email", icon: Mail, color: "bg-sky-100 text-sky-600" },
                  { key: "push" as const, label: "Push Notifications", desc: "Browser push notifications", icon: Smartphone, color: "bg-violet-100 text-violet-600" },
                  { key: "taskReminders" as const, label: "Task Reminders", desc: "Get reminded about upcoming tasks", icon: Clock, color: "bg-amber-100 text-amber-600" },
                  { key: "calendarAlerts" as const, label: "Calendar Alerts", desc: "Notifications for calendar events", icon: CalendarDays, color: "bg-emerald-100 text-emerald-600" },
                ].map(n => {
                  const enabled = settings.notifications?.[n.key] !== false;
                  const NIcon = n.icon;
                  return (
                    <div key={n.key} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-slate-200">
                      <div className="flex items-center gap-3"><span className={"grid h-9 w-9 place-items-center rounded-lg " + n.color}><NIcon className="h-4 w-4" /></span><div><p className="text-[13px] font-semibold text-slate-800">{n.label}</p><p className="text-[10px] text-slate-400">{n.desc}</p></div></div>
                      <button type="button" onClick={() => save({ notifications: { email: settings.notifications?.email !== false, push: settings.notifications?.push !== false, taskReminders: settings.notifications?.taskReminders !== false, calendarAlerts: settings.notifications?.calendarAlerts !== false, [n.key]: !enabled } as any })}
                        className={"relative h-6 w-11 rounded-full transition-colors " + (enabled ? "bg-violet-600" : "bg-slate-200")}>
                        <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " + (enabled ? "left-[22px]" : "left-0.5")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -- Privacy Section -- */}
          {activeSection === "privacy" && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">Privacy & Security</h1><p className="mt-1 text-[13px] text-slate-400">Manage your privacy and security settings.</p></div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                {[
                  { label: "Two-Factor Authentication", desc: "Add an extra layer of security", icon: Shield, color: "bg-emerald-100 text-emerald-600" },
                  { label: "Login Notifications", desc: "Get notified of new sign-ins", icon: Bell, color: "bg-sky-100 text-sky-600" },
                  { label: "Active Sessions", desc: "Manage your active sessions", icon: Globe, color: "bg-violet-100 text-violet-600" },
                ].map(item => {
                  const PIcon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-slate-200">
                      <div className="flex items-center gap-3"><span className={"grid h-9 w-9 place-items-center rounded-lg " + item.color}><PIcon className="h-4 w-4" /></span><div><p className="text-[13px] font-semibold text-slate-800">{item.label}</p><p className="text-[10px] text-slate-400">{item.desc}</p></div></div>
                      <button type="button" className="text-[12px] font-semibold text-violet-600 hover:text-violet-700">Configure</button>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6 shadow-sm">
                <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600"><AlertTriangle className="h-4 w-4" /></span>
                  <div><h3 className="text-[14px] font-semibold text-rose-800">Danger Zone</h3><p className="mt-1 text-[12px] text-rose-600">Export all your data or permanently delete your account.</p>
                    <div className="mt-3 flex gap-2"><button type="button" className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"><Download className="mr-1.5 inline h-3.5 w-3.5" /> Export Data</button>
                    <button type="button" className="rounded-lg bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-rose-700"><Trash2 className="mr-1.5 inline h-3.5 w-3.5" /> Delete Account</button></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
