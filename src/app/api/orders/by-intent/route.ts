import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const piId = req.nextUrl.searchParams.get("pi");
  if (!piId) return NextResponse.json({ error: "Missing pi" }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order } = await admin
    .from("orders")
    .select("id, status, download_urls")
    .eq("stripe_payment_intent_id", piId)
    .single();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: order.status,
    download_urls: order.download_urls || [],
  });
}
