"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, RefreshCw, Check } from "lucide-react";
import Link from "next/link";

type Suggestion = {
  name: string;
  description: string;
  price: number;
  emoji: string;
  image: string;
  item_type?: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", pod_provider: "gelato", active: true });

  useEffect(() => { generateSuggestions(); }, []);

  async function generateSuggestions() {
    setGenerating(true);
    setSuggestions([]);
    setSelected(null);
    try {
      const res = await fetch("/api/ai/suggest-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "merch" }),
      });
      const { data } = await res.json();
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        pick(data.suggestions[0]);
      }
    } catch { toast.error("Could not generate suggestions"); }
    setGenerating(false);
  }

  function pick(s: Suggestion) {
    setSelected(s);
    setForm((f) => ({ ...f, name: s.name, description: s.description, price: String(s.price) }));
  }

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error("Name and price required"); return; }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) { router.push("/onboarding"); return; }

    const { error } = await supabase.from("products").insert({
      creator_id: creator.id,
      type: "merch",
      name: form.name,
      title: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      pod_provider: form.pod_provider !== "none" ? form.pod_provider : null,
      active: form.active,
      images: selected?.image ? [selected.image] : [],
    });

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Product created!");
    router.push("/dashboard/products");
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/products" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Add Merch</h1>
          <p className="text-white/40 mt-1">AI picked these ideas for your brand</p>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">AI Suggestions</span>
          </div>
          <button onClick={generateSuggestions} disabled={generating} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-violet-400 transition-colors disabled:opacity-40">
            <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
            Regenerate
          </button>
        </div>

        {generating ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
                <div className="h-28 bg-white/[0.04]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                  <div className="h-2 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(s)}
                className={cn(
                  "rounded-2xl overflow-hidden border text-left transition-all",
                  selected?.name === s.name
                    ? "border-violet-500/60 ring-2 ring-violet-500/20"
                    : "border-white/[0.06] hover:border-white/20"
                )}
              >
                <div className="h-28 overflow-hidden relative">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  {selected?.name === s.name && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white/[0.02]">
                  <p className="font-bold text-white text-xs leading-snug line-clamp-2">{s.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">${s.price}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Product name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-12 bg-white/5 border-white/10 text-white" required />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[90px]" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Price (USD)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <Input value={form.price} onChange={(e) => set("price", e.target.value)} type="number" step="0.01" min="0" className="h-12 bg-white/5 border-white/10 text-white pl-8" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Fulfillment</Label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: "gelato", label: "Gelato" }, { id: "printful", label: "Printful" }, { id: "none", label: "Self-ship" }].map((p) => (
              <button key={p.id} type="button" onClick={() => set("pod_provider", p.id)}
                className={cn("py-3 rounded-xl border text-sm font-medium transition-colors",
                  form.pod_provider === p.id ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                )}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div>
            <p className="font-semibold text-sm">Publish immediately</p>
            <p className="text-white/40 text-xs">Show on storefront right away</p>
          </div>
          <button type="button" onClick={() => set("active", !form.active)}
            className={cn("w-12 h-6 rounded-full transition-colors relative", form.active ? "bg-white" : "bg-white/20")}>
            <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-black transition-all", form.active ? "left-7" : "left-1")} />
          </button>
        </div>

        <button type="submit" disabled={loading || generating}
          className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm disabled:opacity-50">
          {loading ? "Creating..." : "Create Product →"}
        </button>
      </form>
    </div>
  );
}
