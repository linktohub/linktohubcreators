"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Sparkles, Pencil, Trash2, MoreVertical } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "all" | "merch" | "digital" | "events" | "subscriptions" | "bookings";

type UnifiedItem = {
  id: string;
  title: string;
  price: string;
  isLive: boolean;
  category: Exclude<Category, "all">;
  emoji: string;
  badge?: string;
  source: "products" | "events" | "subscription_tiers";
};

type RawProduct = {
  id: string;
  title?: string;
  description?: string;
  price?: number;
  active?: boolean;
  type?: string;
  file_type?: string;
};

type RawEvent = {
  id: string;
  title?: string;
  price?: number;
  published?: boolean;
  type?: string;
  starts_at?: string;
};

type RawTier = {
  id: string;
  name?: string;
  price_monthly?: number;
  active?: boolean;
};

const TABS: { id: Category; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "" },
  { id: "merch", label: "Merch", emoji: "👕" },
  { id: "digital", label: "Digital", emoji: "📚" },
  { id: "events", label: "Events", emoji: "🎟️" },
  { id: "subscriptions", label: "Memberships", emoji: "⭐" },
  { id: "bookings", label: "Bookings", emoji: "📅" },
];

const DIGITAL_EMOJI: Record<string, string> = {
  course: "🎓",
  pdf: "📄",
  preset: "🎨",
  video: "🎬",
};

function formatPrice(price: number | undefined, suffix = ""): string {
  if (price === undefined || price === null) return "Free";
  if (price === 0) return "Free";
  return `$${price}${suffix}`;
}

