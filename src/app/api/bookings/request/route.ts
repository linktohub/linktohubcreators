import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingRequest, sendBookingConfirmationToFan } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { creatorId, productId, fanName, fanEmail, preferredDate, preferredTime, message } = await req.json();

  if (!creatorId || !productId || !fanName || !fanEmail || !preferredDate || !preferredTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: product }, { data: creator }] = await Promise.all([
    admin.from("products").select("title, price, metadata").eq("id", productId).eq("creator_id", creatorId).single(),
    admin.from("creators").select("email, display_name, username").eq("id", creatorId).single(),
  ]);

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  const metadata = product.metadata as { duration_minutes?: number } | null;
  const durationMinutes = metadata?.duration_minutes || 60;
  const scheduledAt = new Date(`${preferredDate}T${preferredTime}:00`).toISOString();

  const { error } = await admin.from("bookings").insert({
    creator_id: creatorId,
    product_id: productId,
    title: product.title,
    duration_minutes: durationMinutes,
    price: product.price,
    scheduled_at: scheduledAt,
    status: "pending",
    notes: message || null,
    fan_name: fanName,
    fan_email: fanEmail,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://linktohub.vercel.app";
  const creatorName = creator.display_name || creator.username;

  await Promise.allSettled([
    creator.email
      ? sendBookingRequest({
          creatorEmail: creator.email,
          creatorName,
          fanName,
          fanEmail,
          productTitle: product.title,
          durationMinutes,
          preferredDate,
          preferredTime,
          message,
          dashboardUrl: `${origin}/dashboard/bookings`,
        })
      : Promise.resolve(),
    sendBookingConfirmationToFan({
      to: fanEmail,
      creatorName,
      productTitle: product.title,
      preferredDate,
      preferredTime,
    }),
  ]);

  return NextResponse.json({ success: true });
}
