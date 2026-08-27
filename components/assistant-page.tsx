"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAssemblyAIStreaming } from "@/hooks/use-assemblyai-streaming";
import {
  Sparkles, Send, Mic, Loader2, ArrowUpRight,
  Columns3, CalendarDays, NotebookPen, Wand2,
  CheckCircle2, AlertCircle, ArrowLeft, Bot, User, Square,
} from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; content: string; actions?: any[]; timestamp: number };

const SUGGESTIONS = [
  { text: "Create a task for tomorrow", icon: Columns3, color: "bg-rose-100 text-rose-600" },
  { text: "Add meeting reminder on calendar", icon: CalendarDays, color: "bg-sky-100 text-sky-600" },
  { text: "Summarize my notes", icon: NotebookPen, color: "bg-emerald-100 text-emerald-600" },
  { text: "Create a Kanban board", icon: Columns3, color: "bg-violet-100 text-violet-600" },
  { text: "Plan my week", icon: Sparkles, color: "bg-amber-100 text-amber-600" },
  { text: "Generate a habit tracker template", icon: Wand2, color: "bg-fuchsia-100 text-fuchsia-600" },
];

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleTranscript = useCallback((text: string, _end: boolean) => {
    if (text.trim()) setInput(text);
  }, []);
  const { isRecording, isConnecting, error: micError, startRecording, stopRecording } = useAssemblyAIStreaming(handleTranscript);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      // Use ref to get latest messages including the one we just added
      const allMsgs = [...messagesRef.current, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMsgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: data.message || "Done!",
        actions: data.actions || [], timestamp: Date.now(),
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: "Error: " + (e.message || "Unknown"),
        timestamp: Date.now(),
      }]);
    }
    setLoading(false);
  }, [input, loading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-screen bg-[#fbfcff] text-slate-900">
      <aside className="sticky top-0 flex h-screen w-[228px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-2.5 py-3 backdrop-blur">
        <div className="flex h-9 items-center px-1">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-300"><Bot className="h-5 w-5 text-white" /></span>
            <span className="truncate text-[17px] font-bold tracking-tight">Flowbase</span>
          </Link>
        </div>
        <div className="mt-4 px-1">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 px-1">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Quick Actions</p>
          <div className="space-y-1">
            {SUGGESTIONS.slice(0, 4).map((s, i) => {
              const SIcon = s.icon;
              return (
                <button key={i} type="button" onClick={() => sendMessage(s.text)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                  <span className={"grid h-5 w-5 shrink-0 place-items-center rounded " + s.color}><SIcon className="h-2.5 w-2.5" /></span>
                  <span className="truncate">{s.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 border-b border-slate-200/80 bg-white px-6 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200"><Sparkles className="h-4 w-4 text-white" /></span>
          <div><h1 className="text-[16px] font-bold">AI Assistant</h1><p className="text-[11px] text-slate-400">Your central command center</p></div>
          {isRecording && <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-600"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Listening...</span>}
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isEmpty ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600"><Sparkles className="h-8 w-8" /></span>
              <h2 className="mt-6 text-2xl font-bold">Hi! I am your AI Assistant</h2>
              <p className="mt-2 max-w-md text-[14px] text-slate-400 leading-relaxed">I can help you manage tasks, create notes, schedule events, and more. Just ask or try a suggestion.</p>
              <div className="mt-8 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => {
                  const SIcon = s.icon;
                  return (
                    <button key={i} type="button" onClick={() => sendMessage(s.text)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm group">
                      <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-lg " + s.color}><SIcon className="h-4 w-4" /></span>
                      <span className="flex-1 text-[12px] font-medium text-slate-600 group-hover:text-slate-800">{s.text}</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-violet-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={"flex gap-3 " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white"><Bot className="h-4 w-4" /></span>}
                  <div className={"max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed " + (msg.role === "user" ? "bg-violet-600 text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm")}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.actions.map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium">
                            {a.result?.success ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                            <span className={a.result?.success ? "text-emerald-600" : "text-amber-600"}>{a.result?.message || "Done"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-500"><User className="h-4 w-4" /></span>}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white"><Bot className="h-4 w-4" /></span>
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex items-center gap-2 text-[13px] text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</div></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/80 bg-white px-6 py-4">
          {micError && <p className="mb-2 text-[11px] text-red-500">{micError}</p>}
          <div className="mx-auto max-w-3xl flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ask me anything..." rows={1} className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 max-h-32" />
            <button type="button" onClick={() => isRecording ? stopRecording() : startRecording()} className={"grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all " + (isRecording ? "bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200")} title={isRecording ? "Stop" : "Voice"}>
              {isRecording ? <Square className="h-4 w-4" /> : isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-300">AI can make mistakes. Check important actions.</p>
        </div>
      </div>
    </div>
  );
}
