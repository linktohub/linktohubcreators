import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { creatorId, eventType, metadata } = await req.json();

  if (!creatorId || !eventType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const ua = req.headers.get("user-agent") || "";
  const isMobile = /Mobi|Android/i.test(ua);
  const referrer = req.headers.get("referer") || "";
  const country = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;
  const city = req.headers.get("x-vercel-ip-city") || null;

  await supabase.from("analytics_events").insert({
    creator_id: creatorId,
    event_type: eventType,
    metadata: metadata || {},
    country,
    city,
    device_type: isMobile ? "mobile" : "desktop",
    browser: ua.slice(0, 200),
    referrer: referrer.slice(0, 500),
  });

  return NextResponse.json({ ok: true });
}
