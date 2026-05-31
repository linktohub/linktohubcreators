import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Login required", auth: true }, { status: 401 });

  const { tierId, creatorId, successUrl, cancelUrl } = await req.json();
  if (!tierId || !creatorId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get or create fan profile
  let { data: profile } = await admin.from("profiles").select("id, stripe_customer_id").eq("user_id", session.user.id).single();
  if (!profile) {
    const { data: newProfile } = await admin.from("profiles").insert({
      user_id: session.user.id,
      email: session.user.email,
    }).select("id, stripe_customer_id").single();
    profile = newProfile;
  }

  // Get tier
  const { data: tier } = await admin.from("subscription_tiers").select("*, creators(stripe_account_id, stripe_account_enabled, display_name)").eq("id", tierId).single();
  if (!tier) return NextResponse.json({ error: "Tier not found" }, { status: 404 });

  // Ensure Stripe Price exists for this tier
  let stripePriceId = tier.stripe_price_id as string | null;
  if (!stripePriceId) {
    const product = await stripe.products.create({
      name: `${tier.name} — ${(tier.creators as { display_name?: string })?.display_name || "Creator"} Membership`,
      metadata: { tier_id: tierId, creator_id: creatorId },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(tier.price_monthly * 100),
      currency: "usd",
      recurring: { interval: "month" },
    });
    stripePriceId = price.id;
    await admin.from("subscription_tiers").update({ stripe_price_id: price.id, stripe_product_id: product.id }).eq("id", tierId);
  }

  // Get or create Stripe customer
  let stripeCustomerId = profile?.stripe_customer_id as string | null;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: session.user.email || undefined, metadata: { user_id: session.user.id, profile_id: profile?.id || "" } });
    stripeCustomerId = customer.id;
    if (profile?.id) await admin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", profile.id);
  }

  const creator = tier.creators as { stripe_account_id?: string; stripe_account_enabled?: boolean };

  const checkoutParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${successUrl}?subscribed=1&tier=${tierId}`,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { tier_id: tierId, creator_id: creatorId, fan_id: profile?.id || "", user_id: session.user.id },
    },
    metadata: { tier_id: tierId, creator_id: creatorId, fan_id: profile?.id || "", type: "subscription" },
  };

  if (creator?.stripe_account_id && creator?.stripe_account_enabled) {
    checkoutParams.subscription_data!.application_fee_percent = 10;
    checkoutParams.subscription_data!.transfer_data = { destination: creator.stripe_account_id };
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);
  return NextResponse.json({ url: checkoutSession.url });
}
