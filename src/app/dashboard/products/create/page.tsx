"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw, Check, Sparkles, Send } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductTypeId = "merch" | "course" | "pdf" | "preset" | "event" | "subscription" | "booking";

const PRODUCT_TYPES: {
  id: ProductTypeId;
  label: string;
  desc: string;
  emoji: string;
  gradient: string;
}[] = [
  { id: "merch", label: "Merch", desc: "Clothing & accessories", emoji: "👕", gradient: "from-orange-500/15 to-amber-500/5" },
  { id: "course", label: "Course", desc: "Video-based learning", emoji: "🎓", gradient: "from-blue-500/15 to-indigo-500/5" },
  { id: "pdf", label: "PDF Guide", desc: "Ebooks & playbooks", emoji: "📄", gradient: "from-emerald-500/15 to-teal-500/5" },
  { id: "preset", label: "Preset Pack", desc: "Templates & filters", emoji: "🎨", gradient: "from-fuchsia-500/15 to-pink-500/5" },
  { id: "event", label: "Event", desc: "Webinars & seminars", emoji: "🎟️", gradient: "from-yellow-500/15 to-orange-500/5" },
  { id: "subscription", label: "Membership", desc: "Monthly fan tiers", emoji: "⭐", gradient: "from-violet-500/15 to-purple-500/5" },
  { id: "booking", label: "Booking", desc: "1-on-1 sessions", emoji: "📅", gradient: "from-cyan-500/15 to-sky-500/5" },
];

