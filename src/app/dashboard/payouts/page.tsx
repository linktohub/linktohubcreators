import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ConnectStripeButton } from "./connect-button";

export default async function PayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("id, stripe_account_id, stripe_account_enabled, total_revenue")
    .eq("user_id", user.id)
    .single();
  if (!creator) redirect("/onboarding");

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, total, creator_payout, status, created_at, shipping_name")
    .eq("creator_id", creator.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(20);

  const pendingPayout = (recentOrders || []).reduce((sum, o) => sum + (o.creator_payout || 0), 0);

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Payouts</h1>
          <p className="text-white/40 mt-1">Your earnings and payment setup</p>
        </div>
      </div>

      {/* Stripe Connect status */}
      <div className={`border rounded-2xl p-6 mb-6 ${creator.stripe_account_enabled ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-lg">{creator.stripe_account_enabled ? "✓ Payouts enabled" : "Set up payouts"}</h2>
            <p className="text-white/50 text-sm mt-1">
              {creator.stripe_account_enabled
                ? "Your Stripe account is connected. Payouts are automatic."
                : "Connect Stripe to receive direct payouts from every sale."}
            </p>
          </div>
          {!creator.stripe_account_enabled && <ConnectStripeButton />}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-black">${(creator.total_revenue || 0).toFixed(2)}</p>
          <p className="text-white/30 text-xs mt-1">All time</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-1">Your Payout</p>
          <p className="text-3xl font-black">${(pendingPayout / 100).toFixed(2)}</p>
          <p className="text-white/30 text-xs mt-1">90% of sales</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-1">Platform Fee</p>
          <p className="text-3xl font-black">10%</p>
          <p className="text-white/30 text-xs mt-1">Per transaction</p>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-lg font-bold mb-4">Transactions</h2>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-white/30" />
                  <div>
                    <p className="text-sm font-medium">{order.shipping_name || "Order"}</p>
                    <p className="text-white/30 text-xs">{format(new Date(order.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(order.total / 100).toFixed(2)}</p>
                  <p className="text-green-400 text-xs">+${(order.creator_payout / 100).toFixed(2)} payout</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-white/10 rounded-2xl">
            <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
