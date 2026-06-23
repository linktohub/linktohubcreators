import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewSubscriberNotification, sendSubscriberWelcome } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { creatorId, subscriberEmail } = await req.json();
  if (!creatorId || !subscriberEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("email, display_name, username")
    .eq("id", creatorId)
    .single();

  if (!creator?.email) {
    return NextResponse.json({ ok: true });
  }

  const { data: topProducts } = await supabase
    .from("products")
    .select("title, price, type")
    .eq("creator_id", creatorId)
    .eq("active", true)
    .order("price", { ascending: false })
    .limit(3);

  try {
    await Promise.all([
      sendNewSubscriberNotification({
        creatorEmail: creator.email,
        creatorName: creator.display_name || "Your storefront",
        subscriberEmail,
      }),
      sendSubscriberWelcome({
        to: subscriberEmail,
        creatorName: creator.display_name || "the creator",
        creatorUsername: creator.username || "",
        topProducts: topProducts || [],
      }),
    ]);
  } catch (err) {
    console.error("[new-subscriber] email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
