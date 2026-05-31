import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const creatorId = pi.metadata.creator_id;
    const items = JSON.parse(pi.metadata.items || "[]");

    await supabase.from("orders").insert({
      creator_id: creatorId,
      stripe_payment_intent_id: pi.id,
      total: pi.amount,
      creator_payout: Math.round(pi.amount * 0.9),
      status: "paid",
      items,
    });

    try {
      await supabase.rpc("increment_creator_revenue", {
        p_creator_id: creatorId,
        p_amount: pi.amount / 100,
      });
    } catch { /* non-critical */ }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    if (account.charges_enabled) {
      await supabase
        .from("creators")
        .update({ stripe_account_enabled: true })
        .eq("stripe_account_id", account.id);
    }
  }

  return NextResponse.json({ received: true });
}
