import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Star, ArrowLeft } from "lucide-react";
import DeleteTierButton from "./delete-button";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
  if (!creator) redirect("/onboarding");

  const { data: tiers } = await supabase
    .from("subscription_tiers")
    .select("*")
    .eq("creator_id", creator.id)
    .order("price_monthly");

  // Get subscriber counts per tier
  const { data: subCounts } = await supabase
    .from("fan_subscriptions")
    .select("stripe_price_id, id")
    .eq("creator_id", creator.id)
    .eq("status", "active");

  const countByTier = (tiers || []).reduce<Record<string, number>>((acc, tier) => {
    acc[tier.id] = (subCounts || []).filter((s) => s.stripe_price_id === tier.stripe_price_id).length;
    return acc;
  }, {});

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">Subscriptions</h1>
            <p className="text-white/40 mt-1">Fan membership tiers</p>
          </div>
        </div>
        <Link href="/dashboard/subscriptions/new">
          <Button className="bg-white text-black hover:bg-white/90 font-bold gap-2">
            <Plus className="w-4 h-4" /> New Tier
          </Button>
        </Link>
      </div>

      {/* MRR summary */}
      {tiers && tiers.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-white/40 text-sm mb-1">Estimated MRR</p>
          <p className="text-4xl font-black">
            ${(tiers.reduce((acc, t) => acc + (t.price_monthly * (countByTier[t.id] || 0)), 0)).toFixed(2)}
          </p>
          <p className="text-white/30 text-xs mt-1">
            {Object.values(countByTier).reduce((a, b) => a + b, 0)} active subscribers
          </p>
        </div>
      )}

      {tiers && tiers.length > 0 ? (
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-black">{tier.name}</h3>
                  {tier.description && <p className="text-white/50 text-sm mt-0.5">{tier.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">${tier.price_monthly}<span className="text-sm font-normal text-white/40">/mo</span></p>
                  <p className="text-white/40 text-xs mt-0.5">{countByTier[tier.id] || 0} subscribers</p>
                </div>
              </div>
              {tier.perks && tier.perks.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {tier.perks.map((perk: string, i: number) => (
                    <li key={i} className="text-sm text-white/60 flex items-center gap-2">
                      <span className="text-green-400">✓</span> {perk}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/subscriptions/${tier.id}/edit`}>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Edit</Button>
                </Link>
                <DeleteTierButton tierId={tier.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-white/10 rounded-2xl">
          <Star className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg font-semibold mb-2">No tiers yet</p>
          <p className="text-white/30 text-sm mb-6">Create subscription tiers so fans can support you monthly</p>
          <Link href="/dashboard/subscriptions/new">
            <Button className="bg-white text-black hover:bg-white/90 font-bold">Create first tier</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
