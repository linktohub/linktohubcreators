"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";

export default function ConnectStripeButton() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to start Stripe setup");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 bg-white text-black hover:bg-white/90 font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ExternalLink className="w-4 h-4" />
      )}
      {loading ? "Redirecting..." : "Connect Stripe"}
    </button>
  );
}
