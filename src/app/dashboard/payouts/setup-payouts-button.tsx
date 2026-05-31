"use client";

import { useState } from "react";
import { Banknote, Loader2 } from "lucide-react";

export default function SetupPayoutsButton({ creatorId }: { creatorId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setLoading(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSetup}
      disabled={loading}
      className="flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg shadow-violet-500/20 disabled:opacity-60 shrink-0"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
      {loading ? "Setting up..." : "Add bank account"}
    </button>
  );
}
