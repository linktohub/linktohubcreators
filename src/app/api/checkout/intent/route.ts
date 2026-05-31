import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { items, creatorId, customerEmail } = await req.json();

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

  const totalCents = items.reduce(
    (sum: number, item: { price: number; quantity: number }) =>
      sum + Math.round(item.price * 100) * item.quantity,
    0
  );

  const intent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    metadata: {
      creator_id: creatorId,
      items: JSON.stringify(items.map((i: { id: string; quantity: number }) => ({ id: i.id, quantity: i.quantity }))),
    },
    receipt_email: customerEmail || undefined,
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: intent.client_secret, amount: totalCents });
}
