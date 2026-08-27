"use client";

import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "@clerk/nextjs/experimental";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Crown, ArrowRight } from "lucide-react";

const PLAN_LIMITS: Record<string, { boards: number; notes: number; templates: number; whiteboards: number; spaces: number }> = {
  free: { boards: 3, notes: 10, templates: 3, whiteboards: 3, spaces: 3 },
  pro: { boards: -1, notes: -1, templates: -1, whiteboards: -1, spaces: -1 },
  business: { boards: -1, notes: -1, templates: -1, whiteboards: -1, spaces: -1 },
};

export function usePlanLimit() {
  const { data: subscription } = useSubscription();
  const planName = (subscription as any)?.plan || "free";
  const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.free;
  const isPaid = !!(subscription && (subscription as any).status === "active");

  const canCreate = useCallback((type: keyof typeof limits, currentCount: number) => {
    const max = limits[type];
    return max === -1 || currentCount < max;
  }, [limits]);

  return { planName, limits, isPaid, canCreate };
}

export function UpgradeBanner({ type, current }: { type: string; current: number }) {
  const { limits, isPaid } = usePlanLimit();
  const max = (limits as any)[type];
  if (isPaid || max === -1 || current < max) return null;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600"><Zap className="h-4 w-4" /></span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-200">You've reached the {type} limit ({current}/{max})</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400">Upgrade to Pro for unlimited {type}.</p>
        </div>
        <Link href="/billing" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-amber-700 transition-colors">
          Upgrade <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
