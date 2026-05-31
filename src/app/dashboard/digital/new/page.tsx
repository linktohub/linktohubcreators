"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, RefreshCw, Upload, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const FILE_TYPES = [
  { id: "course", label: "🎓 Course", desc: "AI builds full outline" },
  { id: "pdf", label: "📄 PDF Guide", desc: "AI writes the outline" },
  { id: "preset", label: "🎨 Preset Pack", desc: "AI suggests contents" },
  { id: "video", label: "🎬 Video", desc: "Upload your video" },
];

type Module = { title: string; lessons: string[] };
type AIData = {
  name: string;
  description: string;
  price: number;
  image: string;
  modules?: Module[];
  what_you_get?: string[];
  sections?: string[];
  pages?: number;
  count?: number;
  items?: string[];
};

export default function NewDigitalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [form, setForm] = useState({
    file_type: "course",
    name: "", description: "", price: "",
    file_url: "", active: true,
  });

  useEffect(() => {
    if (form.file_type !== "video") generate(form.file_type);
  }, [form.file_type]);

  async function generate(type: string) {
    setGenerating(true);
    setAiData(null);
    try {
      const res = await fetch("/api/ai/suggest-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const { data } = await res.json();
      if (data) {
        setAiData(data);
        setForm((f) => ({ ...f, name: data.name, description: data.description, price: String(data.price) }));
      }
    } catch { toast.error("Could not generate suggestion"); }
    setGenerating(false);
  }

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `digital/${user.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("products").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(data.path);
    set("file_url", publicUrl);
    toast.success("File uploaded");
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name required"); return; }
    if (form.file_type === "video" && !form.file_url) { toast.error("Upload your video file"); return; }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) { router.push("/onboarding"); return; }

    const metadata = aiData?.modules ? { modules: aiData.modules, what_you_get: aiData.what_you_get } : {};

    const { error } = await supabase.from("products").insert({
      creator_id: creator.id,
      type: "digital",
      name: form.name,
      title: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      file_type: form.file_type,
      file_url: form.file_url || null,
      active: form.active,
      images: aiData?.image ? [aiData.image] : [],
      metadata,
    });

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Digital product created!");
    router.push("/dashboard/digital");
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/digital" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Add Digital Product</h1>
          <p className="text-white/40 mt-1">AI writes it for you</p>
        </div>
      </div>

      {/* Type picker */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {FILE_TYPES.map((t) => (
          <button key={t.id} type="button" onClick={() => set("file_type", t.id)}
            className={cn("p-4 rounded-2xl border text-left transition-all",
              form.file_type === t.id ? "border-violet-500/60 bg-violet-500/[0.08]" : "border-white/[0.06] hover:border-white/20 bg-white/[0.02]"
            )}>
            <p className="font-bold text-sm text-white">{t.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* AI Generated Content */}
      {form.file_type !== "video" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                {generating ? "AI is writing..." : "AI Generated"}
              </span>
            </div>
            <button onClick={() => generate(form.file_type)} disabled={generating}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-violet-400 transition-colors disabled:opacity-40">
              <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
              Regenerate
            </button>
          </div>

          {generating ? (
            <div className="card-glass rounded-2xl p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-2/3" />
              <div className="h-3 bg-white/[0.04] rounded w-full" />
              <div className="h-3 bg-white/[0.04] rounded w-4/5" />
              <div className="h-32 bg-white/[0.04] rounded-xl mt-4" />
            </div>
          ) : aiData && (
            <div className="card-glass rounded-2xl overflow-hidden">
              {/* Preview image */}
              {aiData.image && (
                <div className="h-40 overflow-hidden">
                  <img src={aiData.image} alt={aiData.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-black text-white text-lg mb-1">{aiData.name}</h3>
                <p className="text-white/50 text-sm mb-4">{aiData.description}</p>

                {/* Course modules */}
                {aiData.modules && (
                  <div className="space-y-2 mb-4">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Course Outline</p>
                    {aiData.modules.map((mod, i) => (
                      <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden">
                        <button type="button" onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left">
                          <span className="text-white/80 text-sm font-semibold">{mod.title}</span>
                          {expandedModule === i ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                        </button>
                        {expandedModule === i && (
                          <div className="px-4 pb-3 space-y-1">
                            {mod.lessons.map((lesson, j) => (
                              <p key={j} className="text-white/40 text-xs flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px] shrink-0">{j + 1}</span>
                                {lesson}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* PDF sections */}
                {aiData.sections && (
                  <div className="space-y-1 mb-4">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Sections ({aiData.pages || 20}+ pages)</p>
                    {aiData.sections.map((s, i) => (
                      <p key={i} className="text-white/50 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                        {s}
                      </p>
                    ))}
                  </div>
                )}

                {/* What you get */}
                {aiData.what_you_get && (
                  <div className="flex flex-wrap gap-2">
                    {aiData.what_you_get.map((w, i) => (
                      <span key={i} className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full">{w}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {form.file_type === "video" && (
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Video file</Label>
            {form.file_url ? (
              <div className="flex items-center gap-3 bg-white/5 border border-emerald-500/30 rounded-xl p-4">
                <span className="text-emerald-400 text-sm">✓ Video uploaded</span>
                <button type="button" onClick={() => set("file_url", "")} className="text-white/40 text-xs hover:text-white ml-auto">Remove</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-8 cursor-pointer hover:border-violet-500/40 transition-colors">
                <Upload className="w-8 h-8 text-white/30 mb-2" />
                <p className="text-white/50 text-sm">{uploading ? "Uploading..." : "Click to upload video"}</p>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Title</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-12 bg-white/5 border-white/10 text-white" required />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[90px]" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs uppercase tracking-wider">Price (0 = free)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <Input value={form.price} onChange={(e) => set("price", e.target.value)} type="number" step="0.01" min="0" className="h-12 bg-white/5 border-white/10 text-white pl-8" />
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
