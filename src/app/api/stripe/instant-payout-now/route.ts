import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, instant_payouts_enabled")
    .eq("user_id", user.id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.json({ error: "No Stripe account" }, { status: 400 });
  }
  if (!creator.instant_payouts_enabled) {
    return NextResponse.json({ error: "Instant payouts not enabled" }, { status: 400 });
  }

  const balance = await stripe.balance.retrieve(
    {},
    { stripeAccount: creator.stripe_account_id }
  );
  const available = balance.available.find((b) => b.currency === "usd");
  if (!available || available.amount <= 0) {
    return NextResponse.json({ error: "No available balance" }, { status: 400 });
  }

  const payout = await stripe.payouts.create(
    {
      amount: available.amount,
      currency: "usd",
      method: "instant",
    },
    { stripeAccount: creator.stripe_account_id }
  );

  return NextResponse.json({ ok: true, payout_id: payout.id, amount: payout.amount });
}
