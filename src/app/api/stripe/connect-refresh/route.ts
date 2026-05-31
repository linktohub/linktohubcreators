import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://linktohub.vercel.app";

  if (!user) return NextResponse.redirect(`${origin}/dashboard/payouts`);

  const { data: creator } = await supabase
    .from("creators")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.redirect(`${origin}/dashboard/payouts`);
  }

  const link = await stripe.accountLinks.create({
    account: creator.stripe_account_id as string,
    refresh_url: `${origin}/api/stripe/connect-refresh`,
    return_url: `${origin}/dashboard/payouts?connected=1`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url);
}
