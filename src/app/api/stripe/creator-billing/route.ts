import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const PLAN_PRICES: Record<string, { priceId: string; amount: number }> = {
  starter:  { priceId: process.env.STRIPE_PRICE_STARTER!,  amount: 2900 },
  pro:      { priceId: process.env.STRIPE_PRICE_PRO!,      amount: 4900 },
  business: { priceId: process.env.STRIPE_PRICE_BUSINESS!, amount: 9900 },
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const tier = formData.get("tier") as string;
  const plan = PLAN_PRICES[tier];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: creator } = await supabase
    .from("creators")
    .select("id, email, plan_stripe_subscription_id")
    .eq("user_id", session.user.id)
    .single();
  if (!creator) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://linktohub.vercel.app";

  if (creator.plan_stripe_subscription_id) {
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: sub } = await admin
      .from("creator_subscriptions")
      .select("stripe_customer_id")
      .eq("creator_id", creator.id)
      .single();
    if (sub?.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: `${origin}/dashboard/billing`,
      });
      return NextResponse.redirect(portal.url, 303);
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/billing?upgraded=1`,
    cancel_url: `${origin}/dashboard/billing`,
    customer_email: creator.email || session.user.email || undefined,
    metadata: { creator_id: creator.id, plan_tier: tier },
  });

  return NextResponse.redirect(checkoutSession.url!, 303);
}
