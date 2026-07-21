import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDripD3, sendDripD7 } from "@/lib/email";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: d3Subscribers } = await admin
    .from("email_subscribers")
    .select("id, email, full_name, creator_id")
    .eq("subscribed", true)
    .lte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    .is("drip_d3_sent_at", null)
    .limit(100);

  const { data: d7Subscribers } = await admin
    .from("email_subscribers")
    .select("id, email, full_name, creator_id")
    .eq("subscribed", true)
    .lte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .is("drip_d7_sent_at", null)
    .limit(100);

  let d3Sent = 0;
  let d7Sent = 0;

  const creatorCache = new Map<string, { display_name: string; username: string }>();

  async function getCreator(creatorId: string) {
    if (creatorCache.has(creatorId)) return creatorCache.get(creatorId)!;
    const { data } = await admin
      .from("creators")
      .select("display_name, username")
      .eq("id", creatorId)
      .single();
    if (!data) return null;
    creatorCache.set(creatorId, data);
    return data;
  }

  for (const sub of d3Subscribers ?? []) {
    const creator = await getCreator(sub.creator_id);
    if (!creator) continue;

    const { data: products } = await admin
      .from("products")
      .select("title, price")
      .eq("creator_id", sub.creator_id)
      .eq("active", true)
      .order("price", { ascending: false })
      .limit(3);

    await sendDripD3({
      to: sub.email,
      subscriberName: sub.full_name ?? undefined,
      creatorName: creator.display_name,
      creatorUsername: creator.username,
      topProducts: products ?? [],
    });

    await admin
      .from("email_subscribers")
      .update({ drip_d3_sent_at: new Date().toISOString() })
      .eq("id", sub.id);

    d3Sent++;
  }

  for (const sub of d7Subscribers ?? []) {
    const creator = await getCreator(sub.creator_id);
    if (!creator) continue;

    await sendDripD7({
      to: sub.email,
      subscriberName: sub.full_name ?? undefined,
      creatorName: creator.display_name,
      creatorUsername: creator.username,
    });

    await admin
      .from("email_subscribers")
      .update({ drip_d7_sent_at: new Date().toISOString() })
      .eq("id", sub.id);

    d7Sent++;
  }

  return NextResponse.json({ d3_sent: d3Sent, d7_sent: d7Sent });
}
