import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { items, creatorId, customerEmail } = await req.json();

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

  const totalCents = items.reduce(
    (sum: number, item: { price: number; quantity: number }) =>
      sum + Math.round(item.price * 100) * item.quantity,
    0
  );

  // Fetch creator's connected Stripe account to route funds via transfer
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, stripe_account_enabled")
    .eq("id", creatorId)
    .single();

  const connectedAccountId =
    creator?.stripe_account_enabled && creator?.stripe_account_id
      ? (creator.stripe_account_id as string)
      : null;

  const intent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    metadata: {
      creator_id: creatorId,
      items: JSON.stringify(items.map((i: { id: string; quantity: number }) => ({ id: i.id, quantity: i.quantity }))),
    },
    receipt_email: customerEmail || undefined,
    automatic_payment_methods: { enabled: true },
    ...(connectedAccountId && {
      application_fee_amount: Math.round(totalCents * 0.1),
      transfer_data: { destination: connectedAccountId },
    }),
  });

  return NextResponse.json({ clientSecret: intent.client_secret, amount: totalCents });
}
