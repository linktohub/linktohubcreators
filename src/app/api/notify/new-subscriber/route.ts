import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewSubscriberNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { creatorId, subscriberEmail } = await req.json();
  if (!creatorId || !subscriberEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("email, display_name")
    .eq("id", creatorId)
    .single();

  if (!creator?.email) {
    return NextResponse.json({ ok: true }); // no email configured, skip silently
  }

  try {
    await sendNewSubscriberNotification({
      creatorEmail: creator.email,
      creatorName: creator.display_name || "Your storefront",
      subscriberEmail,
    });
  } catch (err) {
    console.error("[new-subscriber] Resend failed:", err);
  }

  return NextResponse.json({ ok: true });
}
