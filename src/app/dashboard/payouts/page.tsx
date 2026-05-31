import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, ArrowLeft, CheckCircle2, Banknote, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { stripe } from "@/lib/stripe";
import SetupPayoutsButton from "./setup-payouts-button";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const { setup } = await searchParams;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("id, stripe_account_id, stripe_account_enabled, total_revenue, display_name, email")
    .eq("user_id", session.user.id)
    .single();
  if (!creator) redirect("/onboarding");

  // Auto-create Stripe account silently if they don't have one yet
  if (!creator.stripe_account_id) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        email: creator.email || session.user.email || undefined,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      await supabase.from("creators").update({ stripe_account_id: account.id }).eq("id", creator.id);
      creator.stripe_account_id = account.id;
    } catch { /* non-fatal */ }
  }

  // After setup redirect — verify account status
  if (setup === "1" && creator.stripe_account_id && !creator.stripe_account_enabled) {
    try {
      const account = await stripe.accounts.retrieve(creator.stripe_account_id as string);
      if (account.charges_enabled) {
        await supabase.from("creators").update({ stripe_account_enabled: true }).eq("id", creator.id);
        creator.stripe_account_enabled = true;
      }
    } catch { /* non-critical */ }
  }

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, total, creator_payout, status, created_at, shipping_name")
    .eq("creator_id", creator.id)
    .in("status", ["paid", "fulfilled"])
    .order("created_at", { ascending: false })
    .limit(30);

  const totalEarned = (recentOrders || []).reduce((sum, o) => sum + (o.creator_payout || 0), 0);
  const justConnected = setup === "1" && creator.stripe_account_enabled;
  const payoutsReady = creator.stripe_account_enabled;

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Earnings</h1>
          <p className="text-white/40 mt-1 text-sm">Your money, automatically</p>
        </div>
      </div>

      {/* Success banner */}
      {justConnected && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-300 font-bold text-sm">Bank account connected!</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">Every sale automatically transfers to your account within 2 business days.</p>
          </div>
        </div>
      )}

      {/* Bank account setup — shown only if not connected */}
      {!payoutsReady && (
        <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border border-violet-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-5 h-5 text-violet-400" />
                <h2 className="font-bold text-lg">Add your bank account</h2>
              </div>
              <p className="text-white/50 text-sm max-w-sm">
                Add your bank account once and every sale goes straight to you — automatically. Takes 2 minutes.
              </p>
            </div>
            <SetupPayoutsButton creatorId={creator.id} />
          </div>
          <p className="text-white/25 text-xs mt-4">🔒 Bank-level encryption. Your info is never stored on our servers.</p>
        </div>
      )}

      {/* Active payout status */}
      {payoutsReady && (
        <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-300 font-semibold text-sm">Payouts active</p>
            <p className="text-white/40 text-xs mt-0.5">Sales transfer to your bank within 2 business days, automatically.</p>
          </div>
        </div>
      )}

      {/* Earnings cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium">Total earned</p>
          </div>
          <p className="text-3xl font-black text-white">${(creator.total_revenue || 0).toFixed(2)}</p>
          <p className="text-white/25 text-xs mt-1">All time revenue</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-violet-400" />
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium">Your share</p>
          </div>
          <p className="text-3xl font-black text-white">${(totalEarned / 100).toFixed(2)}</p>
          <p className="text-white/25 text-xs mt-1">90% of every sale</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium">Platform fee</p>
          </div>
          <p className="text-3xl font-black text-white">10%</p>
          <p className="text-white/25 text-xs mt-1">We keep 10¢ per $1</p>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Sales history</h2>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{order.shipping_name || "Sale"}</p>
                    <p className="text-white/30 text-xs">{format(new Date(order.created_at), "MMM d, yyyy · h:mm a")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">${(order.total / 100).toFixed(2)}</p>
                  <p className="text-emerald-400 text-xs font-medium">+${(order.creator_payout / 100).toFixed(2)} to you</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/[0.06] rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-semibold">No sales yet</p>
            <p className="text-white/25 text-sm mt-1">Share your storefront link to start earning</p>
          </div>
        )}
      </div>
    </div>
  );
}
