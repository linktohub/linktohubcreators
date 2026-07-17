import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createGelatoOrder } from "@/lib/gelato";
import { createPrintifyOrder } from "@/lib/printify";
import { sendOrderConfirmation } from "@/lib/email";
import { generateAndStorePdf } from "@/lib/pdf-generator";

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

  // Stripe Checkout completed — handle subscriptions, events, tips
  // Note: account.updated (Connect) is handled by /api/stripe/connect-webhook using STRIPE_CONNECT_WEBHOOK_SECRET
  if (event.type === "checkout.session.completed") {
    const sess = event.data.object as Stripe.Checkout.Session;
    const meta = sess.metadata || {};

    // Creator platform subscription (no `type` field, but has `plan_tier`)
    if (meta.plan_tier && meta.creator_id && !meta.type) {
      const subId = sess.subscription as string;
      const customerId = sess.customer as string;
      const feeRates: Record<string, number> = { starter: 0.06, pro: 0.045, business: 0.03 };
      const amounts: Record<string, number> = { starter: 29, pro: 49, business: 99 };

      await admin.from("creator_subscriptions").upsert({
        creator_id: meta.creator_id,
        plan_tier: meta.plan_tier,
        stripe_subscription_id: subId,
        stripe_customer_id: customerId,
        status: "active",
        amount_monthly: amounts[meta.plan_tier] || 29,
      }, { onConflict: "stripe_subscription_id" });

      await admin.from("creators").update({
        plan_tier: meta.plan_tier,
        plan_stripe_subscription_id: subId,
        transaction_fee_pct: feeRates[meta.plan_tier] ?? 0.06,
      }).eq("id", meta.creator_id);

      return NextResponse.json({ received: true });
    }

    if (meta.type === "subscription" && meta.tier_id && meta.creator_id) {
      const subId = sess.subscription as string | null;
      let periodStart: string | null = null;
      let periodEnd: string | null = null;
      let stripePriceId: string | null = null;

      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          const item = sub.items.data[0];
          stripePriceId = item?.price.id || null;
          const start = (sub as unknown as { current_period_start: number }).current_period_start;
          const end = (sub as unknown as { current_period_end: number }).current_period_end;
          if (typeof start === "number") periodStart = new Date(start * 1000).toISOString();
          if (typeof end === "number") periodEnd = new Date(end * 1000).toISOString();
        } catch { /* non-critical */ }
      }

      await admin.from("fan_subscriptions").insert({
        creator_id: meta.creator_id,
        fan_id: meta.fan_id || null,
        tier_name: meta.tier_id,
        price_monthly: sess.amount_total ? sess.amount_total / 100 : 0,
        stripe_subscription_id: subId || null,
        stripe_price_id: stripePriceId,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
      });
    }

    if (meta.type === "event" && meta.event_id && meta.fan_id) {
      await admin.from("event_registrations").insert({
        event_id: meta.event_id,
        fan_id: meta.fan_id,
        stripe_payment_intent_id: (sess.payment_intent as string) || null,
        status: "registered",
      });
    }

    if (meta.type === "tip" && meta.creator_id) {
      await admin.from("tips").insert({
        creator_id: meta.creator_id,
        amount: sess.amount_total || 0,
        message: meta.message || null,
        stripe_payment_intent_id: (sess.payment_intent as string) || null,
      });
    }

    return NextResponse.json({ received: true });
  }

  // Subscription cancelled
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;

    // Check if this is a creator platform subscription
    const { data: creatorSub } = await admin
      .from("creator_subscriptions")
      .select("creator_id")
      .eq("stripe_subscription_id", sub.id)
      .single();

    if (creatorSub) {
      await admin.from("creator_subscriptions").update({ status: "cancelled" }).eq("stripe_subscription_id", sub.id);
      await admin.from("creators").update({
        plan_tier: "trial",
        plan_stripe_subscription_id: null,
        transaction_fee_pct: 0.06,
      }).eq("id", creatorSub.creator_id);
    } else {
      await admin.from("fan_subscriptions").update({ status: "cancelled" }).eq("stripe_subscription_id", sub.id);
    }

    return NextResponse.json({ received: true });
  }

  if (event.type !== "payment_intent.succeeded") return NextResponse.json({ received: true });

  // Product purchase (merch + digital)
  const pi = event.data.object as Stripe.PaymentIntent;
  const creatorId = pi.metadata.creator_id;
  const itemsMeta: { id: string; quantity: number }[] = JSON.parse(pi.metadata.items || "[]");
  const customerEmail = pi.metadata.customer_email || pi.receipt_email || "";
  // Fall back to Stripe's native shipping field — metadata field may not always be set
  const shippingName = pi.metadata.shipping_name || pi.shipping?.name || "";
  const shippingAddress = pi.metadata.shipping_address
    ? JSON.parse(pi.metadata.shipping_address)
    : pi.shipping?.address
    ? {
        firstName:    (pi.shipping.name || "").split(" ")[0] || "",
        lastName:     (pi.shipping.name || "").split(" ").slice(1).join(" ") || "",
        addressLine1: pi.shipping.address.line1 || "",
        city:         pi.shipping.address.city || "",
        postCode:     pi.shipping.address.postal_code || "",
        country:      pi.shipping.address.country || "US",
      }
    : null;

  const totalCents = pi.amount;

  // Read creator's actual fee rate — avoids hardcoding 10% for Starter creators (real rate: 6%)
  const { data: creatorRecord } = await admin
    .from("creators")
    .select("transaction_fee_pct")
    .eq("id", creatorId)
    .single();
  const feeRate = (creatorRecord?.transaction_fee_pct as number) ?? 0.06;
  const platformFee = Math.round(totalCents * feeRate);
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

  // Affiliate commission: check if buyer came via affiliate referral
  const fanId = pi.metadata.fan_id || "";
  if (fanId) {
    const { data: referral } = await admin
      .from("affiliate_referrals")
      .select("referral_code, referrer_creator_id")
      .eq("referred_user_id", fanId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (referral) {
      const commissionRate = 0.20;
      const commissionCents = Math.round(platformFee * commissionRate);
      await admin.from("affiliate_commissions").insert({
        order_id: order.id,
        referral_code: referral.referral_code,
        referrer_creator_id: referral.referrer_creator_id,
        commission_cents: commissionCents,
        status: "pending",
      });
      try {
        await admin.rpc("increment_affiliate_earnings", {
          p_creator_id: referral.referrer_creator_id,
          p_amount: commissionCents / 100,
        });
      } catch { /* non-critical */ }
    }
  }

  // Auto-subscribe buyer to creator's email list
  if (customerEmail) {
    await admin.from("email_subscribers").upsert({
      creator_id: creatorId,
      email: customerEmail,
      full_name: shippingName || null,
      source: "purchase",
      subscribed: true,
    }, { onConflict: "creator_id,email", ignoreDuplicates: true });
  }

  const productIds = itemsMeta.map((i) => i.id);
  const { data: products } = await admin
    .from("products")
    .select("id, type, title, file_type, file_url, pod_provider, pod_product_id, pod_variant_id, price, images")
    .in("id", productIds);

  const downloadUrls: { product_id: string; title: string; url: string }[] = [];

  for (const item of itemsMeta) {
    const product = products?.find((p) => p.id === item.id);
    if (!product) continue;

    if (product.type === "merch" && shippingAddress && product.pod_product_id && product.pod_variant_id) {
      try {
        if (product.pod_provider === "printify") {
          const [providerIdStr, variantIdStr] = product.pod_variant_id.split("|");
          const printifyOrder = await createPrintifyOrder({
            line_items: [{
              blueprint_id: Number(product.pod_product_id),
              print_provider_id: Number(providerIdStr),
              variant_id: Number(variantIdStr),
              print_areas: product.images?.[0] ? { front: { src: product.images[0] } } : {},
              quantity: item.quantity,
            }],
            shipping_method: 1,
            address_to: {
              first_name: shippingAddress.firstName || shippingName.split(" ")[0] || "",
              last_name: shippingAddress.lastName || shippingName.split(" ").slice(1).join(" ") || "",
              email: customerEmail,
              address1: shippingAddress.addressLine1,
              city: shippingAddress.city,
              zip: shippingAddress.postCode,
              country: shippingAddress.country,
            },
          });
          await admin.from("orders").update({ printify_order_id: printifyOrder.id, status: "fulfilled" }).eq("id", order.id);
        } else {
          const gelatoOrder = await createGelatoOrder({
            orderReferenceId: order.id,
            customerReferenceId: customerEmail,
            currency: "USD",
            items: [{
              itemReferenceId: item.id,
              productUid: product.pod_product_id,
              variantUid: product.pod_variant_id,
              quantity: item.quantity,
              files: product.images?.[0]
                ? [{ type: "default", url: product.images[0] }]
                : [],
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
        }
      } catch (err) {
        console.error("POD order failed:", err);
      }
    }

    if (product.type === "digital" && customerEmail) {
      let fileUrl = product.file_url;
      if (!fileUrl && (product.file_type === "pdf" || product.file_type === "course")) {
        try {
          fileUrl = await generateAndStorePdf(product.id, admin);
        } catch (err) {
          console.error("[webhook] auto-generate PDF failed:", err);
        }
      }

      const { data: token } = await admin.from("purchase_tokens").insert({
        order_id: order.id,
        product_id: product.id,
        buyer_email: customerEmail,
        delivery_pending: !fileUrl,
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

  // Send order confirmation email to buyer
  if (customerEmail) {
    const { data: creator } = await admin.from("creators").select("display_name").eq("id", creatorId).single();
    const emailItems = (products || [])
      .filter((p) => itemsMeta.find((i) => i.id === p.id))
      .map((p) => {
        const item = itemsMeta.find((i) => i.id === p.id)!;
        return { name: p.title, quantity: item.quantity, unitPrice: Math.round(p.price * 100) };
      });
    await sendOrderConfirmation({
      to: customerEmail,
      buyerName: shippingName,
      creatorName: creator?.display_name || "the creator",
      items: emailItems,
      totalCents,
      orderId: order.id,
      downloadUrls: downloadUrls.map((d) => ({ title: d.title, url: d.url })),
    }).catch(async (err) => {
      console.error("[webhook] email failed:", err);
      await admin.from("orders").update({ email_failed: true }).eq("id", order.id);
    });
  }

  return NextResponse.json({ received: true });
}