function normalize(
  products: RawProduct[],
  events: RawEvent[],
  tiers: RawTier[]
): UnifiedItem[] {
  const items: UnifiedItem[] = [];

  for (const p of products) {
    if (p.type === "merch" || p.type === "physical") {
      items.push({
        id: p.id,
        title: p.title || "Untitled",
        price: formatPrice(p.price),
        isLive: p.active ?? false,
        category: "merch",
        emoji: "👕",
        badge: "Merch",
        source: "products",
      });
    } else if (p.type === "digital") {
      items.push({
        id: p.id,
        title: p.title || "Untitled",
        price: formatPrice(p.price),
        isLive: p.active ?? false,
        category: "digital",
        emoji: DIGITAL_EMOJI[p.file_type || ""] || "📁",
        badge: p.file_type ? p.file_type.charAt(0).toUpperCase() + p.file_type.slice(1) : "Digital",
        source: "products",
      });
    } else if (p.type === "booking") {
      items.push({
        id: p.id,
        title: p.title || "Untitled",
        price: formatPrice(p.price),
        isLive: p.active ?? false,
        category: "bookings",
        emoji: "📅",
        badge: "Booking",
        source: "products",
      });
    }
  }

  for (const e of events) {
    items.push({
      id: e.id,
      title: e.title || "Untitled Event",
      price: formatPrice(e.price),
      isLive: e.published ?? false,
      category: "events",
      emoji: "🎟️",
      badge: e.type || "Event",
      source: "events",
    });
  }

  for (const t of tiers) {
    items.push({
      id: t.id,
      title: t.name || "Untitled Tier",
      price: formatPrice(t.price_monthly, "/mo"),
      isLive: t.active ?? false,
      category: "subscriptions",
      emoji: "⭐",
      badge: "Membership",
      source: "subscription_tiers",
    });
  }

  return items;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsClient({
  products,
  events,
  tiers,
}: {
  products: RawProduct[];
  events: RawEvent[];
  tiers: RawTier[];
}) {
  const [activeTab, setActiveTab] = useState<Category>("all");
  const [items, setItems] = useState<UnifiedItem[]>(() => normalize(products, events, tiers));
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);

  const filtered = activeTab === "all" ? items : items.filter((i) => i.category === activeTab);

  async function toggleLive(item: UnifiedItem) {
    setTogglingId(item.id);
    const supabase = createClient();
    const newStatus = !item.isLive;

    let error: { message: string } | null = null;
    if (item.source === "products") {
      const res = await supabase.from("products").update({ active: newStatus }).eq("id", item.id);
      error = res.error;
    } else if (item.source === "events") {
      const res = await supabase.from("events").update({ published: newStatus }).eq("id", item.id);
      error = res.error;
    } else if (item.source === "subscription_tiers") {
      const res = await supabase.from("subscription_tiers").update({ active: newStatus }).eq("id", item.id);
      error = res.error;
    }

    if (error) {
      toast.error(error.message);
    } else {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isLive: newStatus } : i));
      toast.success(newStatus ? "Now live on storefront" : "Moved to draft");
    }
    setTogglingId(null);
  }

  async function deleteItem(item: UnifiedItem) {
    setDeletingId(item.id);
    const supabase = createClient();

    let error: { message: string } | null = null;
    if (item.source === "products") {
      const res = await supabase.from("products").delete().eq("id", item.id);
      error = res.error;
    } else if (item.source === "events") {
      const res = await supabase.from("events").delete().eq("id", item.id);
      error = res.error;
    } else if (item.source === "subscription_tiers") {
      const res = await supabase.from("subscription_tiers").delete().eq("id", item.id);
      error = res.error;
    }

    if (error) {
      toast.error(error.message);
      setDeletingId(null);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Deleted");
      setDeletingId(null);
    }
  }

  const counts: Record<Category, number> = {
    all: items.length,
    merch: items.filter((i) => i.category === "merch").length,
    digital: items.filter((i) => i.category === "digital").length,
    events: items.filter((i) => i.category === "events").length,
    subscriptions: items.filter((i) => i.category === "subscriptions").length,
    bookings: items.filter((i) => i.category === "bookings").length,
  };

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-none -mx-5 px-5 md:mx-0 md:px-0">
        {TABS.map((tab) => {
          const count = counts[tab.id];
          if (tab.id !== "all" && count === 0) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0",
                activeTab === tab.id
                  ? "btn-gradient text-white"
                  : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              {tab.emoji && <span>{tab.emoji}</span>}
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md font-bold",
                  activeTab === tab.id ? "bg-black/20 text-white/80" : "bg-white/[0.08] text-white/50"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 group hover:border-white/10 transition-all"
            >
              {/* Emoji icon */}
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-lg shrink-0">
                {item.emoji}
              </div>

              {/* Info — must have min-w-0 to allow truncation */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate leading-tight">{item.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold text-white/40 bg-white/[0.05] px-1.5 py-0.5 rounded uppercase tracking-wide">
                      {item.badge}
                    </span>
                  )}
                  <span className={cn(
                    "text-[10px] font-medium",
                    item.isLive ? "text-emerald-400" : "text-white/25"
                  )}>
                    {item.isLive ? "● Live" : "○ Draft"}
                  </span>
                </div>
              </div>

              {/* Price — fixed width */}
              <p className="font-bold text-white text-sm shrink-0 w-14 text-right">{item.price}</p>

              {/* Edit — desktop only, products only */}
              {item.source === "products" && (
                <Link href={`/dashboard/products/${item.id}`}
                  className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Toggle */}
              <button
                onClick={() => toggleLive(item)}
                disabled={togglingId === item.id}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative disabled:opacity-50 shrink-0",
                  item.isLive ? "bg-emerald-500" : "bg-white/20"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  item.isLive ? "left-5" : "left-1"
                )} />
              </button>

              {/* Delete — desktop only */}
              <button
                onClick={() => deleteItem(item)}
                disabled={deletingId === item.id}
                className="hidden sm:flex text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 w-10 h-10 items-center justify-center rounded-xl shrink-0"
              >
                <Trash2 className={cn("w-3.5 h-3.5", deletingId === item.id && "animate-pulse")} />
              </button>

              {/* Mobile kebab — edit + delete collapsed */}
              <div className="relative sm:hidden shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenKebabId(openKebabId === item.id ? null : item.id); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openKebabId === item.id && (
                  <div className="absolute right-0 top-full mt-1 bg-[#111] border border-white/[0.12] rounded-xl overflow-hidden z-10 min-w-[140px] shadow-2xl shadow-black/60">
                    {item.source === "products" && (
                      <Link href={`/dashboard/products/${item.id}`}
                        onClick={() => setOpenKebabId(null)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                    )}
                    <button
                      onClick={() => { setOpenKebabId(null); deleteItem(item); }}
                      disabled={deletingId === item.id}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-white/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-gradient-to-b from-violet-500/[0.05] to-transparent border border-violet-500/[0.12]">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-3xl mx-auto mb-5">
            {activeTab === "all" ? "✨" : TABS.find((t) => t.id === activeTab)?.emoji}
          </div>
          <p className="text-white font-black text-lg mb-1">
            {activeTab === "all" ? "Nothing here yet" : `No ${TABS.find((t) => t.id === activeTab)?.label} yet`}
          </p>
          <p className="text-white/30 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
            AI will build your first one in seconds — just pick a type
          </p>
          <Link
            href="/dashboard/products/create"
            className="inline-flex items-center gap-2 btn-gradient h-11 px-7 rounded-xl text-white font-bold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Create with AI
          </Link>
        </div>
      )}

      {/* Bottom spacer for mobile nav */}
      <div className="h-6 md:h-0" />
    </>
  );
}
