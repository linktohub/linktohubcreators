"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ToggleLeft, ToggleRight, Loader2, Zap } from "lucide-react";

interface Props {
  creatorId: string;
  enabled: boolean;
}

export default function InstantPayoutsToggle({ enabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [payingOut, setPayingOut] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !enabled;
    try {
      const res = await fetch("/api/stripe/instant-payout-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error();
      setEnabled(next);
      toast.success(next ? "Instant Payouts enabled" : "Standard payouts restored");
    } catch {
      toast.error("Failed to update payout preference");
    } finally {
      setLoading(false);
    }
  }

  async function payNow() {
    setPayingOut(true);
    try {
      const res = await fetch("/api/stripe/instant-payout-now", { method: "POST" });
      const data = await res.json() as { ok?: boolean; error?: string; amount?: number };
      if (!res.ok) throw new Error(data.error || "Failed");
      const dollars = ((data.amount || 0) / 100).toFixed(2);
      toast.success(`$${dollars} on its way — arrives in ~30 minutes`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payout failed");
    } finally {
      setPayingOut(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      {enabled && (
        <button
          onClick={payNow}
          disabled={payingOut}
          className="h-10 px-5 rounded-xl btn-gradient text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {payingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Pay out now
        </button>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
        aria-label="Toggle Instant Payouts"
      >
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        ) : enabled ? (
          <ToggleRight className="w-10 h-10 text-yellow-400" />
        ) : (
          <ToggleLeft className="w-10 h-10 text-white/30" />
        )}
      </button>
    </div>
  );
}
