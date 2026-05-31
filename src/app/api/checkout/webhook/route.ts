import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGelatoOrder } from "@/lib/gelato";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const creatorId = pi.metadata.creator_id;
    const rawItems: { id: string; quantity: number }[] = JSON.parse(
      pi.metadata.items || "[]"
    );

    if (!creatorId || !rawItems.length) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    // Fetch full product details for all items
    const productIds = rawItems.map((i) => i.id);
    const { data: products } = await supabase
      .from("products")
      .select("id, title, price, type, pod_product_id, pod_variant_id, images")
      .in("id", productIds);

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const totalCents = rawItems.reduce((sum, item) => {
      const p = productMap.get(item.id);
      return sum + (p ? Math.round(p.price * 100) * item.quantity : 0);
    }, 0);

    const platformFeeCents = Math.round(totalCents * 0.1);
    const creatorPayoutCents = totalCents - platformFeeCents;

    // Shipping from Stripe PI
    const piShipping = pi.shipping;

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        creator_id: creatorId,
        stripe_payment_intent_id: pi.id,
        subtotal: totalCents,
        platform_fee: platformFeeCents,
        creator_payout: creatorPayoutCents,
        total: totalCents,
        status: "paid",
        shipping_name: piShipping?.name || null,
        shipping_address: piShipping?.address || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[checkout-webhook] Order insert failed:", orderError?.message);
      return NextResponse.json({ received: true });
    }

    // Insert order items
    const orderItems = rawItems
      .filter((item) => productMap.has(item.id))
      .map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: Math.round((productMap.get(item.id)?.price ?? 0) * 100),
      }));

    if (orderItems.length) {
      await supabase.from("order_items").insert(orderItems);
    }

    // Update creator revenue stat (best-effort)
    supabase
      .rpc("increment_creator_revenue", {
        p_creator_id: creatorId,
        p_amount: totalCents / 100,
      })
      .then(({ error }) => {
        if (error) console.error("[checkout-webhook] Revenue RPC failed:", error.message);
      });

    // Submit Gelato order for physical/merch items
    const physicalItems = rawItems.filter((item) => {
      const p = productMap.get(item.id);
      return p && (p.type === "merch" || p.type === "physical") && p.pod_product_id;
    });

    if (physicalItems.length > 0 && piShipping?.address) {
      const addr = piShipping.address;
      const nameParts = (piShipping.name || "").split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || ".";

      const gelatoItems = physicalItems.map((item) => {
        const p = productMap.get(item.id)!;
        return {
          itemReferenceId: item.id,
          productUid: p.pod_product_id!,
          variantUid: p.pod_variant_id || p.pod_product_id!,
          quantity: item.quantity,
          files: p.images?.[0]
            ? [{ type: "default", url: p.images[0] }]
            : [],
        };
      });

      try {
        const gelatoOrder = await createGelatoOrder({
          orderReferenceId: order.id,
          customerReferenceId: pi.receipt_email || order.id,
          currency: "USD",
          items: gelatoItems,
          shippingAddress: {
            firstName,
            lastName,
            addressLine1: addr.line1 || "",
            city: addr.city || "",
            postCode: addr.postal_code || "",
            country: addr.country || "US",
            email: pi.receipt_email || "",
          },
        });

        await supabase
          .from("orders")
          .update({
            pod_order_id: gelatoOrder.id,
            status: "fulfilled",
            tracking_number: gelatoOrder.shipments?.[0]?.trackingCode || null,
            tracking_url: gelatoOrder.shipments?.[0]?.trackingUrl || null,
          })
          .eq("id", order.id);
      } catch (err) {
        // Non-fatal: log and continue — order is still recorded
        console.error("[checkout-webhook] Gelato order failed:", err);
      }
    }

    // Send order confirmation email
    if (pi.receipt_email) {
      const { data: creator } = await supabase
        .from("creators")
        .select("display_name")
        .eq("id", creatorId)
        .single();

      const emailItems = rawItems
        .filter((item) => productMap.has(item.id))
        .map((item) => {
          const p = productMap.get(item.id)!;
          return {
            name: p.title,
            quantity: item.quantity,
            unitPrice: Math.round(p.price * 100),
          };
        });

      try {
        await sendOrderConfirmation({
          to: pi.receipt_email,
          buyerName: piShipping?.name || "there",
          creatorName: creator?.display_name || "the creator",
          items: emailItems,
          totalCents,
          orderId: order.id,
        });
      } catch (err) {
        console.error("[checkout-webhook] Resend email failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
