import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("id, stripe_account_id, email, display_name")
    .eq("user_id", session.user.id)
    .single();
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  let accountId = creator.stripe_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: creator.email || session.user.email || undefined,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { name: creator.display_name || undefined },
    });
    accountId = account.id;
    await supabase.from("creators").update({ stripe_account_id: accountId }).eq("id", creator.id);
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://linktohub.vercel.app";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/stripe/connect`,
    return_url: `${origin}/dashboard/payouts?setup=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
