"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewTierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price_monthly: "" });
  const [perks, setPerks] = useState<string[]>([""]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPerk(i: number, value: string) {
    setPerks((p) => { const n = [...p]; n[i] = value; return n; });
  }

  function addPerk() { setPerks((p) => [...p, ""]); }
  function removePerk(i: number) { setPerks((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price_monthly) { toast.error("Name and price required"); return; }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) { router.push("/onboarding"); return; }

    const cleanPerks = perks.filter((p) => p.trim());

    const { error } = await supabase.from("subscription_tiers").insert({
      creator_id: creator.id,
      name: form.name,
      description: form.description || null,
      price_monthly: parseFloat(form.price_monthly),
      perks: cleanPerks,
      active: true,
    });

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Tier created!");
    router.push("/dashboard/subscriptions");
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/subscriptions">
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black">New Tier</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-white/70">Tier name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="VIP Member" className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" required />
        </div>

        <div className="space-y-2">
          <Label className="text-white/70">Monthly price (USD)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <Input value={form.price_monthly} onChange={(e) => set("price_monthly", e.target.value)} type="number" step="0.01" min="1" placeholder="9.99" className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-8" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/70">Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What subscribers get..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>

        <div className="space-y-2">
          <Label className="text-white/70">Perks</Label>
          <div className="space-y-2">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={perk} onChange={(e) => setPerk(i, e.target.value)} placeholder={`Perk ${i + 1}`} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1" />
                {perks.length > 1 && (
                  <button type="button" onClick={() => removePerk(i)} className="text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addPerk} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add perk
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-base">
          {loading ? "Creating..." : "Create Tier →"}
        </Button>
      </form>
    </div>
  );
}
