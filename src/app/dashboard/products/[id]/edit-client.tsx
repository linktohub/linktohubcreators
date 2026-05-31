"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Sparkles, RefreshCw, Plus, Trash2, FileDown, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Module = { title: string; lessons: string[] };
type ProductMetadata = {
  modules?: Module[];
  what_you_get?: string[];
  sections?: string[];
  pages?: number;
  items?: string[];
  count?: number;
  duration_minutes?: number;
  perks?: string[];
};

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
  file_url: string | null;
  metadata: ProductMetadata | null;
};

const TYPE_LABEL: Record<string, string> = {
  merch: "👕 Merch",
  digital: "📚 Digital",
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  const [form, setForm] = useState({
    title: product.title || "",
    description: product.description || "",
    price: String(product.price),
    active: product.active,
  });

  const [metadata, setMetadata] = useState<ProductMetadata>(product.metadata || {});

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Course module editing
  function updateModule(i: number, field: "title", value: string) {
    setMetadata((m) => {
      const modules = [...(m.modules || [])];
      modules[i] = { ...modules[i], [field]: value };
      return { ...m, modules };
    });
  }
  function updateLesson(moduleIdx: number, lessonIdx: number, value: string) {
    setMetadata((m) => {
      const modules = [...(m.modules || [])];
      const lessons = [...(modules[moduleIdx]?.lessons || [])];
      lessons[lessonIdx] = value;
      modules[moduleIdx] = { ...modules[moduleIdx], lessons };
      return { ...m, modules };
    });
  }
  function addLesson(moduleIdx: number) {
    setMetadata((m) => {
      const modules = [...(m.modules || [])];
      modules[moduleIdx] = { ...modules[moduleIdx], lessons: [...(modules[moduleIdx]?.lessons || []), "New lesson"] };
      return { ...m, modules };
    });
  }
  function removeLesson(moduleIdx: number, lessonIdx: number) {
    setMetadata((m) => {
      const modules = [...(m.modules || [])];
      const lessons = modules[moduleIdx].lessons.filter((_, i) => i !== lessonIdx);
      modules[moduleIdx] = { ...modules[moduleIdx], lessons };
      return { ...m, modules };
    });
  }
  function addModule() {
    setMetadata((m) => ({ ...m, modules: [...(m.modules || []), { title: "New Module", lessons: ["Lesson 1"] }] }));
  }
  function removeModule(i: number) {
    setMetadata((m) => ({ ...m, modules: (m.modules || []).filter((_, idx) => idx !== i) }));
  }

  // Section/item list editing (PDF, preset, subscription perks)
  function updateListItem(field: "sections" | "items" | "what_you_get", i: number, value: string) {
    setMetadata((m) => {
      const arr = [...((m[field] as string[]) || [])];
      arr[i] = value;
      return { ...m, [field]: arr };
    });
  }
  function addListItem(field: "sections" | "items" | "what_you_get", defaultVal: string) {
    setMetadata((m) => ({ ...m, [field]: [...((m[field] as string[]) || []), defaultVal] }));
  }
  function removeListItem(field: "sections" | "items" | "what_you_get", i: number) {
    setMetadata((m) => ({ ...m, [field]: ((m[field] as string[]) || []).filter((_, idx) => idx !== i) }));
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
        if (data.title || data.name) setForm((f) => ({ ...f, title: data.title || data.name || f.title, description: data.description || f.description, price: String(data.price || f.price) }));
        if (data.modules) setMetadata((m) => ({ ...m, modules: data.modules, what_you_get: data.what_you_get || m.what_you_get }));
        if (data.sections) setMetadata((m) => ({ ...m, sections: data.sections, pages: data.pages || m.pages }));
        if (data.items) setMetadata((m) => ({ ...m, items: data.items, count: data.count || m.count }));
        setFeedback("");
        toast.success("AI updated it");
      }
    } catch { toast.error("AI refresh failed"); }
    setRefining(false);
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    toast.info("Generating your PDF — this takes about 30 seconds...");
    try {
      // First save the current metadata
      const supabase = createClient();
      await supabase.from("products").update({ title: form.title, description: form.description || null, price: parseFloat(form.price), metadata }).eq("id", product.id);

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (data.url) {
        toast.success("PDF generated! Opening preview...");
        window.open(data.url, "_blank");
      } else {
        toast.error("PDF generation failed");
      }
    } catch { toast.error("PDF generation failed"); }
    setGeneratingPdf(false);
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
      metadata,
    }).eq("id", product.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Saved!");
    router.push("/dashboard/products");
  }

  const label = product.file_type ? FILE_LABEL[product.file_type] || product.file_type : TYPE_LABEL[product.type] || product.type;
  const isCourse = product.file_type === "course";
  const isPdf = product.file_type === "pdf";
  const isPreset = product.file_type === "preset";

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
          <p className="text-violet-300 text-sm font-semibold">Ask AI to improve anything</p>
        </div>
        <div className="flex gap-2">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAIRefine()}
            placeholder={`e.g. "make the price $197" or "add a module on marketing"`}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-violet-500/50" />
          <button onClick={handleAIRefine} disabled={refining}
            className="px-4 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-40">
            {refining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-12 bg-white/5 border-white/10 text-white" required />
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
        </div>

        {/* Course modules editing */}
        {isCourse && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Course Outline</Label>
              <button type="button" onClick={addModule} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add module
              </button>
            </div>
            {(metadata.modules || []).map((mod, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-white/[0.06]">
                  <button type="button" onClick={() => setExpandedModule(expandedModule === i ? null : i)} className="text-white/30 hover:text-white/60">
                    {expandedModule === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <input value={mod.title} onChange={(e) => updateModule(i, "title", e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/30"
                    placeholder="Module title" />
                  <button type="button" onClick={() => removeModule(i)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expandedModule === i && (
                  <div className="p-3 space-y-2">
                    {(mod.lessons || []).map((lesson, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center shrink-0">{j + 1}</span>
                        <input value={lesson} onChange={(e) => updateLesson(i, j, e.target.value)}
                          className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-violet-500/40"
                          placeholder="Lesson title" />
                        <button type="button" onClick={() => removeLesson(i, j)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addLesson(i)} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-violet-400 transition-colors mt-1">
                      <Plus className="w-3 h-3" /> Add lesson
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={handleGeneratePdf} disabled={generatingPdf}
              className="w-full h-11 flex items-center justify-center gap-2 border border-violet-500/30 rounded-xl text-violet-400 hover:bg-violet-500/10 transition-colors text-sm font-semibold disabled:opacity-50">
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {generatingPdf ? "Generating PDF..." : "Generate & Preview as PDF"}
            </button>
          </div>
        )}

        {/* PDF sections editing */}
        {isPdf && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Sections ({metadata.pages || 20}+ pages)</Label>
              <button type="button" onClick={() => addListItem("sections", "New section")} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add section
              </button>
            </div>
            {(metadata.sections || []).map((section, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-white/30 text-xs w-5 shrink-0">{i + 1}.</span>
                <input value={section} onChange={(e) => updateListItem("sections", i, e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/40"
                  placeholder="Section title" />
                <button type="button" onClick={() => removeListItem("sections", i)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={handleGeneratePdf} disabled={generatingPdf}
              className="w-full h-11 flex items-center justify-center gap-2 border border-violet-500/30 rounded-xl text-violet-400 hover:bg-violet-500/10 transition-colors text-sm font-semibold disabled:opacity-50">
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {generatingPdf ? "Generating..." : "Generate real PDF to preview & sell"}
            </button>
          </div>
        )}

        {/* Preset items editing */}
        {isPreset && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs uppercase tracking-wider">What&apos;s included</Label>
              <button type="button" onClick={() => addListItem("items", "New item")} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>
            {(metadata.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={item} onChange={(e) => updateListItem("items", i, e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/40"
                  placeholder="Item name" />
                <button type="button" onClick={() => removeListItem("items", i)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PDF preview link if already generated */}
        {product.file_url && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <FileDown className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-emerald-400 text-sm font-semibold">PDF ready</p>
              <p className="text-white/40 text-xs mt-0.5">Your content is generated and ready to sell</p>
            </div>
            <a href={product.file_url} target="_blank" rel="noopener noreferrer"
              className="text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors shrink-0">
              Preview →
            </a>
          </div>
        )}

        {/* Live toggle */}
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
