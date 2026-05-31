"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, RefreshCw, Shirt, FileText, Ticket, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type SuggestionItem = {
  id: string;
  type: "product" | "tier" | "event";
  name: string;
  description: string;
  price: number | null;
  image: string | null;
  emoji: string;
  meta: string;
};

export default function SuggestionsFeed({ creatorId }: { creatorId: string }) {
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const storageKey = `reviewed_${creatorId}`;
    if (typeof window !== "undefined" && localStorage.getItem(storageKey)) {
      setDone(true);
      setLoading(false);
      return;
    }
    loadSuggestions();
  }, [creatorId]);

  async function loadSuggestions() {
    const supabase = createClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: products }, { data: tiers }, { data: events }] = await Promise.all([
      supabase.from("products").select("id, name, title, description, price, images, type, active")
        .eq("creator_id", creatorId).gte("created_at", since),
      supabase.from("subscription_tiers").select("id, name, description, price, is_active")
        .eq("creator_id", creatorId).gte("created_at", since),
      supabase.from("events").select("id, title, description, price, published")
        .eq("creator_id", creatorId).gte("created_at", since),
    ]);

    const list: SuggestionItem[] = [];

    (products || []).forEach((p) => {
      const name = p.name || p.title || "Product";
      const emoji = p.type === "digital" ? "📄" : p.type === "merch" ? "👕" : "📦";
      list.push({
        id: p.id, type: "product",
        name, description: p.description || "",
        price: p.price, image: p.images?.[0] || null,
        emoji, meta: p.type === "digital" ? "Digital" : "Merch",
      });
    });

    (tiers || []).forEach((t) => {
      list.push({
        id: t.id, type: "tier",
        name: t.name, description: t.description || "",
        price: t.price, image: null,
        emoji: "⭐", meta: "Subscription Tier",
      });
    });

    (events || []).forEach((e) => {
      list.push({
        id: e.id, type: "event",
        name: e.title, description: e.description || "",
        price: e.price, image: null,
        emoji: "🎤", meta: "Event",
      });
    });

    setItems(list);
    setLoading(false);
    if (list.length === 0) setDone(true);
  }

  async function act(approved: boolean) {
    if (acting) return;
    setActing(true);
    const item = items[index];
    try {
      await fetch("/api/dashboard/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type, id: item.id, approved }),
      });
    } catch { /* continue */ }

    const next = index + 1;
    if (next >= items.length) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`reviewed_${creatorId}`, "1");
      }
      setDone(true);
    } else {
      setIndex(next);
    }
    setActing(false);
  }

  if (loading) return null;
  if (done || items.length === 0) return null;

  const item = items[index];
  const progress = ((index) / items.length) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">AI built this for you</h2>
        <span className="text-white/25 text-xs ml-auto">{index + 1} of {items.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.06] rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div className="card-glass rounded-2xl overflow-hidden">
        {/* Image / color block */}
        {item.image ? (
          <div className="h-48 w-full overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-36 w-full flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10">
            <span className="text-6xl">{item.emoji}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-white/[0.07] text-white/50 px-2 py-0.5 rounded-full">{item.meta}</span>
              </div>
              <h3 className="font-black text-white text-xl leading-tight">{item.name}</h3>
            </div>
            {item.price !== null && (
              <span className="text-2xl font-black text-white shrink-0">${item.price}</span>
            )}
          </div>
          <p className="text-white/45 text-sm leading-relaxed line-clamp-3">{item.description}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-0 border-t border-white/[0.06]">
          <button
            onClick={() => act(false)}
            disabled={acting}
            className={cn(
              "flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors border-r border-white/[0.06]",
              "text-white/50 hover:text-red-400 hover:bg-red-500/5 disabled:opacity-50"
            )}
          >
            <X className="w-5 h-5" />
            Not this
          </button>
          <button
            onClick={() => act(true)}
            disabled={acting}
            className={cn(
              "flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors",
              "text-white/50 hover:text-emerald-400 hover:bg-emerald-500/5 disabled:opacity-50"
            )}
          >
            <Check className="w-5 h-5" />
            Love it
          </button>
        </div>
      </div>
    </div>
  );
}
