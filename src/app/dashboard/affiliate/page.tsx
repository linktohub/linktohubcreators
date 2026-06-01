"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Copy, Users, DollarSign, TrendingUp, Gift } from "lucide-react";
import Link from "next/link";

type AffiliateData = {
  referral_code: string;
  total_earned: number;
  commission_pct: number;
  referred_count: number;
  monthly_earnings: number;
};

export default function AffiliatePage() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creatorId, setCreatorId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
      if (!creator) return;
      setCreatorId(creator.id);

      const { data: aff } = await supabase.from("affiliates")
        .select("referral_code, total_earned, commission_pct, referred_count, monthly_earnings")
        .eq("referrer_creator_id", creator.id).single();

      if (aff) setData(aff as AffiliateData);
      setLoading(false);
    }
    load();
  }, []);

  async function generate() {
    setGenerating(true);
    const supabase = createClient();
    const { data: creator } = await supabase.from("creators").select("username").eq("id", creatorId).single();
    const code = `${creator?.username}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await supabase.from("affiliates").upsert({
      referrer_creator_id: creatorId,
      referral_code: code,
      commission_pct: 0.25,
      referred_count: 0,
      monthly_earnings: 0,
    }, { onConflict: "referrer_creator_id" });
    setData({ referral_code: code, total_earned: 0, commission_pct: 0.25, referred_count: 0, monthly_earnings: 0 });
    setGenerating(false);
    toast.success("Affiliate link generated!");
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  const referralUrl = data ? `https://linktohub.vercel.app/ref/${data.referral_code}` : "";
  const monthlyIfTheyJoin = data ? Math.round(49 * (data.commission_pct || 0.25)) : 12;

  if (loading) return <div className="p-6 text-white/40">Loading...</div>;

  return (
    <div className="p-5 pb-28 md:pb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Affiliate Program</h1>
          <p className="text-white/40 mt-1 text-sm">Earn 25% recurring for every creator you refer — forever</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border border-violet-500/20 rounded-2xl p-6 mb-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-violet-400" />
          How it works
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "1", label: "Share your link", desc: "Send it to creators in your network" },
            { step: "2", label: "They sign up", desc: "They start their 14-day free trial" },
            { step: "3", label: "You earn 25%", desc: `$${monthlyIfTheyJoin}/mo per creator, forever` },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-white font-black text-sm mx-auto mb-2">{s.step}</div>
              <p className="font-bold text-sm text-white">{s.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Users, label: "Creators referred", value: data.referred_count || 0, suffix: "" },
            { icon: DollarSign, label: "Monthly earnings", value: `$${(data.monthly_earnings || 0).toFixed(2)}`, suffix: "/mo" },
            { icon: TrendingUp, label: "Total earned", value: `$${(data.total_earned || 0).toFixed(2)}`, suffix: "" },
            { icon: Gift, label: "Commission rate", value: `${((data.commission_pct || 0.25) * 100).toFixed(0)}%`, suffix: " recurring" },
          ].map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-violet-400" />
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
              </div>
              <p className="text-2xl font-black text-white">{value}<span className="text-white/30 text-sm font-normal">{suffix}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Referral link */}
      {data ? (
        <div className="space-y-3 mb-6">
          <h2 className="font-bold text-sm text-white/60 uppercase tracking-wider">Your referral link</h2>
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <code className="flex-1 text-sm text-white/70 font-mono truncate">{referralUrl}</code>
            <button onClick={() => copy(referralUrl)}
              className="flex items-center gap-1.5 btn-gradient text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0">
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => copy(`Hey! I'm using Linktohub to run my entire creator business. AI builds all my products, handles my merch, courses, events — everything. Join with my link and get 14 days free: ${referralUrl}`)}
              className="h-11 rounded-xl border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Copy className="w-3.5 h-3.5" />
              Copy DM script
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Join Linktohub", text: "The AI that runs your creator business", url: referralUrl });
                } else {
                  copy(referralUrl);
                }
              }}
              className="h-11 btn-gradient rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2">
              Share link
            </button>
          </div>
        </div>
      ) : (
        <button onClick={generate} disabled={generating}
          className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm disabled:opacity-50 mb-6">
          {generating ? "Generating..." : "Generate my affiliate link"}
        </button>
      )}

      {/* Potential earnings calculator */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">What you could earn</h3>
        <div className="space-y-3">
          {[
            { creators: 5, label: "5 creators → $245/mo passive" },
            { creators: 20, label: "20 creators → $980/mo passive" },
            { creators: 50, label: "50 creators → $2,450/mo passive" },
            { creators: 100, label: "100 creators → $4,900/mo passive" },
          ].map(({ creators, label }) => (
            <div key={creators} className="flex items-center justify-between">
              <p className="text-white/60 text-sm">{label}</p>
              <p className="text-emerald-400 text-sm font-bold">${(creators * 49 * 0.25).toFixed(0)}/mo</p>
            </div>
          ))}
        </div>
        <p className="text-white/25 text-xs mt-4">Based on Pro plan ($49/mo) at 25% commission. Paid monthly.</p>
      </div>
    </div>
  );
}
