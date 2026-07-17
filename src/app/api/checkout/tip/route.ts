import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { creatorId, amount, message, successUrl, cancelUrl } = await req.json();
  if (!creatorId || !amount || amount < 1) return NextResponse.json({ error: "Invalid tip" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: creator } = await admin.from("creators").select("display_name, stripe_account_id, stripe_account_enabled, transaction_fee_pct").eq("id", creatorId).single();

  const amountCents = Math.round(parseFloat(amount) * 100);

  const checkoutParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: amountCents,
        product_data: { name: `Tip for ${creator?.display_name || "Creator"}${message ? ` — "${message}"` : ""}` },
      },
      quantity: 1,
    }],
    success_url: `${successUrl}?tipped=1`,
    cancel_url: cancelUrl,
    metadata: { creator_id: creatorId, type: "tip", message: message || "" },
  };

  if (creator?.stripe_account_id && creator?.stripe_account_enabled) {
    checkoutParams.payment_intent_data = {
      application_fee_amount: Math.round(amountCents * ((creator?.transaction_fee_pct as number) ?? 0.06)),
      transfer_data: { destination: creator.stripe_account_id },
    };
  }

  const session = await stripe.checkout.sessions.create(checkoutParams);
  return NextResponse.json({ url: session.url });
}
