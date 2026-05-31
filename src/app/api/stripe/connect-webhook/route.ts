import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const enabled = !!(account.charges_enabled && account.payouts_enabled);

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("creators")
      .update({ stripe_account_enabled: enabled })
      .eq("stripe_account_id", account.id);

    if (error) {
      console.error("[connect-webhook] DB update failed:", error.message);
    }
  }

  return NextResponse.json({ received: true });
}
