"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export default function EmailBroadcastClient({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { toast.error("Subject and message required"); return; }
    if (subscriberCount === 0) { toast.error("No subscribers yet"); return; }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (data.skipped) {
        toast.info(data.skipped);
      } else {
        setResult({ sent: data.sent, failed: data.failed });
        toast.success(`Sent to ${data.sent} subscribers!`);
        setSubject("");
        setBody("");
      }
    } catch { toast.error("Send failed"); }
    setSending(false);
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
        <Send className="w-5 h-5 text-violet-400" />
        Send a broadcast
      </h2>

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-5 text-emerald-300 text-sm font-semibold">
          ✓ Sent to {result.sent} subscribers{result.failed > 0 ? ` (${result.failed} failed)` : ""}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Something exciting for my community..."
            className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/50"
            required
          />
        </div>
        <div>
          <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hey everyone! Just wanted to share..."
            rows={6}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/50 resize-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={sending || subscriberCount === 0}
          className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending..." : `Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? "s" : ""}`}
        </button>
      </form>
    </div>
  );
}
