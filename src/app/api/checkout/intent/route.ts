import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type ShippingAddress = {
  name: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { items, creatorId, customerEmail, shipping } = await req.json() as {
    items: { id: string; name: string; price: number; quantity: number }[];
    creatorId: string;
    customerEmail?: string;
    shipping?: ShippingAddress;
  };

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });
  if (!creatorId) return NextResponse.json({ error: "Missing creatorId" }, { status: 400 });

  const totalCents = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0
  );

  const supabase = createAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, stripe_account_enabled")
    .eq("id", creatorId)
    .single();

  const platformFeeCents = Math.round(totalCents * 0.1);

  const intentParams: Stripe.PaymentIntentCreateParams = {
    amount: totalCents,
    currency: "usd",
    metadata: {
      creator_id: creatorId,
      items: JSON.stringify(
        items.map((i) => ({ id: i.id, quantity: i.quantity }))
      ),
    },
    receipt_email: customerEmail || undefined,
    automatic_payment_methods: { enabled: true },
  };

  if (creator?.stripe_account_id && creator.stripe_account_enabled) {
    intentParams.application_fee_amount = platformFeeCents;
    intentParams.transfer_data = { destination: creator.stripe_account_id };
  }

  if (shipping) {
    intentParams.shipping = {
      name: shipping.name,
      address: {
        line1: shipping.line1,
        city: shipping.city,
        postal_code: shipping.postal_code,
        country: shipping.country,
        state: shipping.state,
      },
    };
  }

  const intent = await stripe.paymentIntents.create(intentParams);

  return NextResponse.json({ clientSecret: intent.client_secret, amount: totalCents });
}
