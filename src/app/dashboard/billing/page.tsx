import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Zap, Crown } from "lucide-react";
import Link from "next/link";

const PLANS = [
  { tier: "starter" as const, name: "Starter", price: 29, fee: "6%", color: "border-white/10" },
  { tier: "pro" as const, name: "Pro", price: 49, fee: "4.5%", color: "border-violet-500/40", popular: true },
  { tier: "business" as const, name: "Business", price: 99, fee: "3%", color: "border-fuchsia-500/30" },
];

const TIER_FEATURES: Record<string, string[]> = {
  trial: ["14-day free access", "10% transaction fee", "All core features"],
  starter: ["Everything + 6% fee", "Email marketing included", "Custom domain"],
  pro: ["Everything + 4.5% fee", "Priority AI", "Affiliate program", "Remove branding"],
  business: ["Everything + 3% fee", "Agency mode", "Dedicated success manager", "Instant payouts"],
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("id, plan_tier, plan_expires_at, transaction_fee_pct, total_revenue")
    .eq("user_id", session.user.id)
    .single();

  if (!creator) redirect("/onboarding");

  const tier = (creator.plan_tier as string) || "trial";
  const isTrialing = tier === "trial";
  const trialExpires = creator.plan_expires_at ? new Date(creator.plan_expires_at) : null;
  const daysLeft = trialExpires ? Math.max(0, Math.ceil((trialExpires.getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="p-5 pb-28 md:pb-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Plan & Billing</h1>
          <p className="text-white/40 mt-1 text-sm">Manage your Linktohub subscription</p>
        </div>
      </div>

      {/* Current plan status */}
      <div className={`rounded-2xl p-6 mb-6 border ${isTrialing ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/[0.06] border-emerald-500/20"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isTrialing ? <Zap className="w-4 h-4 text-amber-400" /> : <Crown className="w-4 h-4 text-emerald-400" />}
              <p className={`font-bold text-sm ${isTrialing ? "text-amber-300" : "text-emerald-300"}`}>
                {isTrialing ? `Free Trial — ${daysLeft} days left` : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan — Active`}
              </p>
            </div>
            <p className="text-white/50 text-sm">
              {isTrialing
                ? "Your trial ends soon. Choose a plan to keep earning."
                : `You keep ${(100 - (creator.transaction_fee_pct || 0.10) * 100).toFixed(0)}% of every sale.`}
            </p>
            {TIER_FEATURES[tier] && (
              <ul className="mt-3 space-y-1">
                {TIER_FEATURES[tier].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-white">
              {(creator.transaction_fee_pct * 100).toFixed(0)}%
            </p>
            <p className="text-white/30 text-xs">platform fee</p>
          </div>
        </div>
      </div>

      {/* Plan options */}
      <h2 className="text-lg font-bold mb-4">{isTrialing ? "Choose your plan" : "Change plan"}</h2>
      <div className="grid gap-4 mb-8">
        {PLANS.map((plan) => (
          <div key={plan.tier}
            className={`flex items-center justify-between p-5 rounded-2xl border ${plan.color} bg-white/[0.02] ${tier === plan.tier ? "bg-violet-500/10 border-violet-500/40" : ""}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white">{plan.name}</p>
                {plan.popular && (
                  <span className="text-[10px] font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full">POPULAR</span>
                )}
                {tier === plan.tier && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">CURRENT</span>
                )}
              </div>
              <p className="text-white/40 text-sm">{plan.fee} transaction fee</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xl font-black text-white">${plan.price}</p>
                <p className="text-white/30 text-xs">/month</p>
              </div>
              {tier !== plan.tier && (
                <form action="/api/stripe/creator-billing" method="POST">
                  <input type="hidden" name="tier" value={plan.tier} />
                  <button type="submit"
                    className="px-4 py-2 rounded-xl btn-gradient text-white text-sm font-bold">
                    {tier === "trial" || PLANS.findIndex(p => p.tier === tier) < PLANS.findIndex(p => p.tier === plan.tier) ? "Upgrade" : "Downgrade"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue math */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-sm text-white/60 uppercase tracking-wider mb-4">Your earnings breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Your all-time revenue</span>
            <span className="font-bold text-white">${(creator.total_revenue || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Platform fee (current)</span>
            <span className="font-bold text-white/50">{((creator.transaction_fee_pct || 0.10) * 100).toFixed(0)}%</span>
          </div>
          <div className="border-t border-white/[0.07] pt-3 flex justify-between text-sm">
            <span className="text-white/50">You kept</span>
            <span className="font-bold text-emerald-400">${((creator.total_revenue || 0) * (1 - (creator.transaction_fee_pct || 0.10))).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Link href="/pricing" className="flex items-center gap-2 text-violet-400 text-sm hover:text-violet-300 transition-colors">
        View full plan comparison →
      </Link>
    </div>
  );
}