type AIData = {
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  price_monthly?: number;
  emoji?: string;
  image?: string;
  // merch
  pod_provider?: string;
  item_type?: string;
  // course
  modules?: { title: string; lessons: string[] }[];
  what_you_get?: string[];
  // pdf
  sections?: string[];
  pages?: number;
  // preset
  items?: string[];
  count?: number;
  // event
  type?: string;
  duration_minutes?: number;
  max_attendees?: number;
  days_from_now?: number;
  // subscription
  perks?: string[];
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<"pick" | "generating" | "preview">("pick");
  const [productType, setProductType] = useState<ProductTypeId | null>(null);
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [feedback, setFeedback] = useState("");
  const [refining, setRefining] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Event: creator must be able to set these before publishing
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("18:00");
  const [eventDuration, setEventDuration] = useState(90);
  const [eventMaxAttendees, setEventMaxAttendees] = useState(100);
  const [eventType, setEventType] = useState("webinar");
  const [eventPrice, setEventPrice] = useState(0);

  const generate = useCallback(async (type: ProductTypeId, feedbackText?: string, prev?: AIData) => {
    setStep("generating");
    setFeedback("");
    try {
      const res = await fetch("/api/ai/suggest-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, feedback: feedbackText, previousData: prev }),
      });
      const { data } = await res.json();
      if (!data) throw new Error("No data");
      setAiData(data);
      // Sync event defaults from AI
      if (type === "event") {
        if (data.type) setEventType(data.type);
        if (data.duration_minutes) setEventDuration(data.duration_minutes);
        if (data.max_attendees) setEventMaxAttendees(data.max_attendees);
        if (data.price !== undefined) setEventPrice(data.price);
        // Default date = 3 weeks from now
        const d = new Date();
        d.setDate(d.getDate() + (data.days_from_now || 21));
        setEventDate(d.toISOString().split("T")[0]);
      }
      setStep("preview");
    } catch {
      toast.error("AI generation failed — try again");
      setStep(prev ? "preview" : "pick");
      if (prev) setAiData(prev);
    }
  }, []);

  function pickType(type: ProductTypeId) {
    setProductType(type);
    generate(type);
  }

  async function handleRefine() {
    if (!productType || !aiData || !feedback.trim()) return;
    setRefining(true);
    await generate(productType, feedback.trim(), aiData);
    setRefining(false);
  }

  async function handlePublish() {
    if (!productType || !aiData) return;
    setPublishing(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) { router.push("/onboarding"); return; }

    let error: { message: string } | null = null;

    if (productType === "subscription") {
      const result = await supabase.from("subscription_tiers").insert({
        creator_id: creator.id,
        name: aiData.name || "Fan Membership",
        description: aiData.description || null,
        price_monthly: aiData.price_monthly || 19,
        perks: aiData.perks || [],
        active: true,
      });
      error = result.error;
    } else if (productType === "event") {
      // Use the creator-chosen date/time, not the AI default
      const dateStr = eventDate || (() => { const d = new Date(); d.setDate(d.getDate() + 21); return d.toISOString().split("T")[0]; })();
      const startsAt = new Date(`${dateStr}T${eventTime}:00`);
      const result = await supabase.from("events").insert({
        creator_id: creator.id,
        title: aiData.title || "Live Event",
        description: aiData.description || null,
        type: eventType || aiData.type || "webinar",
        starts_at: startsAt.toISOString(),
        price: eventPrice ?? aiData.price ?? 0,
        ends_at: new Date(startsAt.getTime() + ((eventDuration || aiData.duration_minutes || 90) * 60000)).toISOString(),
        max_attendees: eventMaxAttendees || aiData.max_attendees || null,
        published: true,
      });
      error = result.error;
    } else {
      const isDigital = ["course", "pdf", "preset"].includes(productType);
      const metadata = productType === "course"
        ? { modules: aiData.modules, what_you_get: aiData.what_you_get }
        : productType === "pdf"
        ? { sections: aiData.sections, pages: aiData.pages }
        : productType === "preset"
        ? { items: aiData.items, count: aiData.count }
        : productType === "booking"
        ? { duration_minutes: aiData.duration_minutes }
        : null;
      const result = await supabase.from("products").insert({
        creator_id: creator.id,
        type: productType === "merch" ? "merch" : productType === "booking" ? "booking" : "digital",
        title: aiData.title || aiData.name || "New Product",
        description: aiData.description || null,
        price: aiData.price || 0,
        file_type: isDigital ? productType : null,
        pod_provider: productType === "merch" ? "gelato" : null,
        active: true,
        images: aiData.image ? [aiData.image] : [],
        ...(metadata ? { metadata } : {}),
      }).select("id").single();
      error = result.error;

      // Auto-assign Gelato product IDs for merch silently in background
      if (!error && result.data?.id && productType === "merch" && aiData.item_type) {
        fetch("/api/gelato/auto-assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: result.data.id, itemType: aiData.item_type }),
        }).catch(() => {}); // non-blocking, non-fatal
      }
    }

    if (error) {
      toast.error(error.message);
      setPublishing(false);
      return;
    }

    toast.success("Published to your storefront!");
    router.push("/dashboard/products");
  }

  const typeInfo = PRODUCT_TYPES.find((t) => t.id === productType);

  return (
    <div className="p-5 pb-24 md:pb-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {step === "pick" ? (
          <Link href="/dashboard/products" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={() => { setStep("pick"); setProductType(null); setAiData(null); }}
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-black">
            {step === "pick" ? "Create with AI" : step === "generating" ? "Building for you..." : "Your product is ready"}
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {step === "pick" ? "Pick a type — AI does the rest" : step === "generating" ? `AI is crafting your ${typeInfo?.label}...` : "Accept, refine, or try again"}
          </p>
        </div>
      </div>

      {/* ── Step 1: Type Picker ── */}
      {step === "pick" && (
        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => pickType(t.id)}
              className={cn(
                "relative p-5 rounded-2xl border border-white/[0.06] text-left transition-all group",
                "bg-gradient-to-br",
                t.gradient,
                "hover:border-white/20 hover:scale-[1.02] active:scale-[0.99]"
              )}
            >
              <span className="text-3xl mb-3 block">{t.emoji}</span>
              <p className="font-bold text-white text-sm">{t.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2: Generating ── */}
      {step === "generating" && (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div className="h-44 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 flex items-center justify-center">
              <div className="text-center">
                <span className="text-5xl mb-3 block">{typeInfo?.emoji}</span>
                <div className="flex items-center gap-2 text-violet-400 text-sm">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>AI is writing...</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="h-5 bg-white/[0.06] rounded-lg w-3/4" />
              <div className="h-3 bg-white/[0.04] rounded w-full" />
              <div className="h-3 bg-white/[0.04] rounded w-5/6" />
              <div className="h-3 bg-white/[0.04] rounded w-4/6" />
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-white/[0.03] border border-white/[0.04] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && aiData && typeInfo && (
        <div className="space-y-4">
          {/* Product preview card */}
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
            {/* Cover image */}
            {aiData.image && (
              <div className="h-44 overflow-hidden">
                <img src={aiData.image} alt={aiData.title || aiData.name || ""} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6">
              {/* Type badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1 text-xs font-medium text-white/50 mb-4">
                <span>{typeInfo.emoji}</span>
                <span>{typeInfo.label}</span>
              </div>

              {/* Title & description */}
              <h2 className="text-2xl font-black text-white mb-2">
                {aiData.title || aiData.name}
              </h2>
              {aiData.description && (
                <p className="text-white/50 text-sm leading-relaxed mb-5">{aiData.description}</p>
              )}

              {/* Type-specific content */}
              <PreviewContent aiData={aiData} type={productType!} />

              {/* Event: editable fields — creator sets these before publishing */}
              {productType === "event" && (
                <div className="space-y-2 mt-4 pt-4 border-t border-white/[0.07]">
                  <p className="text-white/40 text-xs mb-3">When is it happening?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                      className="h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 text-white text-sm outline-none focus:border-violet-500/50 [color-scheme:dark]" />
                    <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                      className="h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 text-white text-sm outline-none focus:border-violet-500/50 [color-scheme:dark]" />
                    <input type="number" value={eventDuration} onChange={(e) => setEventDuration(Number(e.target.value))} min="15"
                      placeholder="Duration (min)"
                      className="h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/25" />
                    <input type="number" value={eventMaxAttendees} onChange={(e) => setEventMaxAttendees(Number(e.target.value))} min="1"
                      placeholder="Max spots"
                      className="h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/25" />
                    <input type="number" value={eventPrice} onChange={(e) => setEventPrice(Number(e.target.value))} min="0" step="0.01"
                      placeholder="Price ($)"
                      className="h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/25" />
                    <select value={eventType} onChange={(e) => setEventType(e.target.value)}
                      className="h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 text-white text-sm outline-none focus:border-violet-500/50 [color-scheme:dark]">
                      <option value="webinar">Webinar</option>
                      <option value="zoom">Zoom Call</option>
                      <option value="seminar">Seminar</option>
                      <option value="livestream">Livestream</option>
                      <option value="in_person">In Person</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Price / meta row */}
              <div className="flex items-center gap-4 mt-5 pt-5 border-t border-white/[0.06]">
                <div>
                  <p className="text-3xl font-black text-white">
                    {productType === "subscription"
                      ? `$${aiData.price_monthly}/mo`
                      : aiData.price === 0 ? "Free" : `$${aiData.price}`}
                  </p>
                </div>
                {productType === "event" && aiData.days_from_now && (
                  <div className="text-white/40 text-sm">
                    In {aiData.days_from_now} days · {aiData.duration_minutes} min · {aiData.max_attendees} spots
                  </div>
                )}
                {productType === "booking" && aiData.duration_minutes && (
                  <div className="text-white/40 text-sm">{aiData.duration_minutes} min session</div>
                )}
                {productType === "merch" && aiData.pod_provider && (
                  <div className="text-white/40 text-sm capitalize">via {aiData.pod_provider}</div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback input */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Tell AI what to change</p>
            <div className="flex gap-2">
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleRefine()}
                placeholder={`e.g. "make it more expensive" or "change the topic to fitness"`}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/50"
              />
              <button
                onClick={handleRefine}
                disabled={refining || !feedback.trim()}
                className="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-40"
              >
                {refining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => productType && generate(productType)}
              className="flex-1 h-12 rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 h-12 btn-gradient rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {publishing ? "Publishing..." : "Publish it!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Content by Type ──────────────────────────────────────────────────

function PreviewContent({
  aiData,
  type,
}: {
  aiData: AIData;
  type: ProductTypeId;
}) {
  if (type === "course" && aiData.modules) {
    return (
      <div className="space-y-3">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Full Course Outline</p>
        {aiData.modules.map((mod, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
            <p className="text-white/80 text-sm font-bold mb-2">{mod.title}</p>
            <div className="space-y-1.5">
              {mod.lessons.map((lesson, j) => (
                <p key={j} className="text-white/50 text-xs flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px] shrink-0 mt-0.5">{j + 1}</span>
                  {lesson}
                </p>
              ))}
            </div>
          </div>
        ))}
        {aiData.what_you_get && (
          <div className="flex flex-wrap gap-2 mt-1">
            {aiData.what_you_get.map((w, i) => (
              <span key={i} className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full">{w}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === "pdf" && aiData.sections) {
    return (
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
          {aiData.pages || 20}+ pages · Full preview
        </p>
        {/* Document-style preview */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* Document header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="w-16 h-1.5 bg-gray-300 rounded mb-2" />
            <p className="text-gray-800 font-black text-base">{aiData.title}</p>
            <p className="text-gray-500 text-xs mt-1">{aiData.pages || 20} pages · PDF Guide</p>
          </div>
          <div className="px-6 py-5 space-y-4 max-h-72 overflow-y-auto">
            {/* Description paragraph */}
            <p className="text-gray-600 text-sm leading-relaxed">{aiData.description}</p>
            {/* Table of contents */}
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">Table of Contents</p>
              <div className="space-y-2">
                {aiData.sections.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-gray-400 text-xs font-mono w-4 shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-gray-700 text-sm font-semibold">{s}</p>
                      {/* Simulated content lines */}
                      <div className="mt-1.5 space-y-1">
                        <div className="h-1.5 bg-gray-100 rounded w-full" />
                        <div className="h-1.5 bg-gray-100 rounded w-4/5" />
                        <div className="h-1.5 bg-gray-100 rounded w-3/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "preset" && aiData.items) {
    return (
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
          {aiData.count || 15} items included
        </p>
        <div className="flex flex-wrap gap-2">
          {aiData.items.map((item, i) => (
            <span key={i} className="bg-fuchsia-500/10 text-fuchsia-400 text-xs px-3 py-1 rounded-full">{item}</span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "event") {
    const eventEmojis: Record<string, string> = {
      webinar: "💻", zoom: "🎥", seminar: "🎤", livestream: "🔴", in_person: "📍",
    };
    return (
      <div className="flex flex-wrap gap-3">
        {aiData.type && (
          <span className="bg-yellow-500/10 text-yellow-400 text-sm px-3 py-1.5 rounded-xl font-medium">
            {eventEmojis[aiData.type] || "🎟️"} {aiData.type}
          </span>
        )}
        {aiData.duration_minutes && (
          <span className="bg-white/[0.05] text-white/50 text-sm px-3 py-1.5 rounded-xl">
            ⏱ {aiData.duration_minutes} min
          </span>
        )}
        {aiData.max_attendees && (
          <span className="bg-white/[0.05] text-white/50 text-sm px-3 py-1.5 rounded-xl">
            👥 {aiData.max_attendees} spots
          </span>
        )}
      </div>
    );
  }

  if (type === "subscription" && aiData.perks) {
    return (
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">What members get</p>
        <div className="space-y-2">
          {aiData.perks.map((perk, i) => (
            <p key={i} className="text-white/70 text-sm flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              {perk}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (type === "booking" && aiData.duration_minutes) {
    return (
      <div className="flex gap-3">
        <span className="bg-cyan-500/10 text-cyan-400 text-sm px-3 py-1.5 rounded-xl font-medium">
          📅 {aiData.duration_minutes} min
        </span>
        <span className="bg-white/[0.05] text-white/50 text-sm px-3 py-1.5 rounded-xl">
          1-on-1 session
        </span>
      </div>
    );
  }

  return null;
}
