"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  active: boolean;
  type: string;
  file_type: string | null;
  pod_provider: string | null;
  images: string[] | null;
};

const TYPE_LABEL: Record<string, string> = {
  merch: "👕 Merch",
  digital: "📚 Digital Product",
  booking: "📅 Booking",
};

const FILE_LABEL: Record<string, string> = {
  course: "🎓 Course",
  pdf: "📄 PDF Guide",
  preset: "🎨 Preset Pack",
  video: "🎬 Video",
};

export default function EditProductClient({ product }: { product: Product }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    title: product.title || "",
    description: product.description || "",
    price: String(product.price),
    active: product.active,
  });

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAIRefine() {
    if (!feedback.trim()) { toast.error("Tell AI what to change"); return; }
    setRefining(true);
    try {
      const type = product.file_type || product.type;
      const res = await fetch("/api/ai/suggest-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          feedback: feedback.trim(),
          previousData: { title: form.title, description: form.description, price: parseFloat(form.price) },
        }),
      });
      const { data } = await res.json();
      if (data) {
        setForm((f) => ({
          ...f,
          title: data.title || data.name || f.title,
          description: data.description || f.description,
          price: String(data.price || f.price),
        }));
        setFeedback("");
        toast.success("AI updated it for you");
      }
    } catch { toast.error("AI refresh failed"); }
    setRefining(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error("Title and price required"); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("products").update({
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price),
      active: form.active,
    }).eq("id", product.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Saved!");
    router.push("/dashboard/products");
  }

  const label = product.file_type ? FILE_LABEL[product.file_type] || product.file_type : TYPE_LABEL[product.type] || product.type;

  return (
    <div className="p-6 pb-28 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/products" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Edit Product</h1>
          <p className="text-white/40 mt-1 text-sm">{label}</p>
        </div>
      </div>

      {product.images?.[0] && (
        <div className="w-full h-40 rounded-2xl overflow-hidden mb-6">
          <img src={product.images[0]} alt={form.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* AI refine */}
      <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <p className="text-violet-300 text-sm font-semibold">Tell AI what to change</p>
        </div>
        <div className="flex gap-2">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAIRefine()}
            placeholder={`e.g. "make the price higher" or "focus more on beginners"`}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/50" />
          <button onClick={handleAIRefine} disabled={refining}
            className="px-4 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-40">
            {refining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[100px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Price (USD)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <Input value={form.price} onChange={(e) => set("price", e.target.value)}
              type="number" step="0.01" min="0"
              className="h-12 bg-white/5 border-white/10 text-white pl-8" required />
          </div>
        </div>
        <div className="flex items-center justify-between py-4 border-t border-white/[0.07]">
          <div>
            <p className="font-semibold text-sm">Live on storefront</p>
            <p className="text-white/35 text-xs mt-0.5">Visible to your audience</p>
          </div>
          <button type="button" onClick={() => set("active", !form.active)}
            className={cn("w-12 h-6 rounded-full transition-colors relative", form.active ? "bg-emerald-500" : "bg-white/20")}>
            <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", form.active ? "left-7" : "left-1")} />
          </button>
        </div>
        <button type="submit" disabled={saving}
          className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
