import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enabled } = await req.json() as { enabled: boolean };

  const { data: creator } = await supabase
    .from("creators")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.json({ error: "No Stripe account" }, { status: 400 });
  }

  await stripe.accounts.update(creator.stripe_account_id, {
    settings: {
      payouts: {
        schedule: enabled
          ? { interval: "manual" }
          : { interval: "daily", delay_days: 2 },
      },
    },
  });

  const admin = createAdminClient();
  await admin.from("creators").update({ instant_payouts_enabled: enabled }).eq("id", creator.id);

  return NextResponse.json({ ok: true });
}
