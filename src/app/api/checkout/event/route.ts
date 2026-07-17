import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Login required", auth: true }, { status: 401 });

  const { eventId, successUrl, cancelUrl } = await req.json();
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: event } = await admin
    .from("events")
    .select("*, creators(stripe_account_id, stripe_account_enabled, display_name, transaction_fee_pct)")
    .eq("id", eventId)
    .single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let { data: profile } = await admin.from("profiles").select("id, stripe_customer_id").eq("user_id", session.user.id).single();
  if (!profile) {
    const { data: np } = await admin.from("profiles").insert({
      user_id: session.user.id,
      email: session.user.email,
    }).select("id, stripe_customer_id").single();
    profile = np;
  }

  const creator = event.creators as { stripe_account_id?: string; stripe_account_enabled?: boolean; transaction_fee_pct?: number };

  // Free events — register directly without payment
  if (!event.price || event.price === 0) {
    if (profile?.id) {
      await admin.from("event_registrations").insert({
        event_id: eventId,
        fan_id: profile.id,
        status: "registered",
      });
    }
    return NextResponse.json({ url: `${successUrl}?registered=1` });
  }

  const checkoutParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer_email: session.user.email || undefined,
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: Math.round(event.price * 100),
        product_data: {
          name: event.title,
          description: event.description || undefined,
        },
      },
      quantity: 1,
    }],
    success_url: `${successUrl}?registered=1`,
    cancel_url: cancelUrl,
    metadata: {
      event_id: eventId,
      fan_id: profile?.id || "",
      user_id: session.user.id,
      type: "event",
    },
  };

  if (creator?.stripe_account_id && creator?.stripe_account_enabled) {
    checkoutParams.payment_intent_data = {
      application_fee_amount: Math.round(event.price * 100 * (creator?.transaction_fee_pct ?? 0.06)),
      transfer_data: { destination: creator.stripe_account_id },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);
  return NextResponse.json({ url: checkoutSession.url });
}
