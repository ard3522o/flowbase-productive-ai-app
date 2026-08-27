"use client";

import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { useSubscription } from "@clerk/nextjs/experimental";
import { useUser } from "@clerk/nextjs";
import { CreditCard, ArrowLeft, Zap, Crown, Columns3, NotebookPen, Presentation, Files, Wand2 } from "lucide-react";

const PLAN_LIMITS = {
  free: { boards: 3, notes: 10, templates: 3, whiteboards: 3, spaces: 3, label: "Free", color: "bg-slate-100 text-slate-600" },
  pro: { boards: -1, notes: -1, templates: -1, whiteboards: -1, spaces: -1, label: "Pro", color: "bg-violet-100 text-violet-600" },
  business: { boards: -1, notes: -1, templates: -1, whiteboards: -1, spaces: -1, label: "Business", color: "bg-amber-100 text-amber-600" },
};

export function BillingPage() {
  const { user } = useUser();
  const { data: subscription, isLoading } = useSubscription();
  const planName = (subscription as any)?.plan || "free";
  const plan = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const isPaid = subscription && (subscription as any).status === "active";

  return (
    <div className="min-h-screen bg-[#fbfcff] text-slate-900 transition-colors">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-400 hover:text-violet-600 transition-colors mb-4"><ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard</Link>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200"><CreditCard className="h-5 w-5 text-white" /></span>
            <div><h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1><p className="text-[13px] text-slate-400">Manage your plan and payment details.</p></div>
          </div>
        </div>
        <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={"grid h-8 w-8 place-items-center rounded-xl " + plan.color}>{isPaid ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}</span>
              <div><h2 className="text-[16px] font-bold">{plan.label} Plan</h2><p className="text-[11px] text-slate-400">{isLoading ? "Checking..." : isPaid ? "Active subscription" : "Free tier - upgrade for unlimited access"}</p></div>
            </div>
            {(subscription as any)?.nextPayment && <div className="text-right"><p className="text-[12px] text-slate-400">Next payment</p><p className="text-[14px] font-bold">{(subscription as any).nextPayment.amount.amountFormatted}</p><p className="text-[11px] text-slate-400">{(subscription as any).nextPayment.date.toLocaleDateString()}</p></div>}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[{ key: "boards", label: "Boards", icon: Columns3, color: "bg-rose-100 text-rose-600" },{ key: "notes", label: "Notes", icon: NotebookPen, color: "bg-emerald-100 text-emerald-600" },{ key: "templates", label: "Templates", icon: Wand2, color: "bg-fuchsia-100 text-fuchsia-600" },{ key: "whiteboards", label: "Whiteboards", icon: Presentation, color: "bg-orange-100 text-orange-600" },{ key: "spaces", label: "Spaces", icon: Files, color: "bg-indigo-100 text-indigo-600" }].map(item => {
              const limit = (plan as any)[item.key];
              const ItemIcon = item.icon;
              return <div key={item.key} className="rounded-xl border border-slate-100 p-3 text-center"><span className={"grid h-8 w-8 mx-auto place-items-center rounded-lg " + item.color}><ItemIcon className="h-4 w-4" /></span><p className="mt-2 text-[11px] font-semibold text-slate-500">{item.label}</p><p className="text-[18px] font-bold">{limit === -1 ? "Unlimited" : limit}</p></div>;
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-6"><h2 className="text-[18px] font-bold">Choose Your Plan</h2><p className="mt-1 text-[13px] text-slate-400">Unlock the full power of Flowbase.</p></div>
          <div className="overflow-hidden rounded-xl"><PricingTable appearance={{ variables: { colorPrimary: "#7C3AED", borderRadius: "16px" } }} newSubscriptionRedirectUrl="/billing" /></div>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-[18px] font-bold mb-4">Plan Comparison</h2>
          <div className="overflow-x-auto"><table className="w-full text-left text-[12px]"><thead><tr className="border-b border-slate-200"><th className="pb-3 font-semibold text-slate-500">Feature</th><th className="pb-3 font-semibold text-center">Free</th><th className="pb-3 font-semibold text-center text-violet-600">Pro</th><th className="pb-3 font-semibold text-center text-amber-600">Business</th></tr></thead><tbody className="divide-y divide-slate-100">
            {[{ f: "Kanban Boards", free: "3", pro: "Unlimited", biz: "Unlimited" },{ f: "Notes", free: "10", pro: "Unlimited", biz: "Unlimited" },{ f: "AI Templates", free: "3", pro: "Unlimited", biz: "Unlimited" },{ f: "Whiteboards", free: "3", pro: "Unlimited", biz: "Unlimited" },{ f: "Spaces", free: "3", pro: "Unlimited", biz: "Unlimited" },{ f: "AI Assistant", free: "50/mo", pro: "500/mo", biz: "Unlimited" },{ f: "Collaboration", free: "1 user", pro: "10 users", biz: "Unlimited" },{ f: "Data Export", free: "No", pro: "Yes", biz: "Yes" }].map(r => <tr key={r.f} className="hover:bg-slate-50:bg-slate-800/50"><td className="py-2.5 font-medium text-slate-700">{r.f}</td><td className="py-2.5 text-center text-slate-500">{r.free}</td><td className="py-2.5 text-center font-semibold text-violet-600">{r.pro}</td><td className="py-2.5 text-center font-semibold text-amber-600">{r.biz}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </div>
  );
}
