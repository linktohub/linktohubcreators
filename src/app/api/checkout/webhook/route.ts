import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createGelatoOrder } from "@/lib/gelato";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Handle Stripe Connect account updates
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    if (account.charges_enabled) {
      await admin.from("creators").update({ stripe_account_enabled: true }).eq("stripe_account_id", account.id);
    }
    return NextResponse.json({ received: true });
  }

  if (event.type !== "payment_intent.succeeded") return NextResponse.json({ received: true });

  const pi = event.data.object as Stripe.PaymentIntent;
  const creatorId = pi.metadata.creator_id;
  const itemsMeta: { id: string; quantity: number }[] = JSON.parse(pi.metadata.items || "[]");
  const customerEmail = pi.metadata.customer_email || pi.receipt_email || "";
  const shippingName = pi.metadata.shipping_name || "";
  const shippingAddress = pi.metadata.shipping_address ? JSON.parse(pi.metadata.shipping_address) : null;

  const totalCents = pi.amount;
  const platformFee = Math.round(totalCents * 0.10);
  const creatorPayout = totalCents - platformFee;

  const { data: order } = await admin.from("orders").insert({
    creator_id: creatorId,
    stripe_payment_intent_id: pi.id,
    subtotal: totalCents,
    platform_fee: platformFee,
    creator_payout: creatorPayout,
    total: totalCents,
    status: "paid",
    shipping_name: shippingName || null,
    shipping_address: shippingAddress || null,
  }).select("id").single();

  if (!order) return NextResponse.json({ received: true });

  const productIds = itemsMeta.map((i) => i.id);
  const { data: products } = await admin
    .from("products")
    .select("id, type, file_type, title, file_url, pod_provider, pod_product_id, pod_variant_id")
    .in("id", productIds);

  const downloadUrls: { product_id: string; title: string; url: string }[] = [];
  let gelatoCalled = false;

  for (const item of itemsMeta) {
    const product = products?.find((p) => p.id === item.id);
    if (!product) continue;

    // Real Gelato order for merch with POD configured
    if (product.type === "merch" && shippingAddress && !gelatoCalled && product.pod_product_id && product.pod_variant_id) {
      try {
        const gelatoOrder = await createGelatoOrder({
          orderReferenceId: order.id,
          customerReferenceId: customerEmail,
          currency: "USD",
          items: [{
            itemReferenceId: item.id,
            productUid: product.pod_product_id,
            variantUid: product.pod_variant_id,
            quantity: item.quantity,
            files: [],
          }],
          shippingAddress: {
            firstName: shippingAddress.firstName || shippingName.split(" ")[0] || "",
            lastName: shippingAddress.lastName || shippingName.split(" ").slice(1).join(" ") || "",
            addressLine1: shippingAddress.addressLine1,
            city: shippingAddress.city,
            postCode: shippingAddress.postCode,
            country: shippingAddress.country,
            email: customerEmail,
          },
        });
        await admin.from("orders").update({ pod_order_id: gelatoOrder.id, status: "fulfilled" }).eq("id", order.id);
        gelatoCalled = true;
      } catch (err) {
        console.error("Gelato order failed:", err);
      }
    }

    // Secure download link for digital products
    if (product.type === "digital" && customerEmail) {
      const { data: token } = await admin.from("purchase_tokens").insert({
        order_id: order.id,
        product_id: product.id,
        buyer_email: customerEmail,
      }).select("token").single();

      if (token) {
        const origin = process.env.NEXT_PUBLIC_APP_URL || "https://linktohub.vercel.app";
        downloadUrls.push({ product_id: product.id, title: product.title, url: `${origin}/api/download?token=${token.token}` });
      }
    }
  }

  if (downloadUrls.length > 0) {
    await admin.from("orders").update({ download_urls: downloadUrls }).eq("id", order.id);
  }

  try {
    await admin.rpc("increment_creator_revenue", { p_creator_id: creatorId, p_amount: totalCents / 100 });
  } catch { /* non-critical */ }

  return NextResponse.json({ received: true });
}
