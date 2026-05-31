import { NextRequest, NextResponse } from "next/server";
import { createGelatoOrder } from "@/lib/gelato";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();

  try {
    const order = await createGelatoOrder(body);

    // Update order tracking in DB if orderId provided
    if (body.internalOrderId) {
      await supabase.from("orders").update({
        pod_order_id: order.id,
        tracking_number: order.shipments?.[0]?.trackingCode || null,
        tracking_url: order.shipments?.[0]?.trackingUrl || null,
        status: "fulfilled",
      }).eq("id", body.internalOrderId);
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
