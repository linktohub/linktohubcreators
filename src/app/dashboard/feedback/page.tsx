"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, MessageSquare, Lightbulb, Bug, Zap } from "lucide-react";
import Link from "next/link";

type FeedbackType = "bug" | "idea" | "improvement" | "question";
type Priority = "low" | "medium" | "high";

const TYPES: { id: FeedbackType; label: string; icon: typeof Bug; desc: string }[] = [
  { id: "bug", label: "Bug Report", icon: Bug, desc: "Something is broken" },
  { id: "idea", label: "New Feature", icon: Lightbulb, desc: "I have an idea" },
  { id: "improvement", label: "Improvement", icon: Zap, desc: "Make something better" },
  { id: "question", label: "Question", icon: MessageSquare, desc: "I need help" },
];

type FeedbackItem = {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: "open" | "in_progress" | "done" | "rejected";
  priority: Priority;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400 bg-yellow-400/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  done: "text-emerald-400 bg-emerald-400/10",
  rejected: "text-white/30 bg-white/[0.05]",
};

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    fetch("/api/feedback").then((r) => r.json()).then((d) => setHistory(d.feedback || []));
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { toast.error("Fill in all fields"); return; }
    setSubmitting(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description, priority }),
    });

    if (res.ok) {
      toast.success("Feedback submitted! We read every single one.");
      setTitle("");
      setDescription("");
      setSubmitted((s) => !s);
    } else {
      toast.error("Failed to submit");
    }
    setSubmitting(false);
  }

  return (
    <div className="p-5 pb-28 md:pb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Feedback</h1>
          <p className="text-white/40 mt-1 text-sm">Help us build the app you need</p>
        </div>
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="space-y-5 mb-10">
        {/* Type */}
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setType(t.id)}
              className={cn("p-4 rounded-2xl border text-left transition-all",
                type === t.id ? "border-violet-500/60 bg-violet-500/[0.08]" : "border-white/[0.06] hover:border-white/20 bg-white/[0.02]")}>
              <t.icon className={cn("w-5 h-5 mb-2", type === t.id ? "text-violet-400" : "text-white/30")} />
              <p className="font-bold text-sm text-white">{t.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title..."
            className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/50"
            required />
        </div>

        {/* Description */}
        <div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe it in detail. What happened? What did you expect? What would you like to see?"
            rows={4}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/50 resize-none"
            required />
        </div>

        {/* Priority */}
        <div className="flex gap-2">
          {(["low", "medium", "high"] as Priority[]).map((p) => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border",
                priority === p
                  ? p === "high" ? "bg-red-500/20 border-red-500/40 text-red-400"
                    : p === "medium" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                    : "bg-white/[0.08] border-white/20 text-white/60"
                  : "bg-white/[0.03] border-white/[0.06] text-white/30")}>
              {p}
            </button>
          ))}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          {submitting ? "Sending..." : "Submit Feedback"}
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3">Your submissions</h2>
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{item.title}</p>
                    <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0", STATUS_COLORS[item.status])}>
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
