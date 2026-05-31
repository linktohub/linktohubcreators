import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  let accountId = creator.stripe_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({ type: "express" });
    accountId = account.id;
    await supabase.from("creators").update({ stripe_account_id: accountId }).eq("id", creator.id);
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://linktohub.vercel.app";

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/stripe/connect-refresh`,
    return_url: `${origin}/dashboard/payouts?connected=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
